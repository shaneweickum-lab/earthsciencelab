class_name TerrainView
extends Node3D
## The ground (one flat block per tile, colored by what's on it), the pond, and everything
## standing on the land: trees, rocks, sticks, stumps, logs, weeds, and wild plants.
## Port of Terrain.tsx. Rebuilds only the layers whose tiles changed.

const GRASS := {
	"Spring": ["#86b85f", "#7fb069", "#8cbf66"],
	"Summer": ["#76a94f", "#6fa04a", "#7cae55"],
	"Fall": ["#a9a552", "#b49a4a", "#9fa04e"],
	"Winter": ["#dfe6e8", "#d6dfe2", "#e6ecee"],
}
## Quaternius's Ultimate Nature models (public/models/qnature): pines with autumn and snowy
## versions, stumps, logs, rocks, and wild plants.
const SEASON_SUFFIX := {"Spring": "", "Summer": "", "Fall": "_Autumn", "Winter": "_Snow"}
const N := "qnature/"
## Quaternius's textured trees (public/models/qtrees), each scaled so its canopy is about two
## tiles across (TREE_SCALE in Terrain.tsx).
const QT := "qtrees/"
const TREE_SCALE := {
	"BirchTree_1": 0.62, "BirchTree_2": 0.45, "BirchTree_3": 0.59, "BirchTree_4": 0.79, "BirchTree_5": 0.61,
	"MapleTree_1": 0.35, "MapleTree_2": 0.33, "MapleTree_3": 0.25, "MapleTree_4": 0.79, "MapleTree_5": 0.31,
	"DeadTree_1": 0.48, "DeadTree_3": 0.47, "DeadTree_5": 1.15, "DeadTree_7": 0.33, "DeadTree_9": 0.91,
}
const BIRCHES := ["BirchTree_1", "BirchTree_2", "BirchTree_3", "BirchTree_4", "BirchTree_5"]
const MAPLES := ["MapleTree_1", "MapleTree_2", "MapleTree_3", "MapleTree_4", "MapleTree_5"]
const SNAGS := ["DeadTree_1", "DeadTree_3", "DeadTree_5", "DeadTree_7", "DeadTree_9"]
## Leaf colors by season (the models' own leaves are summer green): fresh in spring; in fall
## maples go red-orange, birches gold.
const LEAF_TINT := {
	"Spring": {"maple": "8fd060", "birch": "9ad860"},
	"Fall": {"maple": "ff6a2a", "birch": "f2c23a"},
}


static func _leafy(name: String, birch: bool, season: String) -> String:
	if not LEAF_TINT.has(season):
		return QT + name
	return QT + name + "#" + (LEAF_TINT[season].birch if birch else LEAF_TINT[season].maple)
## How tall one mountain terrace is, in world units (height.ts).
const STEP := 0.7
## Chunks of the valley, in tiles: each is drawn (or skipped, when it's off screen) on its own.
const CHUNK := 16
const WATER_TOP := {"water": "#5fa3cf", "river": "#6fb4dc", "sea": "#4f8fc4"}
const ORE_COLOR := {"copperOre": "#3fae7a", "tinOre": "#5a5060", "ironOre": "#b24a2c", "goldOre": "#f2c230", "mithrilOre": "#5fd8f0"}

var _ground: Node3D
var _land: Node3D
var _ground_key := ""
var _land_key := ""
var _tiles: Array = []
var _season := ""
var _box := BoxMesh.new()
var _furrow := BoxMesh.new()
var _mulch := BoxMesh.new()
var _stick := BoxMesh.new()
var _foam := BoxMesh.new()
var _crystal := SphereMesh.new()


func _init() -> void:
	_box.size = Vector3(1, 0.2, 1)
	_furrow.size = Vector3(0.16, 0.08, 0.92)
	_mulch.size = Vector3(0.92, 0.05, 0.92)
	_stick.size = Vector3(0.7, 0.06, 0.07)
	_foam.size = Vector3(1, 0.03, 1)
	# A little octahedron: a sphere with four sides and one ring.
	_crystal.radius = 0.12
	_crystal.height = 0.24
	_crystal.radial_segments = 4
	_crystal.rings = 1
	_ground = Node3D.new()
	_land = Node3D.new()
	add_child(_ground)
	add_child(_land)


static func _h(i: float) -> float:
	return Models.hash(i)


## The height of a tile's top: terraces stack up, and a trail ramp sits halfway between two.
static func tile_top(t: Variant) -> float:
	if t == null:
		return 0.0
	return (float(t.get("elev", 0)) - (0.5 if t.get("ramp", false) else 0.0)) * STEP


