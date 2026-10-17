class_name MineView
extends Node3D
## A mine floor: the cave, its rock walls, rocks with ore crystals, and the ladders. Port of
## scene/Mine.tsx. Rebuilt when the floor's tiles or ladders change.

## Ore crystal colors (the same as the item icons).
const ORE_COLORS := {"copperOre": "#3fae7a", "tinOre": "#3b3440", "ironOre": "#b24a2c", "goldOre": "#f2c230", "mithrilOre": "#5fd8f0"}
const ROCK_MODELS := ["Rock_1", "Rock_2", "Rock_3", "Rock_4"]

var _tiles: Array = []
var _ladders: Array = []
var _box := BoxMesh.new()
var _crystal := SphereMesh.new()


func _init() -> void:
	_box.size = Vector3.ONE
	# A four-sided "sphere" with two rings is an octahedron, like the web game's crystals.
	_crystal.radial_segments = 4
	_crystal.rings = 2
	_crystal.radius = 1
	_crystal.height = 2


func _clear() -> void:
	for c in get_children():
		c.queue_free()


func refresh(world: Dictionary) -> void:
	var m = world.get("mine")
	visible = m != null
	if m == null:
		_tiles = []
		return
	if is_same(m.tiles, _tiles) and is_same(m.buildings, _ladders):
		return
	_tiles = m.tiles
	_ladders = m.buildings
	_clear()
	var W := WorldMap.MINE_W
	var floor_items := []
	var walls := []
	var rocks := {}
	var crystals := []
	for i in _tiles.size():
		var t: Dictionary = _tiles[i]
		var x := float(i % W)
		var z := float(i / W)
		var r := Models.hash(i + 3)
		if t.ground == "cave":
			floor_items.append({"xf": Transform3D(Basis.from_scale(Vector3(1, 0.2, 1)), Vector3(x, -0.1, z)), "color": Color("#8a7866" if r > 0.5 else "#81705f")})
		else:
			var h := 1.1 + r * 0.3
			walls.append({"xf": Transform3D(Basis.from_scale(Vector3(1, h, 1)), Vector3(x, 0.45 + r * 0.15, z)), "color": Color("#5d534a" if r > 0.6 else ("#675c52" if r > 0.3 else "#564d45"))})
		if not t.obstacle:
			continue
		var r2 := Models.hash(i * 7 + 1)
		var ry := Models.hash(i * 3 + 2) * PI * 2
		var name: String = "qnature/" + ROCK_MODELS[int(floor(r2 * 4))]
		if not rocks.has(name):
			rocks[name] = []
		rocks[name].append(Models.xf(Vector3(x, 0, z), Vector3(0, ry, 0), 0.95))
		if t.obstacle == "stone":
			continue
		var color := Color(ORE_COLORS[t.obstacle])
		for k in 3:
			var a := ry + k * 2.1
			var s := 0.15 + Models.hash(i * 5 + k) * 0.07
			crystals.append({"xf": Models.xf(Vector3(x + cos(a) * 0.25, 0.4 + Models.hash(i + k) * 0.25, z + sin(a) * 0.25), Vector3(0.4, a, 0), s), "color": color})
	add_child(Models.colored(_box, floor_items))
	add_child(Models.colored(_box, walls, null, true))
	for name in rocks:
		for n in Models.instances(name, rocks[name], true):
			add_child(n)
	if crystals.size():
		var cm := StandardMaterial3D.new()
		cm.vertex_color_use_as_albedo = true
		cm.vertex_color_is_srgb = true
		cm.roughness = 0.3
		cm.emission_enabled = true
		cm.emission = Color("#222222")
		add_child(Models.colored(_crystal, crystals, cm))
	for b in _ladders:
		add_child(_ladder(b))


## A wooden ladder: up (leaning on the wall) or down (poking out of a hole).
func _ladder(b: Dictionary) -> Node3D:
	var down: bool = b.kind == "ladderDown"
	var root := Node3D.new()
	root.position = Vector3(b.x, 0, b.y)
	if down:
		var hole := MeshInstance3D.new()
		var disc := CylinderMesh.new()
		disc.top_radius = 0.42
		disc.bottom_radius = 0.42
		disc.height = 0.01
		hole.mesh = disc
		hole.position.y = 0.005
		var black := StandardMaterial3D.new()
		black.albedo_color = Color("#0b0806")
		black.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
		hole.material_override = black
		root.add_child(hole)
	var frame := Node3D.new()
	frame.position = Vector3(0, 0.1 if down else 0.7, 0 if down else -0.3)
	frame.rotation.x = -0.35 if down else -0.25
	root.add_child(frame)
	for x in [-0.2, 0.2]:
		frame.add_child(_box_node(Vector3(0.07, 0.9 if down else 1.5, 0.07), Vector3(x, 0, 0), "#8a5a3c"))
	for y in ([-0.25, 0.0, 0.25] if down else [-0.5, -0.2, 0.1, 0.4]):
		frame.add_child(_box_node(Vector3(0.42, 0.05, 0.06), Vector3(0, y, 0), "#a8774f"))
	return root


func _box_node(size: Vector3, pos: Vector3, color: String) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mi.mesh = mesh
	mi.position = pos
	mi.material_override = Models.mat(color)
	return mi
