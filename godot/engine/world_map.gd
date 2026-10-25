class_name WorldMap
## Port of src/world/map.ts. The valley: the farm is the west part (x < 38), behind the hedge
## and Garden Lane. A long country road leads east to the town, with its square, market, and
## park; past the town are the river, the mountains (the mine is up there), the forest pond,
## and the beach along the south.

const W := 128
const H := 84
const FARM_W := 38
## The map was 36 rows tall before the South Fields were added below the forest belt.
const OLD_H := 36
## Before the valley grew (save version 11), the map was 76 wide and 64 tall, with the town just past the lane.
const OLD_W := 76
const OLD_ROWS := 64
## How far east the town moved when the valley grew.
const TOWN_SHIFT := 22

## Garden Lane runs north-south just inside the town's west edge, with a gate to each garden.
const LANE_X := 40
const GATE_X := 39
const GATE_ROWS := [4, 6, 8, 14, 16, 18, 20, 22]
## Where you come out on your farm through its gate, and the tile on its road that leads back to town.
const GARDEN_ENTRY := {"x": 36, "y": 11, "facing": "left"}
const GARDEN_EXIT_X := 37
## Market stalls stand in a row in the market; the first one is yours.
const STALL_ROW := 18
const STALL_X0 := 88
const STALL_SIZE := 6


## True when a farmer on their farm has walked to the end of its road.
static func at_garden_exit(p: Dictionary) -> bool:
	var x := Js.round(p.x)
	return x >= GARDEN_EXIT_X and x < FARM_W and absf(Js.round(p.y) - GARDEN_ENTRY.y) <= 1


## The farm field the player clears and plants.
const FARM := {"x0": 10, "y0": 13, "x1": 27, "y1": 28}
## More farmland south of the forest belt, opened plot by plot.
const SOUTH := {"x0": 10, "y0": 37, "x1": 33, "y1": 60}


static var _plots := []


## The farmland in 6×4-tile plots: 12 in the field by the house, 24 in the South Fields. A new
## farm owns only plot 0 (nearest the house); the rest are bought or earned from quests. Then
## the allotments in the park: small beds in town you can rent.
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
		for y in [34, 40]:
			for x in [66, 71, 76]:
				_plots.append({"id": _plots.size(), "x0": x, "y0": y, "x1": x + 3, "y1": y + 2})
	return _plots


## The first allotment's plot id (the farm has 36 plots before them).
const ALLOTMENT0 := 36
## What an allotment costs to rent: the same for each one.
const ALLOTMENT_RENT := 150


static func is_allotment(id: int) -> bool:
	return id >= ALLOTMENT0



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

## The town: its square, the market, the community garden, the park, and where the road runs.
const TOWN := {
	"x0": 64,
	"road": 11,
	"square": {"x0": 74, "y0": 13, "x1": 82, "y1": 19},
	"market": {"x0": 86, "y0": 13, "x1": 97, "y1": 19},
	"garden": {"x0": 85, "y0": 21, "x1": 91, "y1": 27},
	"park": {"x0": 64, "y0": 31, "x1": 99, "y1": 72},
}

## The river runs south down the valley into the sea, with bridges at the road and in the park.
const RIVER := {"x0": 100, "x1": 103, "y1": 78, "bridges": [10, 11, 12, 45]}
## Beach sand, then the sea; the dock reaches out from the sand.
const BEACH_Y := 73
const SEA_Y := 79
const DOCK := {"x0": 70, "x1": 71, "y0": 76, "y1": 82}
## The mountains: three rock terraces, each higher than the last (elevation 1, 2, 3).
const MOUNTAINS := {"x0": 104, "y0": 3, "x1": 125, "y1": 38}
const TERRACES := [
	{"x0": 106, "y0": 3, "x1": 125, "y1": 34},
	{"x0": 110, "y0": 3, "x1": 125, "y1": 28},
	{"x0": 115, "y0": 3, "x1": 125, "y1": 20},
]
## The forest east of the river, with a pond in the middle.
const FOREST := {"x0": 104, "y0": 39, "x1": 125, "y1": 72}
const POND := {"cx": 115, "cy": 56, "rx": 5, "ry": 4}