## The ground height under a point (for the player, townsfolk, and buildings).
static func height_at(tiles: Array, x: float, z: float) -> float:
	var tx := int(Js.round(x))
	var tz := int(Js.round(z))
	return tile_top(tiles[WorldMap.idx(tx, tz)]) if WorldMap.in_bounds(tx, tz) and tiles.size() == WorldMap.W * WorldMap.H else 0.0


static func _chunk_key(x: float, z: float) -> int:
	return int(floorf(z / CHUNK)) * 1000 + int(floorf(x / CHUNK))


## Many copies of one mesh, split into chunks of the valley so the camera can skip the ones it can't see.
static func _chunked(mesh: Mesh, items: Array, material: Material = null) -> Array:
	var groups := {}
	for it in items:
		var o: Vector3 = it.xf.origin
		var k := _chunk_key(o.x, o.z)
		if not groups.has(k):
			groups[k] = []
		groups[k].append(it)
	var out := []
	for k in groups:
		out.append(Models.colored(mesh, groups[k], material))
	return out


static func _pick(list: Array, r: float) -> String:
	return list[int(floorf(r * list.size())) % list.size()]


func _ground_color(t: Dictionary, i: int, season: String) -> String:
	match t.ground:
		"grass":
			return GRASS[season][int(floorf(_h(i) * 3))]
		"forest":
			return "#cfd8d6" if season == "Winter" else ["#4f7a3a", "#557f3e", "#4a7336"][int(floorf(_h(i) * 3))]
		"path":
			return "#d9c49a" if _h(i) > 0.5 else "#d2bc90"
		"sand":
			return "#e6d3a3"
		"water":
			return "#3f7fae"
		"river":
			return "#356f9a"
		"sea":
			return "#244f78"
		"rock":
			if season == "Winter" and int(t.get("elev", 0)) >= 2:
				return "#e8eef0"
			return ["#8f8a80", "#97928a", "#888378"][int(floorf(_h(i) * 3))]
		"dock":
			return "#9a7048" if (i % WorldMap.W) % 2 else "#a57a50"
		"farm":
			if t.tilled:
				return "#4a2f1c" if t.moisture > 45 else "#7a5233"
			return "#8a6a45" if t.greenhouse else ("#c9c3b4" if season == "Winter" else "#9c8458")
	return "#ff00ff"


## Rebuild what changed. Cheap when nothing did.
func refresh(world: Dictionary, season: String) -> void:
	var tiles: Array = world.tiles
	if is_same(tiles, _tiles) and season == _season and _land.get_child_count():
		return
	_tiles = tiles
	_season = season
	var ground_key := PackedStringArray([season])
	var land_key := PackedStringArray([season, str(world.buildings.size())])
	for t in tiles:
		if t.ground == "farm":
			ground_key.append("%s%s%s%s" % [t.tilled, t.moisture > 45, t.mulch, t.greenhouse])
			land_key.append("%s%s" % [t.obstacle, t.weeds])
		elif t.obstacle:
			land_key.append(t.obstacle)
	var gk := "".join(ground_key)
	var lk := "".join(land_key)
	if gk != _ground_key:
		_ground_key = gk
		_build_ground(tiles, season)
	if lk != _land_key:
		_land_key = lk
		_build_land(world, season)


func _clear(n: Node) -> void:
	for c in n.get_children():
		c.queue_free()


