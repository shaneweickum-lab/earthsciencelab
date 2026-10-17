class_name BuildingsView
extends Node3D
## Every building, from Kenney's modular town pieces where there's a good model and simple
## shapes otherwise. Port of Buildings.tsx.

var _buildings: Array = []


func refresh(world: Dictionary) -> void:
	if is_same(world.buildings, _buildings):
		return
	_buildings = world.buildings
	for n in get_children():
		n.queue_free()
	for b in _buildings:
		var sz := WorldMap.size_of(b.kind)
		var root := Node3D.new()
		root.position = Vector3(b.x + (sz[0] - 1) / 2.0, 0, b.y + (sz[1] - 1) / 2.0)
		_fancy(root, b, sz[0], sz[1])
		if b.data.get("sign"):
			var sign := Label3D.new()
			sign.text = b.data.sign
			sign.position = Vector3(0, 3.1, 0)
			sign.billboard = BaseMaterial3D.BILLBOARD_ENABLED
			sign.font_size = 40
			sign.pixel_size = 0.006
			sign.outline_size = 14
			sign.modulate = Color("#fffcf5")
			sign.outline_modulate = Color("#6b4423")
			sign.no_depth_test = true
			root.add_child(sign)
		add_child(root)


func _m(root: Node3D, name: String, pos := Vector3.ZERO, ry := 0.0, scale: Variant = 1.0) -> void:
	root.add_child(Models.instance(name, Models.xf(pos, Vector3(0, ry, 0), scale)))


func _box(root: Node3D, size: Vector3, pos: Vector3, color: String, rot := Vector3.ZERO, emissive := "", energy := 0.0) -> void:
	var mi := MeshInstance3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	mi.mesh = mesh
	mi.position = pos
	mi.rotation = rot
	mi.material_override = Models.mat(color, emissive, energy)
	root.add_child(mi)


func _cyl(root: Node3D, top: float, bottom: float, h: float, pos: Vector3, color: String, segments := 8, rot := Vector3.ZERO) -> void:
	var mi := MeshInstance3D.new()
	var mesh := CylinderMesh.new()
	mesh.top_radius = top
	mesh.bottom_radius = bottom
	mesh.height = h
	mesh.radial_segments = segments
	mi.mesh = mesh
	mi.position = pos
	mi.rotation = rot
	mi.material_override = Models.mat(color)
	root.add_child(mi)


func _ball(root: Node3D, r: float, pos: Vector3, color: String, emissive := "", energy := 0.0) -> void:
	var mi := MeshInstance3D.new()
	var mesh := SphereMesh.new()
	mesh.radius = r
	mesh.height = r * 2
	mesh.radial_segments = 8
	mesh.rings = 5
	mi.mesh = mesh
	mi.position = pos
	mi.material_override = Models.mat(color, emissive, energy)
	root.add_child(mi)


## Something ready to collect (compost, honey).
func _ready_marker(root: Node3D) -> void:
	_ball(root, 0.12, Vector3(0, 1.3, 0), "#ffe066", "#ffcc33", 0.7)


## A building made from Kenney's modular town pieces. Each wall piece is a thin panel on the +x
## edge of a 1×1 cell, so it's rotated to face outward on each side of a w×d box.
func _walls(root: Node3D, w: int, d: int, floors: int, front: Callable, z := 0.0) -> void:
	var x0 := -(w - 1) / 2.0
	var z0 := -(d - 1) / 2.0 + z
	for f in floors:
		var side := func(k: int) -> String: return "wall-wood-window-shutters" if f > 0 or k % 2 == 1 else "wall-wood"
		for i in w:
			_m(root, "town/" + front.call(i, f), Vector3(x0 + i, f, z0 + d - 1), -PI / 2)
			_m(root, "town/" + ("wall-wood-window-small" if f > 0 and i % 2 else "wall-wood"), Vector3(x0 + i, f, z0), PI / 2)
		for j in d:
			_m(root, "town/" + side.call(j), Vector3(x0 + w - 1, f, z0 + j), 0)
			_m(root, "town/" + side.call(j + 1), Vector3(x0, f, z0 + j), PI)


## The roof: one gable piece stretched over the whole building.
func _roof(root: Node3D, w: int, d: int, y: float, z := 0.0) -> void:
	_m(root, "town/roof-high-gable", Vector3(0, y, z), PI / 2, Vector3(d / 1.1 + 0.15, 1.1, w / 1.1 + 0.1))