static var _trail := []


## Walking up the mountain: the trail, as [x, y, ramp] (ramps climb one terrace).
static func trail() -> Array:
	if _trail.is_empty():
		var t := [[104, 11, false], [105, 11, false], [106, 11, true]]
		for i in 15:
			t.append([107, 12 + i, false])
		t += [[107, 11, false], [108, 26, false], [109, 26, false], [110, 26, true]]
		for i in 13:
			t.append([111, 13 + i, false])
		t += [[111, 26, false], [112, 13, false], [113, 13, false], [114, 13, false], [115, 13, true], [116, 13, false]]
		for i in 5:
			t.append([117, 9 + i, false])
		t += [[118, 9, false], [119, 9, false], [120, 9, false], [121, 9, false]]
		_trail = t
	return _trail


static func _in_rect(r: Dictionary, x: int, y: int) -> bool:
	return x >= r.x0 and x <= r.x1 and y >= r.y0 and y <= r.y1


## How high a tile is: the number of terraces it's on (0 off the mountains).
static func elevation_at(x: int, y: int) -> int:
	var n := 0
	for t in TERRACES:
		if _in_rect(t, x, y):
			n += 1
	return n


## Signposts, and the places they can take you (where you arrive, facing).
const DESTINATIONS := [
	{"id": "farm", "name": "Your farm gate", "icon": "🏡", "x": 40, "y": 5, "facing": "left"},
	{"id": "square", "name": "Town square", "icon": "⛲", "x": 75, "y": 17, "facing": "right"},
	{"id": "market", "name": "Market", "icon": "🧺", "x": 90, "y": 16, "facing": "down"},
	{"id": "park", "name": "Park & allotments", "icon": "🌳", "x": 72, "y": 38, "facing": "up"},
	{"id": "beach", "name": "Beach & dock", "icon": "🏖️", "x": 69, "y": 76, "facing": "right"},
	{"id": "trail", "name": "Mountain trail", "icon": "⛰️", "x": 105, "y": 11, "facing": "right"},
	{"id": "pond", "name": "Forest pond", "icon": "🌲", "x": 107, "y": 50, "facing": "right"},
]


static func destination(id: String) -> Variant:
	for d in DESTINATIONS:
		if d.id == id:
			return d
	return null

const BUILDING_SIZE := {
	"house": [5, 4], "store": [5, 4], "shippingBin": [1, 1],
	"composter": [1, 1], "rainBarrel": [1, 1], "beehive": [1, 1], "birdHouse": [1, 1], "bugHotel": [1, 1], "scarecrow": [1, 1],
	"greenhouse": [5, 5], "fence": [1, 1], "flowerBed": [1, 1], "pathStone": [1, 1],
	"well": [1, 1], "chickenCoop": [2, 2], "smallBarn": [3, 3], "chest": [1, 1],
	"extension": [5, 4], "cottage": [4, 4], "fountain": [2, 2], "noticeBoard": [1, 1], "field": [5, 3], "lamp": [1, 1], "prop": [1, 1],
	"barn": [4, 4], "silo": [2, 2], "windmill": [3, 2], "waterTower": [2, 2],
	"mineEntrance": [2, 2], "ladderUp": [1, 1], "ladderDown": [1, 1],
	"workbench": [1, 1], "grinder": [1, 1], "spinningWheel": [1, 1], "furnace": [1, 1], "stove": [1, 1], "oven": [1, 1],
	"gardenGate": [1, 1], "marketStall": [1, 1], "signpost": [1, 1], "fishingHut": [3, 2],
}

