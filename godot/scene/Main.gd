extends Node3D
## M0 placeholder: proves the web build runs, sees the site's grade level, and finds the
## farm save. The real world scene replaces this in M2.

var _label: Label
var _sprout: Node3D


func _ready() -> void:
	var env := WorldEnvironment.new()
	env.environment = Environment.new()
	env.environment.background_mode = Environment.BG_COLOR
	env.environment.background_color = Color("#bfe3c0")
	env.environment.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.environment.ambient_light_color = Color("#fff6e0")
	add_child(env)

	var sun := DirectionalLight3D.new()
	sun.rotation_degrees = Vector3(-50, -30, 0)
	add_child(sun)

	var cam := Camera3D.new()
	cam.position = Vector3(0, 3, 5)
	add_child(cam)
	cam.look_at(Vector3(0, 0.6, 0))

	var soil := MeshInstance3D.new()
	soil.mesh = BoxMesh.new()
	soil.mesh.size = Vector3(3, 0.4, 3)
	soil.material_override = _mat("#7a5232")
	add_child(soil)

	_sprout = Node3D.new()
	add_child(_sprout)
	var stem := MeshInstance3D.new()
	stem.mesh = CylinderMesh.new()
	stem.mesh.top_radius = 0.05
	stem.mesh.bottom_radius = 0.07
	stem.mesh.height = 1.0
	stem.position.y = 0.7
	stem.material_override = _mat("#3f8f3a")
	_sprout.add_child(stem)
	for side in [-1, 1]:
		var leaf := MeshInstance3D.new()
		leaf.mesh = SphereMesh.new()
		leaf.mesh.radius = 0.22
		leaf.mesh.height = 0.2
		leaf.position = Vector3(0.22 * side, 1.15, 0)
		leaf.rotation_degrees.z = -25 * side
		leaf.material_override = _mat("#5cb85c")
		_sprout.add_child(leaf)

	_label = Label.new()
	_label.position = Vector2(24, 20)
	_label.add_theme_font_size_override("font_size", 22)
	_label.add_theme_color_override("font_color", Color("#2d2015"))
	add_child(_label)
	Site.grade_changed.connect(func(_l): _refresh())
	_refresh()


func _refresh() -> void:
	var save := SaveIO.read()
	var world = JSON.parse_string(save) if save != "" else null
	var found := "No saved farm yet."
	if world is Dictionary:
		found = "Saved farm found: version %d, %d coins." % [int(world.get("version", 0)), int(world.get("coins", 0))]
	_label.text = "Soil & Sprout (Godot preview)\nGrade level: %s\n%s" % [Site.grade_level, found]
	if Site.is_web():
		var state := {"ready": true, "grade": Site.grade_level, "save": world is Dictionary}
		JavaScriptBridge.eval("window.__soil = %s" % JSON.stringify(state), true)


func _process(delta: float) -> void:
	_sprout.rotate_y(delta * 0.6)


func _mat(hex: String) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(hex)
	m.roughness = 0.9
	return m
