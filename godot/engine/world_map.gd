class_name WorldMap
## Port of src/world/map.ts. The farm is the west part of the map (x < 38); the town is
## east of the forest strip.

const W := 76
const H := 64
const FARM_W := 38
## The map was 36 rows tall before the South Fields were added below the forest belt.
const OLD_H := 36

## The farm field the player clears and plants.
const FARM := {"x0": 10, "y0": 13, "x1": 27, "y1": 28}
## More farmland south of the forest belt, opened plot by plot.
const SOUTH := {"x0": 10, "y0": 37, "x1": 33, "y1": 60}


static var _plots := []


## The farmland in 6×4-tile plots: 12 in the field by the house, 24 in the South Fields. A new
## farm owns only plot 0 (nearest the house); the rest are bought or earned from quests.
static func plots() -> Array:
	if _plots.is_empty():
		for a in [FARM, SOUTH]:
			var y: int = a.y0
			while y + 3 <= a.y1:
				var x: int = a.x0
				while x + 5 <= a.x1:
					_plots.append({"id": _plots.size(), "x0": x, "y0": y, "x1": x + 5, "y1": y + 3})
					x += 6
				y += 4
	return _plots



## The plot a tile is in, or -1 outside the farmland.
static func plot_at(x: int, y: int) -> int:
	for p in plots():
		if x >= p.x0 and x <= p.x1 and y >= p.y0 and y <= p.y1:
			return p.id
	return -1


## The price of the next plot, rising with how many you own.
static func plot_price(owned: int) -> int:
	return 100 + 40 * owned + 3 * owned * owned


## The path from beside the field, through the forest belt, and along the top of the South Fields.
static func south_path() -> Array:
	var out := []
	for y in range(29, SOUTH.y0):
		out.append([9, y])
	for x in range(10, SOUTH.x1 + 1):
		out.append([x, SOUTH.y0 - 1])
	return out

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
	"mineEntrance": [2, 2], "ladderUp": [1, 1], "ladderDown": [1, 1],
	"workbench": [1, 1], "grinder": [1, 1], "spinningWheel": [1, 1], "furnace": [1, 1],
}

## The mine entrance (2×2, opening south onto the road), and the size of each mine floor.
const MINE_ENTRANCE := {"x": 71, "y": 8}
const MINE_W := 24
const MINE_H := 18
## Where you arrive on a floor: the ladder up is here, and you stand just south of it.
const MINE_START := {"x": 12, "y": 8}

## Slots in a storage chest.
const CHEST_SIZE := 20

## Buildings you can walk over.
const WALKABLE_BUILDINGS := ["pathStone", "flowerBed"]

