class_name WorldMap
## Port of src/world/map.ts. The farm is the west part of the map (x < 38); the town is
## east of the forest strip.

const W := 76
const H := 36
const FARM_W := 38

## The farm field the player clears and plants.
const FARM := {"x0": 10, "y0": 13, "x1": 27, "y1": 28}

## The town: its square, the community garden, and where the road runs.
const TOWN := {
	"x0": 42,
	"road": 11,
	"square": {"x0": 52, "y0": 13, "x1": 60, "y1": 19},
	"garden": {"x0": 63, "y0": 21, "x1": 69, "y1": 27},
}

const BUILDING_SIZE := {
	"house": [5, 4], "store": [5, 4], "shippingBin": [1, 1],
	"composter": [1, 1], "rainBarrel": [1, 1], "beehive": [1, 1], "birdHouse": [1, 1], "bugHotel": [1, 1], "scarecrow": [1, 1],
	"greenhouse": [5, 5], "fence": [1, 1], "flowerBed": [1, 1], "pathStone": [1, 1],
	"well": [1, 1], "chickenCoop": [2, 2], "smallBarn": [3, 3], "chest": [1, 1],
	"extension": [5, 4], "cottage": [4, 4], "fountain": [2, 2], "noticeBoard": [1, 1], "field": [5, 3], "lamp": [1, 1], "prop": [1, 1],
	"barn": [4, 4], "silo": [2, 2], "windmill": [3, 2], "waterTower": [2, 2],
}

## Slots in a storage chest.
const CHEST_SIZE := 20

## Buildings you can walk over.
const WALKABLE_BUILDINGS := ["pathStone", "flowerBed"]

## Town buildings the player can't build, pick up, or build over.
const TOWN_KINDS := [
	"house", "store", "shippingBin", "chest", "extension", "cottage", "fountain", "noticeBoard", "field", "lamp", "prop", "barn", "silo", "windmill", "waterTower",
]


static func idx(x: int, y: int) -> int:
	return y * W + x


static func in_bounds(x: int, y: int) -> bool:
	return x >= 0 and y >= 0 and x < W and y < H


static func size_of(kind: String) -> Array:
	return BUILDING_SIZE[kind]


## Door tile for buildings you enter or use from the front (bottom center), or null.
static func door_of(b: Dictionary) -> Variant:
	var sz := size_of(b.kind)
	if b.kind in ["house", "store", "greenhouse", "extension", "cottage"]:
		return {"x": int(b.x) + sz[0] / 2, "y": int(b.y) + sz[1] - 1}
	return null


## Inner tiles of a greenhouse (plantable, sheltered).
static func greenhouse_interior(b: Dictionary) -> Array:
	var out := []
	for y in range(int(b.y) + 1, int(b.y) + 4):
		for x in range(int(b.x) + 1, int(b.x) + 4):
			out.append({"x": x, "y": y})
	return out


static func _degraded_soil(r: Rng.Stream) -> Dictionary:
	var om := Js.round(16 + r.next() * 10)
	var life := Js.round(14 + r.next() * 10)
	var structure := Js.round(18 + r.next() * 10)
	var water := Js.round(26 + r.next() * 8)
	var nutrients := Js.round(30 + r.next() * 14)
	var ph := Js.round((5.5 + r.next() * 0.6) * 10) / 10
	return {"om": om, "life": life, "structure": structure, "water": water, "nutrients": nutrients, "ph": ph}


static func _tile(ground: String, soil: Dictionary, obstacle: Variant = null, weeds := false) -> Dictionary:
	return {
		"ground": ground, "obstacle": obstacle, "weeds": weeds, "tilled": false, "moisture": 30, "mulch": false, "soil": soil,
		"known": {"lab": false, "shovel": false, "water": false},
		"crop": null, "lastFamily": null, "familyStreak": 0, "greenhouse": false,
	}


static func _empty(n: int) -> Array:
	var a := []
	a.resize(n)
	return a


static func farm_buildings() -> Array:
	return [
		{"id": "house", "kind": "house", "x": 8, "y": 5, "data": {}},
		{"id": "bin", "kind": "shippingBin", "x": 13, "y": 9, "data": {}},
		# Grandma Rosa's tool chest, on the other side of the front door from the shipping bin.
		{"id": "chest", "kind": "chest", "x": 7, "y": 9, "data": {"items": _empty(CHEST_SIZE)}},
		# Grandma Rosa's old barn and silo, east of the house.
		{"id": "farm-barn", "kind": "barn", "x": 15, "y": 4, "data": {}},
		{"id": "farm-silo", "kind": "silo", "x": 19, "y": 5, "data": {}},
	]