## The mine entrance (2×2, opening south onto the trail at the top of the mountain), and the size of each mine floor.
const MINE_ENTRANCE := {"x": 119, "y": 7}
const MINE_W := 24
const MINE_H := 18
## Where you arrive on a floor: the ladder up is here, and you stand just south of it.
const MINE_START := {"x": 12, "y": 8}

## Slots in a storage chest.
const CHEST_SIZE := 20

## Buildings you can walk over.
## What a 1×1 building blocks when you walk into it: [width, depth] of a box centered on its tile
## (turned with the building). Bigger buildings block their whole footprint, a little inset;
## fences are a rail along one edge (see World.hit_boxes). Mirrors HITBOX in map.ts.
const HITBOX := {
	"lamp": [0.3, 0.3], "birdHouse": [0.3, 0.3], "scarecrow": [0.4, 0.3],
	"signpost": [0.6, 0.6], "noticeBoard": [1, 0.6], "chest": [0.8, 0.6], "shippingBin": [0.9, 0.75], "composter": [0.85, 0.85],
	"rainBarrel": [0.7, 0.7], "beehive": [0.7, 0.6], "bugHotel": [0.7, 0.6], "well": [0.85, 0.85],
	"workbench": [0.9, 0.7], "grinder": [0.9, 0.7], "spinningWheel": [0.9, 0.6], "furnace": [0.85, 0.8], "stove": [0.85, 0.8], "oven": [0.85, 0.8],
	"marketStall": [0.9, 0.7], "prop": [0.9, 0.6], "ladderUp": [0.6, 0.6], "ladderDown": [0.6, 0.6], "gardenGate": [1, 1],
}
## How much big buildings' blocking boxes are pulled in from their footprint.
const BUILDING_INSET := 0.1
## Obstacles' blocking boxes (centered on the tile); sticks and saplings don't block at all.
const OBSTACLE_BOX := {
	"tree": 0.6, "stump": 0.6, "stone": 0.6, "log": 0.7, "copperOre": 0.6, "tinOre": 0.6, "ironOre": 0.6, "goldOre": 0.6, "mithrilOre": 0.6,
}

const WALKABLE_BUILDINGS := ["pathStone", "flowerBed"]