## Town buildings the player can't build, pick up, or build over.
const TOWN_KINDS := [
	"house", "store", "shippingBin", "extension", "cottage", "fountain", "noticeBoard", "field", "lamp", "prop", "barn", "silo", "windmill", "waterTower",
	"mineEntrance", "ladderUp", "ladderDown",
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
		# The old mine, past the town at the east end of the road.
		{"id": "mine-entrance", "kind": "mineEntrance", "x": MINE_ENTRANCE.x, "y": MINE_ENTRANCE.y, "data": {}},
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
			# The old south edge is now a forest belt between the field and the South Fields.
			var belt := y > OLD_H - 3 and y < OLD_H
			var south := y >= OLD_H
			var forest := y < 3 or x < 2 or x > W - 3 or y > H - 3 or belt or (x < 7 and y > 26 and not south) or strip or (south and x >= FARM_W)
			if south and not forest:
				if x >= SOUTH.x0 and x <= SOUTH.x1 and y >= SOUTH.y0 and y <= SOUTH.y1:
					var k := r.next()
					var obstacle: Variant = "stone" if k < 0.07 else ("stick" if k < 0.13 else ("stump" if k < 0.17 else ("log" if k < 0.19 else null)))
					tiles.append(_tile("farm", soil, obstacle, obstacle == null and r.next() < 0.8))
				else:
					tiles.append(_tile("grass", soil, "tree" if r.next() < 0.08 else null))
				continue
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
	for w in [[45, 10, 10], [52, 10, 10], [63, 10, 10], [47, 13, 26], [64, 13, 20], [72, 10, 10]]:
		for py in range(w[1], w[2] + 1):
			path.call(w[0], py)
	for px in range(45, 48):
		path.call(px, 26)
	# Down past the field and through the forest belt to the South Fields.
	for p in south_path():
		path.call(p[0], p[1])
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


# ───────────────────────── the mine ─────────────────────────

const CAVE_SOIL := {"om": 0, "life": 0, "structure": 0, "water": 0, "nutrients": 0, "ph": 7}


## Which ores show up how often, by depth: copper and tin near the top, gold and mithril deep down.
static func ore_chances(level: int) -> Array:
	if level < 5:
		return [["copperOre", 0.12], ["tinOre", 0.08]]
	if level < 10:
		return [["copperOre", 0.1], ["tinOre", 0.08], ["ironOre", 0.06]]
	if level < 20:
		return [["copperOre", 0.05], ["tinOre", 0.05], ["ironOre", 0.1], ["goldOre", 0.04]]
	if level < 30:
		return [["ironOre", 0.1], ["goldOre", 0.06], ["mithrilOre", 0.03]]
	return [["ironOre", 0.08], ["goldOre", 0.08], ["mithrilOre", 0.07]]


## A fresh floor of the mine: a winding cave carved by random walkers, full of rocks, some with
## ore. The ladder down hides under one rock far from the start. Floors differ each day.
static func mine_floor(seed: int, level: int, day: int) -> Dictionary:
	var r := Rng.stream(seed ^ U32.imul(level, 0x9e3779b1) ^ U32.imul(day, 0x85ebca6b))
	var tiles := []
	for i in MINE_W * MINE_H:
		tiles.append(_tile("caveWall", CAVE_SOIL.duplicate()))
	var carve := func(x: int, y: int) -> void:
		tiles[y * MINE_W + x] = _tile("cave", CAVE_SOIL.duplicate())
	var sx: int = MINE_START.x
	var sy: int = MINE_START.y
	for d in [[0, 0], [0, 1], [0, 2], [-1, 1], [1, 1]]:
		carve.call(sx + d[0], sy + d[1])
	for w in 5:
		var x := sx
		var y := sy + 1
		for step in 90:
			var d := int(floor(r.next() * 4))
			x = mini(MINE_W - 2, maxi(1, x + [1, -1, 0, 0][d]))
			y = mini(MINE_H - 2, maxi(1, y + [0, 0, 1, -1][d]))
			carve.call(x, y)
	var chances := ore_chances(level)
	var rocks := []
	for y in range(1, MINE_H - 1):
		for x in range(1, MINE_W - 1):
			var i := y * MINE_W + x
			if tiles[i].ground != "cave" or (absi(x - sx) <= 1 and y >= sy - 1 and y <= sy + 2):
				continue
			if r.next() >= 0.42:
				continue
			var p := r.next()
			var rock := "stone"
			for c in chances:
				if p < c[1]:
					rock = c[0]
					break
				p -= c[1]
			tiles[i].obstacle = rock
			rocks.append(i)
	# The ladder down hides under a rock well away from the start.
	var far := rocks.filter(func(i): return absi(i % MINE_W - sx) + absi(i / MINE_W - sy) >= 6)
	var pool := far if far.size() else rocks
	var ladder_at: int = pool[int(floor(r.next() * pool.size()))] if pool.size() else -1
	if ladder_at < 0:
		ladder_at = (sy + 2) * MINE_W + sx
		tiles[ladder_at].obstacle = "stone"
	return {"floor": level, "tiles": tiles, "ladderAt": ladder_at, "buildings": [{"id": "ladder-up", "kind": "ladderUp", "x": sx, "y": sy, "data": {}}]}