func _build_ground(tiles: Array, season: String) -> void:
	_clear(_ground)
	var W := WorldMap.W
	var blocks := []
	var furrows := []
	var mulch := []
	var water := []
	var foam := []
	for i in tiles.size():
		var t: Dictionary = tiles[i]
		var x := float(i % W)
		var z := float(i / W)
		var color := Color(_ground_color(t, i, season))
		# Mountain terraces: a taller block, so the cliff sides show.
		var top := tile_top(t)
		if top > 0:
			blocks.append({"xf": Transform3D(Basis.from_scale(Vector3(1, (top + 0.2) / 0.2, 1)), Vector3(x, (top - 0.2) / 2, z)), "color": color})
		else:
			var y := -0.25 if World.is_water(t.ground) else (-0.08 if t.tilled else -0.1)
			blocks.append({"xf": Transform3D(Basis(), Vector3(x, y, z)), "color": color})
		if t.tilled:
			var c := Color("#3a2415" if t.moisture > 45 else "#6a4529")
			for dx in [-0.3, 0.0, 0.3]:
				furrows.append({"xf": Transform3D(Basis(), Vector3(x + dx, 0.03, z)), "color": c})
		if t.mulch:
			mulch.append({"xf": Models.xf(Vector3(x, 0.04, z), Vector3(0, _h(i) * 3, 0)), "color": Color("#d8b75a")})
		if World.is_water(t.ground):
			water.append({"xf": Transform3D(Basis(), Vector3(x, -0.06, z)), "color": Color(WATER_TOP[t.ground], 0.78)})
			# Surf where the sea meets the sand.
			if t.ground == "sea" and i >= W and tiles[i - W].ground == "sand":
				foam.append({"xf": Transform3D(Basis.from_scale(Vector3(1, 1, 0.3)), Vector3(x, -0.04, z - 0.35)), "color": Color("#f4f8fa", 0.85)})
	for ground in _chunked(_box, blocks):
		ground.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		_ground.add_child(ground)
	if furrows.size():
		_ground.add_child(Models.colored(_furrow, furrows))
	if mulch.size():
		_ground.add_child(Models.colored(_mulch, mulch))
	# The surface of ponds, the river, and the sea, with surf along the beach.
	var surface := BoxMesh.new()
	surface.size = Vector3(1, 0.02, 1)
	var wm := StandardMaterial3D.new()
	wm.vertex_color_use_as_albedo = true
	wm.vertex_color_is_srgb = true
	wm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	wm.roughness = 0.15
	wm.metallic = 0.1
	for n in _chunked(surface, water, wm):
		_ground.add_child(n)
	if foam.size():
		var fm := StandardMaterial3D.new()
		fm.vertex_color_use_as_albedo = true
		fm.vertex_color_is_srgb = true
		fm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
		fm.roughness = 0.6
		_ground.add_child(Models.colored(_foam, foam, fm))
	# Land beyond the map edge.
	var edge := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(W + 60, WorldMap.H + 60)
	edge.mesh = plane
	edge.position = Vector3(W / 2.0 - 0.5, -0.21, WorldMap.H / 2.0 - 0.5)
	edge.material_override = Models.mat("#cfd8d6" if season == "Winter" else "#466e34")
	_ground.add_child(edge)


## Which tree grows on a tile: pines on the mountain, birches and maples in the valley, and now
## and then a dead snag. In winter the leafy trees stand bare. (treeModel in Terrain.tsx.)
static func tree_model(t: Dictionary, r: float, r2: float, season: String) -> Dictionary:
	if t.ground == "rock":
		return {"name": N + "PineTree%s_%d" % [SEASON_SUFFIX[season], 1 + int(floorf(r2 * 3))], "s": 0.95 + r * 0.3}
	var jitter := 0.85 + r * 0.3
	if r > 0.96:
		var snag: String = _pick(SNAGS, r2)
		return {"name": QT + snag, "s": TREE_SCALE[snag] * jitter}
	var birch := r2 < 0.45
	var name: String = _pick(BIRCHES, r2 / 0.45) if birch else _pick(MAPLES, (r2 - 0.45) / 0.55)
	if season == "Winter":
		var bare: String = _pick(SNAGS, fmod(r * 7, 1.0))
		return {"name": QT + bare, "s": TREE_SCALE[bare] * jitter}
	return {"name": _leafy(name, birch, season), "s": TREE_SCALE[name] * jitter}