## Town buildings the player can't build, pick up, or build over.
const TOWN_KINDS := [
	"house", "store", "shippingBin", "extension", "cottage", "fountain", "noticeBoard", "field", "lamp", "prop", "barn", "silo", "windmill", "waterTower",
	"mineEntrance", "ladderUp", "ladderDown", "gardenGate", "marketStall", "signpost", "fishingHut",
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


## Everything in town and around the valley. Ids are fixed so old saves can be upgraded by id.
static func town_buildings() -> Array:
	var lamp := func(id: String, x: int, y: int) -> Dictionary: return {"id": id, "kind": "lamp", "x": x, "y": y, "data": {}}
	var prop := func(id: String, x: int, y: int, model: String) -> Dictionary: return {"id": id, "kind": "prop", "x": x, "y": y, "data": {"model": model}}
	var sign := func(id: String, x: int, y: int) -> Dictionary: return {"id": id, "kind": "signpost", "x": x, "y": y, "data": {}}
	return [
		{"id": "store", "kind": "store", "x": 65, "y": 6, "data": {"owner": "mei", "sign": "Seed & Soil Co."}},
		{"id": "extension", "kind": "extension", "x": 72, "y": 6, "data": {"owner": "amara", "sign": "County Extension Office"}},
		{"id": "june-cottage", "kind": "cottage", "x": 83, "y": 6, "data": {"owner": "june"}},
		{"id": "ortega-cottage", "kind": "cottage", "x": 65, "y": 22, "data": {"owner": "luis"}},
		{"id": "ortega-field", "kind": "field", "x": 71, "y": 23, "data": {"owner": "luis"}},
		{"id": "fountain", "kind": "fountain", "x": 77, "y": 15, "data": {}},
		{"id": "notice-board", "kind": "noticeBoard", "x": 80, "y": 13, "data": {}},
		lamp.call("lamp-1", 74, 13), lamp.call("lamp-2", 82, 13), lamp.call("lamp-3", 74, 19), lamp.call("lamp-4", 82, 19), lamp.call("lamp-5", 41, 10),
		prop.call("cart", 69, 9, "town/cart"),
		{"id": "june-flowers-1", "kind": "flowerBed", "x": 82, "y": 9, "data": {}},
		{"id": "june-flowers-2", "kind": "flowerBed", "x": 87, "y": 9, "data": {}},
		{"id": "square-flowers-1", "kind": "flowerBed", "x": 75, "y": 19, "data": {}},
		{"id": "square-flowers-2", "kind": "flowerBed", "x": 81, "y": 19, "data": {}},
		{"id": "garden-hive", "kind": "beehive", "x": 92, "y": 22, "data": {"owner": "june"}},
		{"id": "ortega-barn", "kind": "barn", "x": 77, "y": 22, "data": {"owner": "luis"}},
		{"id": "ortega-silo", "kind": "silo", "x": 81, "y": 22, "data": {"owner": "luis"}},
		{"id": "town-windmill", "kind": "windmill", "x": 92, "y": 36, "data": {}},
		{"id": "water-tower", "kind": "waterTower", "x": 65, "y": 14, "data": {}},
		# The old mine, up at the top of the mountain trail.
		{"id": "mine-entrance", "kind": "mineEntrance", "x": MINE_ENTRANCE.x, "y": MINE_ENTRANCE.y, "data": {}},
		# The country road, and signposts that take you around the valley.
		prop.call("road-fence-1", 48, 10, "nature/fence_simple"), prop.call("road-fence-2", 49, 10, "nature/fence_simple"),
		prop.call("road-fence-3", 56, 12, "nature/fence_simple"), prop.call("road-fence-4", 57, 12, "nature/fence_simple"),
		sign.call("sign-lane", 42, 10), sign.call("sign-square", 73, 13), sign.call("sign-beach", 69, 74), sign.call("sign-trail", 104, 10),
		# The market: townsfolk's produce stands across from the stalls.
		prop.call("stand-1", 88, 14, "town/stall-red"), prop.call("stand-2", 91, 14, "town/stall-green"), prop.call("stand-3", 94, 14, "town/stall-red"),
		# The park: townsfolk's gardens, flowers, and benches.
		{"id": "june-garden", "kind": "field", "x": 86, "y": 40, "data": {"owner": "june"}},
		{"id": "park-flowers-1", "kind": "flowerBed", "x": 66, "y": 46, "data": {}},
		{"id": "park-flowers-2", "kind": "flowerBed", "x": 83, "y": 47, "data": {}},
		{"id": "park-flowers-3", "kind": "flowerBed", "x": 88, "y": 48, "data": {}},
		prop.call("bench-1", 70, 46, "town/stall-bench"), prop.call("bench-2", 86, 46, "town/stall-bench"),
		lamp.call("lamp-6", 85, 33), lamp.call("lamp-7", 85, 60),
		# The beach: Kai's fishing hut by the dock.
		{"id": "fishing-hut", "kind": "fishingHut", "x": 73, "y": 74, "data": {"owner": "kai", "sign": "Kai's Fishing Hut"}},
	]


static func create_map(seed: int) -> Dictionary:
	var r := Rng.stream(seed)
	var tiles := []
	for y in H:
		for x in W:
			var soil := _degraded_soil(r)
			if x >= FARM_W:
				tiles.append(_valley_tile(x, y, soil, r))
				continue
			# The old south edge is now a forest belt between the field and the South Fields.
			var belt := y > OLD_H - 3 and y < OLD_H
			var south := y >= OLD_H
			var forest := y < 3 or x < 2 or y > H - 3 or belt or (x < 7 and y > 26 and not south)
			if south and not forest:
				if x >= SOUTH.x0 and x <= SOUTH.x1 and y >= SOUTH.y0 and y <= SOUTH.y1:
					var k := r.next()
					var obstacle: Variant = "stone" if k < 0.07 else ("stick" if k < 0.13 else ("stump" if k < 0.17 else ("log" if k < 0.19 else null)))
					tiles.append(_tile("farm", soil, obstacle, obstacle == null and r.next() < 0.8))
				else:
					tiles.append(_tile("grass", soil, "tree" if r.next() < 0.08 else null))
				continue
			if forest:
				tiles.append(_forest_tile(soil, r))
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
			# The farm side has a few trees.
			var scatter_trees := not shore and r.next() < 0.04
			tiles.append(_tile("sand" if shore else "grass", soil, "tree" if scatter_trees else null))

	var path := func(px: int, py: int) -> void:
		var t: Dictionary = tiles[idx(px, py)]
		t.ground = "path"
		t.obstacle = null
		t.weeds = false
	var planks := func(px: int, py: int) -> void:
		var t: Dictionary = tiles[idx(px, py)]
		t.ground = "dock"
		t.obstacle = null
	for py in range(9, 13):
		path.call(10, py)
	# The road runs east from the farm, down the long country road, through town, and over the river.
	for px in range(10, RIVER.x0):
		path.call(px, TOWN.road)
	for px in range(TOWN.x0, RIVER.x0):
		path.call(px, TOWN.road + 1)
	# Town square and market.
	var sq: Dictionary = TOWN.square
	for py in range(sq.y0, sq.y1 + 1):
		for px in range(sq.x0, sq.x1 + 1):
			path.call(px, py)
	var mk: Dictionary = TOWN.market
	for py in range(mk.y0, mk.y1 + 1):
		for px in range(mk.x0, mk.x1 + 1):
			path.call(px, py)
	# Walkways to doors and the garden. (Doors face south, so the Ortegas' walkway wraps around.)
	for w in [[67, 10, 10], [74, 10, 10], [85, 10, 10], [69, 13, 26], [86, 13, 20]]:
		for py in range(w[1], w[2] + 1):
			path.call(w[0], py)
	for px in range(67, 70):
		path.call(px, 26)
	add_garden_lane(tiles)
	# Down past the field and through the forest belt to the South Fields.
	for p in south_path():
		path.call(p[0], p[1])
	for px in range(70, sq.x0):
		path.call(px, 16)
	for px in range(sq.x1 + 1, mk.x0):
		path.call(px, 16)
	# The shore path through the south woods, and the park path, both down to the beach.
	for py in range(TOWN.road + 1, BEACH_Y):
		path.call(52, py)
	for py in range(17, BEACH_Y):
		path.call(84, py)
	# Park paths, and the way over the river to the forest pond.
	for px in range(TOWN.park.x0, RIVER.x0):
		path.call(px, 32)
	for px in range(84, 108):
		path.call(px, 45)
	for py in range(33, 45):
		path.call(70, py)
	for px in range(64, 81):
		path.call(px, 38)
	# Bridges over the river.
	for py in RIVER.bridges:
		for px in range(RIVER.x0, RIVER.x1 + 1):
			planks.call(px, py)
	# The trail around the forest pond, reached from the park bridge.
	for py in range(45, 49):
		path.call(107, py)
	for px in range(107, 124):
		path.call(px, 48)
		path.call(px, 64)
	for py in range(48, 65):
		path.call(107, py)
		path.call(123, py)
	# The mountain trail: switchbacks up the terraces to the mine.
	for p in trail():
		path.call(p[0], p[1])
		if p[2]:
			tiles[idx(p[0], p[1])].ramp = true
	# The dock, over the sand and out into the sea.
	for py in range(DOCK.y0, DOCK.y1 + 1):
		for px in range(DOCK.x0, DOCK.x1 + 1):
			planks.call(px, py)

	var buildings := farm_buildings() + town_buildings() + lane_buildings()
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


static func _forest_tile(soil: Dictionary, r: Rng.Stream) -> Dictionary:
	var forest_soil := Js.with(soil, {"om": 55 + Js.round(r.next() * 15), "life": 60})
	var obstacle: Variant = "tree" if r.next() < 0.55 else ("log" if r.next() < 0.15 else null)
	return _tile("forest", forest_soil, obstacle)


## One tile of the valley east of the farm (before paths and buildings are laid over it).
static func _valley_tile(x: int, y: int, soil: Dictionary, r: Rng.Stream) -> Dictionary:
	if x >= RIVER.x0 and x <= RIVER.x1 and y <= RIVER.y1:
		return _tile("river", soil)
	if y >= SEA_Y:
		return _tile("sea", soil)
	if y >= BEACH_Y:
		return _tile("sand", soil)
	if y < 3 or x > W - 3:
		return _forest_tile(soil, r)
	if _in_rect(MOUNTAINS, x, y):
		var k := r.next()
		var obstacle: Variant = "stone" if k < 0.08 else ("copperOre" if k < 0.095 else ("tinOre" if k < 0.105 else ("tree" if k < 0.2 else null)))
		var t := _tile("rock", Js.with(soil, {"om": 4, "life": 6}), obstacle)
		var elev := elevation_at(x, y)
		if elev:
			t.elev = elev
		return t
	if _in_rect(FOREST, x, y):
		var dx := float(x - POND.cx)
		var dy := float(y - POND.cy)
		var p := dx * dx / (POND.rx * POND.rx) + dy * dy / (POND.ry * POND.ry)
		if p < 1:
			return _tile("water", soil)
		if p < 1.6:
			return _tile("sand", soil)
		return _forest_tile(soil, r)
	# The country road and the south woods: meadow and trees.
	if x < TOWN.x0:
		return _tile("grass", soil, "tree" if r.next() < (0.18 if y > TOWN.road + 2 else 0.1) else null)
	if _in_rect(TOWN.garden, x, y):
		# The town's neglected community garden: overgrown, waiting to be restored.
		var k := r.next()
		var obstacle: Variant = "stick" if k < 0.08 else ("stone" if k < 0.12 else null)
		return _tile("farm", soil, obstacle, k >= 0.12 and r.next() < 0.85)
	for p in plots():
		if p.id >= ALLOTMENT0 and _in_rect(p, x, y):
			return _tile("farm", soil, null, r.next() < 0.7)
	# The park has a few trees; the town is kept clear for buildings and paths.
	if y >= TOWN.park.y0:
		return _tile("grass", soil, "tree" if r.next() < 0.04 else null)
	return _tile("grass", soil)


## The forest strip between farm and town becomes a hedge with Garden Lane running through it,
## joined to the road. Every farm, yours included, is reached through its gate on the lane.
static func add_garden_lane(tiles: Array) -> void:
	var hedge := {"ground": "forest", "obstacle": "tree", "weeds": false}
	var lane := {"ground": "path", "obstacle": null, "weeds": false}
	for y in range(3, H - 2):
		for x in range(FARM_W, LANE_X + 2):
			tiles[idx(x, y)] = Js.with(tiles[idx(x, y)], hedge)
	for y in range(GATE_ROWS[0], GATE_ROWS[GATE_ROWS.size() - 1] + 1):
		tiles[idx(LANE_X, y)] = Js.with(tiles[idx(LANE_X, y)], lane)
	for y in range(TOWN.road - 1, TOWN.road + 2):
		tiles[idx(LANE_X + 1, y)] = Js.with(tiles[idx(LANE_X + 1, y)], lane)


## The gates along Garden Lane, and your market stall in the market.
static func lane_buildings() -> Array:
	var out := []
	for k in GATE_ROWS.size():
		out.append({"id": "gate-%d" % k, "kind": "gardenGate", "x": GATE_X, "y": GATE_ROWS[k], "data": {"garden": k}})
	out.append({"id": "stall-0", "kind": "marketStall", "x": STALL_X0, "y": STALL_ROW, "data": {"garden": 0}})
	return out


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