## Everything in town. Ids are fixed so old saves can be upgraded by adding what's missing.
static func town_buildings() -> Array:
	var lamp := func(id: String, x: int, y: int) -> Dictionary: return {"id": id, "kind": "lamp", "x": x, "y": y, "data": {}}
	return [
		{"id": "store", "kind": "store", "x": 43, "y": 6, "data": {"owner": "mei", "sign": "Seed & Soil Co."}},
		{"id": "extension", "kind": "extension", "x": 50, "y": 6, "data": {"owner": "amara", "sign": "County Extension Office"}},
		{"id": "june-cottage", "kind": "cottage", "x": 61, "y": 6, "data": {"owner": "june"}},
		{"id": "ortega-cottage", "kind": "cottage", "x": 43, "y": 22, "data": {"owner": "luis"}},
		{"id": "ortega-field", "kind": "field", "x": 49, "y": 23, "data": {"owner": "luis"}},
		{"id": "fountain", "kind": "fountain", "x": 55, "y": 15, "data": {}},
		{"id": "notice-board", "kind": "noticeBoard", "x": 58, "y": 13, "data": {}},
		lamp.call("lamp-1", 52, 13), lamp.call("lamp-2", 60, 13), lamp.call("lamp-3", 52, 19), lamp.call("lamp-4", 60, 19), lamp.call("lamp-5", 41, 10),
		{"id": "cart", "kind": "prop", "x": 47, "y": 9, "data": {"model": "town/cart"}},
		{"id": "june-flowers-1", "kind": "flowerBed", "x": 60, "y": 9, "data": {}},
		{"id": "june-flowers-2", "kind": "flowerBed", "x": 65, "y": 9, "data": {}},
		{"id": "square-flowers-1", "kind": "flowerBed", "x": 53, "y": 19, "data": {}},
		{"id": "square-flowers-2", "kind": "flowerBed", "x": 59, "y": 19, "data": {}},
		{"id": "garden-hive", "kind": "beehive", "x": 70, "y": 22, "data": {"owner": "june"}},
		{"id": "ortega-barn", "kind": "barn", "x": 55, "y": 22, "data": {"owner": "luis"}},
		{"id": "ortega-silo", "kind": "silo", "x": 59, "y": 22, "data": {"owner": "luis"}},
		{"id": "town-windmill", "kind": "windmill", "x": 67, "y": 14, "data": {}},
		{"id": "water-tower", "kind": "waterTower", "x": 43, "y": 14, "data": {}},
	]


static func create_map(seed: int) -> Dictionary:
	var r := Rng.stream(seed)
	var tiles := []
	var g: Dictionary = TOWN.garden
	for y in H:
		for x in W:
			var soil := _degraded_soil(r)
			# Forest around the edges, and a strip between the farm and town with a gap for the road.
			var strip: bool = x >= FARM_W and x < TOWN.x0 and (y < TOWN.road - 1 or y > TOWN.road + 1)
			var forest := y < 3 or x < 2 or x > W - 3 or y > H - 3 or (x < 7 and y > 26) or strip
			if forest:
				var forest_soil := Js.with(soil, {"om": 55 + Js.round(r.next() * 15), "life": 60})
				var obstacle: Variant = "tree" if r.next() < 0.55 else ("log" if r.next() < 0.15 else null)
				tiles.append(_tile("forest", forest_soil, obstacle))
				continue
			if x >= FARM.x0 and x <= FARM.x1 and y >= FARM.y0 and y <= FARM.y1:
				var k := r.next()
				var obstacle: Variant = "stone" if k < 0.06 else ("stick" if k < 0.13 else ("stump" if k < 0.15 else null))
				tiles.append(_tile("farm", soil, obstacle, obstacle == null and r.next() < 0.75))
				continue
			if (x - 33) * (x - 33) / 16.0 + (y - 27) * (y - 27) / 9.0 < 1:
				tiles.append(_tile("water", soil))
				continue
			var shore := (x - 33) * (x - 33) / 25.0 + (y - 27) * (y - 27) / 14.0 < 1
			if x >= g.x0 and x <= g.x1 and y >= g.y0 and y <= g.y1:
				# The town's neglected community garden: overgrown, waiting to be restored.
				var k := r.next()
				var obstacle: Variant = "stick" if k < 0.08 else ("stone" if k < 0.12 else null)
				tiles.append(_tile("farm", soil, obstacle, k >= 0.12 and r.next() < 0.85))
				continue
			# Town land is kept clear for buildings and paths; the farm side has a few trees.
			var scatter_trees := x < FARM_W and not shore and r.next() < 0.04
			tiles.append(_tile("sand" if shore else "grass", soil, "tree" if scatter_trees else null))

	var path := func(px: int, py: int) -> void:
		var t: Dictionary = tiles[idx(px, py)]
		t.ground = "path"
		t.obstacle = null
		t.weeds = false
	for py in range(9, 13):
		path.call(10, py)
	# The road runs east from the farm through the forest gap into town.
	for px in range(10, W - 3):
		path.call(px, TOWN.road)
	for px in range(TOWN.x0, W - 3):
		path.call(px, TOWN.road + 1)
	var sq: Dictionary = TOWN.square
	for py in range(sq.y0, sq.y1 + 1):
		for px in range(sq.x0, sq.x1 + 1):
			path.call(px, py)
	# Walkways to doors and the garden. (Doors face south, so the Ortegas' walkway wraps around.)
	for w in [[45, 10, 10], [52, 10, 10], [63, 10, 10], [47, 13, 26], [64, 13, 20]]:
		for py in range(w[1], w[2] + 1):
			path.call(w[0], py)
	for px in range(45, 48):
		path.call(px, 26)
	for px in range(48, sq.x0):
		path.call(px, 16)
	for px in range(sq.x1 + 1, 65):
		path.call(px, 16)

	var buildings := farm_buildings() + town_buildings()
	# Clear land under the buildings.
	for b in buildings:
		var sz := size_of(b.kind)
		for by in range(b.y, b.y + sz[1]):
			for bx in range(b.x, b.x + sz[0]):
				var t: Dictionary = tiles[idx(bx, by)]
				t.obstacle = null
				t.weeds = false
				if t.ground == "forest":
					t.ground = "grass"
	return {"tiles": tiles, "buildings": buildings}