func _fancy(root: Node3D, b: Dictionary, w: int, h: int) -> void:
	var mid := w / 2
	match b.kind:
		"house":
			_walls(root, w, h, 2, func(i, f): return "wall-wood-door" if f == 0 and i == mid else ("wall-wood-window-shutters" if i % 2 else "wall-wood"))
			_roof(root, w, h, 2)
			_m(root, "town/chimney", Vector3(1.2, 2.4, -0.6), 0, Vector3(1, 1.2, 1))
			_m(root, "town/lantern", Vector3(1.1, 0, h / 2.0 + 0.25))
		"store":
			_walls(root, w, h - 1, 1, func(i, _f): return "wall-wood-door" if i == mid else "wall-wood-window-shutters", -0.5)
			_roof(root, w, h - 1, 1, -0.5)
			_m(root, "town/stall-green", Vector3(-1.5, 0, h / 2.0 - 0.5))
			_m(root, "town/stall-red", Vector3(1.5, 0, h / 2.0 - 0.5))
			_m(root, "town/banner-green", Vector3(-0.9, 0, h / 2.0 - 1))
		"shippingBin":
			_m(root, "survival/chest", Vector3(0, 0.12, -0.15), 0, 3)
		"fence":
			_m(root, "nature/fence_simple", Vector3(0, 0, 0.47), 0, Vector3(1, 1.5, 1))
		"pathStone":
			_m(root, "nature/path_stoneCircle", Vector3(0, 0.01, 0))
		"extension":
			_walls(root, w, h, 1, func(i, _f): return "wall-wood-door" if i == mid else "wall-wood-window-shutters")
			_roof(root, w, h, 1)
			_m(root, "town/banner-green", Vector3(1.6, 0, h / 2.0 + 0.15))
			_m(root, "town/stall-bench", Vector3(-1.4, 0, h / 2.0 + 0.4))
		"cottage":
			_walls(root, w, h, 1, func(i, _f): return "wall-wood-door" if i == 2 else "wall-wood-window-small")
			_roof(root, w, h, 1)
			_m(root, "town/chimney", Vector3(0.9, 1.3, -0.5))
		"fountain":
			_m(root, "town/fountain-round-detail", Vector3.ZERO, 0, 1.9)
		"lamp":
			_m(root, "town/lantern")
			_ball(root, 0.09, Vector3(0, 1.4, 0), "#ffe7a8", "#ffc861", 0.8)
		"field":
			for r in [-1, 0, 1]:
				_box(root, Vector3(w - 0.2, 0.06, 0.6), Vector3(0, 0.02, r), "#5a3a22")
			var corn := []
			for c in [-2, -1, 0, 1, 2]:
				for r in [-1, 0, 1]:
					corn.append(Models.xf(Vector3(c, 0.03, r), Vector3(0, (c * 3 + r) * 1.3, 0), 0.5))
			for n in Models.instances("crops/Corn_4", corn):
				root.add_child(n)
		"prop":
			if b.data.get("model"):
				_m(root, b.data.model)
		_:
			_procedural(root, b, w, h)


