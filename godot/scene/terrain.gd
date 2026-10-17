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
const PINES := ["tree_pineRoundA", "tree_pineRoundC", "tree_pineTallA", "tree_pineSmallB"]
const LEAFY := ["tree_default", "tree_oak", "tree_detailed"]
const LEAF_SUFFIX := {"Spring": "", "Summer": "", "Fall": "_fall", "Winter": "_dark"}
const FLOWERS := ["flower_yellowA", "flower_redA", "flower_purpleA", "flower_yellowB"]

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


func _init() -> void:
	_box.size = Vector3(1, 0.2, 1)
	_furrow.size = Vector3(0.16, 0.08, 0.92)
	_mulch.size = Vector3(0.92, 0.05, 0.92)
	_stick.size = Vector3(0.7, 0.06, 0.07)
	_ground = Node3D.new()
	_land = Node3D.new()
	add_child(_ground)
	add_child(_land)


static func _h(i: float) -> float:
	return Models.hash(i)


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
	for i in tiles.size():
		var t: Dictionary = tiles[i]
		var x := float(i % W)
		var z := float(i / W)
		var y := -0.25 if t.ground == "water" else (-0.08 if t.tilled else -0.1)
		blocks.append({"xf": Transform3D(Basis(), Vector3(x, y, z)), "color": Color(_ground_color(t, i, season))})
		if t.tilled:
			var c := Color("#3a2415" if t.moisture > 45 else "#6a4529")
			for dx in [-0.3, 0.0, 0.3]:
				furrows.append({"xf": Transform3D(Basis(), Vector3(x + dx, 0.03, z)), "color": c})
		if t.mulch:
			mulch.append({"xf": Models.xf(Vector3(x, 0.04, z), Vector3(0, _h(i) * 3, 0)), "color": Color("#d8b75a")})
		if t.ground == "water":
			water.append({"xf": Transform3D(Basis(), Vector3(x, -0.06, z))})
	var ground := Models.colored(_box, blocks)
	ground.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_ground.add_child(ground)
	if furrows.size():
		_ground.add_child(Models.colored(_furrow, furrows))
	if mulch.size():
		_ground.add_child(Models.colored(_mulch, mulch))
	# The pond's surface.
	var surface := BoxMesh.new()
	surface.size = Vector3(1, 0.02, 1)
	var wm := StandardMaterial3D.new()
	wm.albedo_color = Color("#5fa3cf", 0.75)
	wm.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	wm.roughness = 0.15
	_ground.add_child(Models.colored(surface, water, wm))
	# Land beyond the map edge.
	var edge := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(W + 60, WorldMap.H + 60)
	edge.mesh = plane
	edge.position = Vector3(W / 2.0 - 0.5, -0.21, WorldMap.H / 2.0 - 0.5)
	edge.material_override = Models.mat("#cfd8d6" if season == "Winter" else "#466e34")
	_ground.add_child(edge)


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
	var tall := {}
	var low := {}
	var sticks := []
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
		match t.obstacle:
			"tree":
				var name: String = _pick(PINES, r2) if r < 0.35 else _pick(LEAFY, r2) + LEAF_SUFFIX[season]
				add.call(tall, "nature/" + name, Models.xf(Vector3(x + (r2 - 0.5) * 0.2, 0, z + (r - 0.5) * 0.2), Vector3(0, ry, 0), 1.3 + r * 0.45))
			"stone":
				add.call(low, "nature/" + _pick(["stone_smallA", "stone_smallB", "stone_smallC", "stone_smallFlatA"], r2), Models.xf(Vector3(x, 0, z), Vector3(0, ry, 0), 1.9))
			"stump":
				add.call(low, "nature/" + ("stump_round" if r2 > 0.5 else "stump_old"), Models.xf(Vector3(x, 0, z), Vector3(0, ry, 0), 2))
			"log":
				add.call(low, "nature/" + ("log" if r2 > 0.5 else "log_large"), Models.xf(Vector3(x, 0, z), Vector3(0, ry, 0), 1.4))
			"stick":
				sticks.append({"xf": Models.xf(Vector3(x, 0.05, z), Vector3(0, ry, 0.1)), "color": Color("#7a5636")})
		if t.weeds:
			for k in 3:
				var name := _pick(["grass_large", "grass_leafs", "plant_flatShort", "grass"], _h(i * 17 + k))
				add.call(low, "nature/" + name, Models.xf(Vector3(x + (_h(i * 7 + k) - 0.5) * 0.6, 0, z + (_h(i * 11 + k) - 0.5) * 0.6), Vector3(0, _h(i * 13 + k) * 6, 0), 1.5 + _h(i + k) * 0.6))
			if r > 0.65 and season != "Winter":
				add.call(low, "nature/" + _pick(FLOWERS, r2), Models.xf(Vector3(x + 0.2, 0, z - 0.15), Vector3(0, ry, 0), 1.6))
		# Wild plants on open grass and lily pads on the pond make the farm feel alive.
		if not t.obstacle and not covered.has(i):
			if t.ground == "grass" and season != "Winter":
				if r < 0.1:
					add.call(low, "nature/" + ("grass" if r2 > 0.5 else "grass_large"), Models.xf(Vector3(x + (r2 - 0.5) * 0.5, 0, z), Vector3(0, ry, 0), 1.4))
				elif r < 0.13:
					add.call(low, "nature/" + _pick(FLOWERS, r2), Models.xf(Vector3(x, 0, z), Vector3(0, ry, 0), 1.6))
				elif r < 0.15:
					add.call(low, "nature/" + ("plant_bushSmall" if r2 > 0.5 else "plant_bush"), Models.xf(Vector3(x, 0, z), Vector3(0, ry, 0), 1.4))
			if t.ground == "water" and r < 0.18:
				add.call(low, "nature/" + ("lily_large" if r2 > 0.5 else "lily_small"), Models.xf(Vector3(x, -0.06, z), Vector3(0, ry, 0), 1.8))
	for key in tall:
		for n in Models.instances(key.get_slice("|", 0), tall[key], true):
			_land.add_child(n)
	for key in low:
		for n in Models.instances(key.get_slice("|", 0), low[key], false):
			_land.add_child(n)
	if sticks.size():
		_land.add_child(Models.colored(_stick, sticks))
