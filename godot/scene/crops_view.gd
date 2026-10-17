class_name CropsView
extends Node3D
## Crops at four growth stages (sprout, young, mature, ripe) from data/crop_looks.json, plus
## seeds, dead plants, pests, and the sparkle on ripe crops. Port of Crops.tsx.

const SHAPE_COLOR := {
	"pod": "#b7d96a", "tuber": "#b98a55", "blossomWhite": "#fbf6ef", "blossomPink": "#e58fb4", "sunPetals": "#f2c230", "sunSeeds": "#5a3a22",
}
const SPOTS := [[-0.22, -0.2], [0.22, -0.18], [-0.2, 0.22], [0.2, 0.2]]

var _key := ""
var _shapes := {}
var _seed := SphereMesh.new()
var _dead := CylinderMesh.new()
var _pest := SphereMesh.new()
var _sparkle := SphereMesh.new()
var _sparkle_mat := Models.mat("#ffe066", "#ffcc33", 0.7)


func _init() -> void:
	var pod := CapsuleMesh.new()
	pod.radius = 0.035
	pod.height = 0.27
	var tuber := SphereMesh.new()
	tuber.radius = 0.07
	tuber.height = 0.12
	tuber.radial_segments = 5
	tuber.rings = 3
	var white := SphereMesh.new()
	white.radius = 0.035
	white.height = 0.07
	white.radial_segments = 5
	white.rings = 3
	var pink := SphereMesh.new()
	pink.radius = 0.04
	pink.height = 0.08
	pink.radial_segments = 5
	pink.rings = 3
	var petals := CylinderMesh.new()
	petals.top_radius = 0.17
	petals.bottom_radius = 0.17
	petals.height = 0.03
	petals.radial_segments = 12
	var seeds := CylinderMesh.new()
	seeds.top_radius = 0.08
	seeds.bottom_radius = 0.08
	seeds.height = 0.03
	seeds.radial_segments = 10
	_shapes = {"pod": pod, "tuber": tuber, "blossomWhite": white, "blossomPink": pink, "sunPetals": petals, "sunSeeds": seeds}
	_seed.radius = 0.035
	_seed.height = 0.07
	_seed.radial_segments = 5
	_seed.rings = 3
	_dead.top_radius = 0.0
	_dead.bottom_radius = 0.05
	_dead.height = 0.2
	_dead.radial_segments = 4
	_pest.radius = 0.04
	_pest.height = 0.08
	_sparkle.radius = 0.09
	_sparkle.height = 0.18
	_sparkle.radial_segments = 4
	_sparkle.rings = 2


static func stage_of(growth: float) -> String:
	if growth < 0.1:
		return ""
	if growth < 0.35:
		return "sprout"
	if growth < 0.7:
		return "young"
	if growth < 1:
		return "mature"
	return "ripe"


var _tiles: Array = []


func refresh(world: Dictionary) -> void:
	var tiles: Array = world.tiles
	if is_same(tiles, _tiles):
		return
	_tiles = tiles
	var key := PackedStringArray()
	for i in tiles.size():
		var c = tiles[i].crop
		if c != null:
			key.append("%d:%s:%s:%s:%s" % [i, c.id, stage_of(c.growth) if not c.dead else "dead", c.pests, c.growth >= 1])
	var k := ",".join(key)
	if k == _key:
		return
	_key = k
	for n in get_children():
		n.queue_free()
	_build(tiles)


func _build(tiles: Array) -> void:
	var W := WorldMap.W
	var looks: Dictionary = Data.load_json("crop_looks")
	var models := {}
	var shapes := {}
	var seeds := []
	var dead := []
	var pests := []
	var sparkles := []
	for i in tiles.size():
		var c = tiles[i].crop
		if c == null:
			continue
		var x := float(i % W)
		var z := float(i / W)
		if c.dead:
			for s in SPOTS.size():
				dead.append({"xf": Models.xf(Vector3(x + SPOTS[s][0], 0.11, z + SPOTS[s][1]), Vector3(0.5, s, 0.4)), "color": Color("#8a6f4a")})
			continue
		var stage := stage_of(c.growth)
		if stage == "":
			for s in SPOTS:
				seeds.append({"xf": Transform3D(Basis(), Vector3(x + s[0], 0.08, z + s[1])), "color": Color("#7cc35a")})
		else:
			var turn := Models.hash(i) * PI * 2
			for p in looks[c.id][stage]:
				var rx: float = p.get("rx", 0.0)
				var ry: float = 0.0 if rx else p.get("ry", 0.0) + turn
				var xf := Models.xf(Vector3(x + p.x, 0.03 + p.get("y", 0.0), z + p.z), Vector3(rx, ry, 0), p.s)
				if p.has("m"):
					if not models.has(p.m):
						models[p.m] = []
					models[p.m].append(xf)
				elif p.has("shape"):
					if not shapes.has(p.shape):
						shapes[p.shape] = []
					shapes[p.shape].append({"xf": xf, "color": Color(SHAPE_COLOR[p.shape])})
		if c.pests:
			pests.append({"xf": Transform3D(Basis(), Vector3(x + 0.1, 0.4, z + 0.1)), "color": Color("#c0392b")})
		if c.growth >= 1:
			sparkles.append({"xf": Models.xf(Vector3(x, 1.05, z), Vector3(0, 0, PI / 4))})
	for name in models:
		for n in Models.instances(name, models[name]):
			add_child(n)
	for s in shapes:
		add_child(Models.colored(_shapes[s], shapes[s]))
	for group in [[_seed, seeds], [_dead, dead], [_pest, pests]]:
		if group[1].size():
			add_child(Models.colored(group[0], group[1]))
	if sparkles.size():
		add_child(Models.colored(_sparkle, sparkles, _sparkle_mat))