func _procedural(root: Node3D, b: Dictionary, w: int, h: int) -> void:
	var data: Dictionary = b.data
	match b.kind:
		"composter":
			_box(root, Vector3(0.8, 0.8, 0.8), Vector3(0, 0.4, 0), "#3d6b3f")
			_box(root, Vector3(0.85, 0.06, 0.85), Vector3(0, 0.83, 0), "#2c4f2e")
			if data.get("ready", 0) > 0:
				_ready_marker(root)
		"rainBarrel":
			_cyl(root, 0.33, 0.3, 0.9, Vector3(0, 0.45, 0), "#3f6f8f", 12)
			_cyl(root, 0.3, 0.3, 0.02, Vector3(0, 0.91, 0), "#6fb3dc" if data.get("water", 0) > 0 else "#2b3d4a", 12)
		"beehive":
			for i in 3:
				_box(root, Vector3(0.6, 0.26, 0.5), Vector3(0, 0.2 + i * 0.28, 0), "#f5e7b8" if i % 2 else "#fbf6ef")
			_box(root, Vector3(0.7, 0.06, 0.6), Vector3(0, 1.0, 0), "#b5532f")
			if data.get("ready"):
				_ready_marker(root)
		"birdHouse":
			_cyl(root, 0.04, 0.04, 1.2, Vector3(0, 0.6, 0), "#7a5636", 6)
			_box(root, Vector3(0.35, 0.35, 0.35), Vector3(0, 1.3, 0), "#c0603b")
			_cyl(root, 0.0, 0.32, 0.25, Vector3(0, 1.58, 0), "#6b4423", 4, Vector3(0, PI / 4, 0))
		"bugHotel":
			_box(root, Vector3(0.7, 0.9, 0.4), Vector3(0, 0.45, 0), "#9a6b3f")
			for i in 6:
				_cyl(root, 0.07, 0.07, 0.02, Vector3(-0.2 + (i % 3) * 0.2, 0.3 + (i / 3) * 0.3, 0.21), "#4a2f1c", 8, Vector3(PI / 2, 0, 0))
			_cyl(root, 0.0, 0.55, 0.3, Vector3(0, 1.0, 0), "#3f7d4e", 4, Vector3(0, PI / 4, 0))
		"scarecrow":
			_cyl(root, 0.04, 0.04, 1.4, Vector3(0, 0.7, 0), "#7a5636", 6)
			_box(root, Vector3(0.9, 0.06, 0.06), Vector3(0, 1.05, 0), "#7a5636")
			_box(root, Vector3(0.35, 0.45, 0.2), Vector3(0, 0.95, 0), "#3f86b0")
			_ball(root, 0.15, Vector3(0, 1.38, 0), "#e0c27a")
			_cyl(root, 0.0, 0.25, 0.2, Vector3(0, 1.52, 0), "#d6b04a", 10)
		"greenhouse":
			var glass := StandardMaterial3D.new()
			glass.albedo_color = Color("#cfeef0", 0.22)
			glass.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
			glass.roughness = 0.05
			var walls := MeshInstance3D.new()
			var box := BoxMesh.new()
			box.size = Vector3(w - 0.1, 2.2, h - 0.1)
			walls.mesh = box
			walls.position.y = 1.1
			walls.material_override = glass
			walls.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
			root.add_child(walls)
			for s in [[-1, -1], [1, -1], [-1, 1], [1, 1]]:
				_box(root, Vector3(0.1, 2.2, 0.1), Vector3(s[0] * (w / 2.0 - 0.05), 1.1, s[1] * (h / 2.0 - 0.05)), "#fbf6ef")
			_box(root, Vector3(w, 0.08, 0.08), Vector3(0, 2.2, 0), "#fbf6ef")
		"flowerBed":
			_box(root, Vector3(0.9, 0.12, 0.9), Vector3(0, 0.06, 0), "#5a3a22")
			var colors := ["#e85d75", "#f2c230", "#9b6ad6", "#fbf6ef", "#e8792b"]
			for i in colors.size():
				var p := Vector3(cos(i * 1.25) * 0.28, 0, sin(i * 1.25) * 0.28)
				_cyl(root, 0.015, 0.015, 0.25, p + Vector3(0, 0.2, 0), "#4f8a2e", 4)
				_ball(root, 0.07, p + Vector3(0, 0.34, 0), colors[i])
		"noticeBoard":
			for x in [-0.35, 0.35]:
				_box(root, Vector3(0.08, 1.2, 0.08), Vector3(x, 0.6, 0), "#7a5636")
			_box(root, Vector3(0.95, 0.6, 0.06), Vector3(0, 0.95, 0), "#b08458")
			_box(root, Vector3(1.05, 0.08, 0.14), Vector3(0, 1.3, 0), "#6b4423")
			var notes := [[-0.25, 1.02, "#fbf6ef"], [0.12, 0.9, "#ffe7a8"], [0.3, 1.05, "#fbf6ef"], [-0.1, 0.82, "#dcebd6"]]
			for i in notes.size():
				_box(root, Vector3(0.22, 0.2, 0.01), Vector3(notes[i][0], notes[i][1], 0.035), notes[i][2], Vector3(0, 0, (i - 1.5) * 0.08))
		_:
			_box(root, Vector3(w - 0.3, 1.2, h - 0.3), Vector3(0, 0.6, 0), "#c9b28f")