func _build_land(world: Dictionary, season: String) -> void:
	_clear(_land)
	var tiles: Array = world.tiles
	var W := WorldMap.W
	var covered := {}
	for b in world.buildings:
		var sz := WorldMap.size_of(b.kind)
		for y in range(b.y, b.y + sz[1]):
			for x in range(b.x, b.x + sz[0]):
				covered[int(y) * W + int(x)] = true
	var winter := season == "Winter"
	var tall := {}
	var low := {}
	var sticks := []
	var ores := []
	# Grouped by model and by 12×12-tile chunk, so the camera can skip chunks it can't see.
	var add := func(group: Dictionary, name: String, xf: Transform3D) -> void:
		var key := "%s|%d,%d" % [name, int(xf.origin.x) / 12, int(xf.origin.z) / 12]
		if not group.has(key):
			group[key] = []
		group[key].append(xf)
	for i in tiles.size():
		var t: Dictionary = tiles[i]
		var x := float(i % W)
		var z := float(i / W)
		var r := _h(i + 7)
		var r2 := _h(i * 3 + 1)
		var ry := _h(i * 5 + 2) * PI * 2
		var y := tile_top(t)
		match t.obstacle:
			"tree":
				# The trunk stays inside the tree's 0.6-wide hit box.
				var tree := tree_model(t, r, r2, season)
				add.call(tall, tree.name, Models.xf(Vector3(x + (r2 - 0.5) * 0.1, y, z + (r - 0.5) * 0.1), Vector3(0, ry, 0), tree.s))
			"stone":
				var rock := "Rock_Snow_%d" % (1 + int(r2 * 4)) if winter else ("Rock_Moss_%d" % (1 + int(r2 * 2)) if r > 0.8 else "Rock_%d" % (1 + int(r2 * 4)))
				add.call(low, N + rock, Models.xf(Vector3(x, y, z), Vector3(0, ry, 0), 0.55))
			"stump":
				add.call(low, N + ("TreeStump_Snow" if winter else ("TreeStump_Moss" if r2 > 0.6 else "TreeStump")), Models.xf(Vector3(x, y, z), Vector3(0, ry, 0), 0.6))
			"log":
				add.call(low, N + ("WoodLog_Snow" if winter else ("WoodLog_Moss" if r2 > 0.5 else "WoodLog")), Models.xf(Vector3(x, y, z), Vector3(0, ry, 0), 0.38))
			"sapling":
				add.call(low, _leafy("BirchTree_4" if r2 < 0.5 else "MapleTree_4", r2 < 0.5, season), Models.xf(Vector3(x, y, z), Vector3(0, ry, 0), 0.2))
			"stick":
				sticks.append({"xf": Models.xf(Vector3(x, y + 0.05, z), Vector3(0, ry, 0.1)), "color": Color("#7a5636")})
			"copperOre", "tinOre", "ironOre", "goldOre", "mithrilOre":
				# Ore poking out of the mountainside: a rock with colored crystals.
				add.call(low, N + ("Rock_Snow_2" if winter else "Rock_2"), Models.xf(Vector3(x, y, z), Vector3(0, ry, 0), 0.6))
				var oc := Color(ORE_COLOR[t.obstacle])
				ores.append({"xf": Models.xf(Vector3(x + 0.12, y + 0.22, z + 0.1), Vector3(0.4, ry, 0)), "color": oc})
				ores.append({"xf": Models.xf(Vector3(x - 0.15, y + 0.16, z - 0.05), Vector3(0, ry + 1, 0.5), 0.75), "color": oc})
		if t.weeds:
			for k in 3:
				var name := _pick(["Grass", "Grass_2", "Grass_Short", "Plant_1"], _h(i * 17 + k))
				var size: float = {"Grass": 0.4, "Grass_2": 0.35, "Grass_Short": 0.9, "Plant_1": 0.5}[name] * (0.85 + _h(i + k) * 0.4)
				add.call(low, N + name, Models.xf(Vector3(x + (_h(i * 7 + k) - 0.5) * 0.6, 0, z + (_h(i * 11 + k) - 0.5) * 0.6), Vector3(0, _h(i * 13 + k) * 6, 0), size))
			if r > 0.65 and not winter:
				add.call(low, N + "Flowers", Models.xf(Vector3(x + 0.2, 0, z - 0.15), Vector3(0, ry, 0), 0.5))
		# Wild plants on open grass and lily pads on the pond make the farm feel alive.
		if not t.obstacle and not covered.has(i):
			if t.ground == "grass":
				if winter:
					if r < 0.03:
						add.call(low, N + "Bush_Snow_1", Models.xf(Vector3(x, 0, z), Vector3(0, ry, 0), 0.5))
				elif r < 0.1:
					add.call(low, N + ("Grass_Short" if r2 > 0.5 else "Grass"), Models.xf(Vector3(x + (r2 - 0.5) * 0.5, 0, z), Vector3(0, ry, 0), 0.9 if r2 > 0.5 else 0.45))
				elif r < 0.13:
					add.call(low, N + ("Flowers" if r2 > 0.3 else "Plant_2"), Models.xf(Vector3(x, 0, z), Vector3(0, ry, 0), 0.55))
				elif r < 0.15:
					add.call(low, QT + ("Bush_Small" if r2 > 0.5 else "Bush_Flowers"), Models.xf(Vector3(x, 0, z), Vector3(0, ry, 0), 0.45 if r2 > 0.5 else 0.7))
			if t.ground == "water" and r < 0.18:
				add.call(low, N + "Lilypad", Models.xf(Vector3(x, -0.06, z), Vector3(0, ry, 0), 0.4 + r2 * 0.3))
	for key in tall:
		for n in Models.instances(key.get_slice("|", 0), tall[key], true):
			_land.add_child(n)
	for key in low:
		for n in Models.instances(key.get_slice("|", 0), low[key], false):
			_land.add_child(n)
	if sticks.size():
		_land.add_child(Models.colored(_stick, sticks))
	if ores.size():
		_land.add_child(Models.colored(_crystal, ores))
