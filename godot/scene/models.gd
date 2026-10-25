class_name Models
## CC0 models (Kenney, and Quaternius crops, nature, trees and farm buildings) copied from public/models by `npm run godot:export`.
##
## Kenney's Nature Kit uses a bright pastel palette and marks its colors as metallic, which
## renders nearly black without an environment map. Materials are repainted by name to match
## the farm's earthy look and made matte (the same fix as models.tsx in the web game).

const PALETTE := {
	"grass": "#6fae4f", "leafsGreen": "#4f9a45", "leafsDark": "#3d7058", "leafsFall": "#e08a3c",
	"woodBark": "#8a5a3c", "woodBarkDark": "#6e4a35", "woodInner": "#e8c99a", "woodBirch": "#efe6d6",
	"dirt": "#8a6040", "stone": "#b9bcb6", "stoneDark": "#8f948f", "wood": "#b07a4f", "woodDark": "#8a5a3c", "corn": "#f0c75a",
}

static var _parts := {}
static var _scenes := {}


static func path(name: String) -> String:
	return "res://assets/models/%s.glb" % name


static func exists(name: String) -> bool:
	return ResourceLoader.exists(path(name))


static func scene(name: String) -> PackedScene:
	if not _scenes.has(name):
		_scenes[name] = load(path(name)) if exists(name) else null
	return _scenes[name]


static func _fix(mat: Material) -> void:
	if not mat is BaseMaterial3D or mat.has_meta("fixed"):
		return
	mat.set_meta("fixed", true)
	mat.metallic = 0.0
	mat.roughness = maxf(mat.roughness, 0.8)
	if PALETTE.has(mat.resource_name):
		mat.albedo_color = Color(PALETTE[mat.resource_name])


## Every mesh in a model ("pack/name") with its transform relative to the model root. A
## "#rrggbb" ending tints its leaves (autumn colors), the way models.tsx does.
static func parts(name: String) -> Array:
	if _parts.has(name):
		return _parts[name]
	var out := []
	var bits := name.split("#")
	if bits.size() > 1:
		for p in parts(bits[0]):
			out.append({"mesh": _tinted(p.mesh, Color("#" + bits[1])), "xform": p.xform})
		_parts[name] = out
		return out
	var packed := scene(name)
	if packed != null:
		var root := packed.instantiate()
		_collect(root, Transform3D.IDENTITY, out)
		root.free()
	_parts[name] = out
	return out


## A copy of a mesh whose leaf materials are another color; bark and everything else is shared.
static func _tinted(mesh: Mesh, tint: Color) -> Mesh:
	var copy: Mesh = mesh.duplicate()
	for s in copy.get_surface_count():
		var m := copy.surface_get_material(s)
		if m is BaseMaterial3D and "leaves" in m.resource_name.to_lower():
			var t: BaseMaterial3D = m.duplicate()
			t.albedo_color = tint
			copy.surface_set_material(s, t)
	return copy


static func _collect(node: Node, parent: Transform3D, out: Array) -> void:
	var xf := parent
	if node is Node3D:
		xf = parent * node.transform
	if node is MeshInstance3D and node.mesh != null:
		var mesh: Mesh = node.mesh
		for s in mesh.get_surface_count():
			var m := mesh.surface_get_material(s)
			if m:
				_fix(m)
		out.append({"mesh": mesh, "xform": xf})
	for c in node.get_children():
		_collect(c, xf, out)


## One copy of a model, for buildings and other one-offs.
static func instance(name: String, xf := Transform3D.IDENTITY, shadows := true) -> Node3D:
	var n := Node3D.new()
	n.transform = xf
	for p in parts(name):
		var mi := MeshInstance3D.new()
		mi.mesh = p.mesh
		mi.transform = p.xform
		mi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		n.add_child(mi)
	return n


## Draw many copies of a model with one draw call per mesh. Returns the nodes to add.
static func instances(name: String, xforms: Array, shadows := false) -> Array:
	var out := []
	if xforms.is_empty():
		return out
	for p in parts(name):
		var mm := MultiMesh.new()
		mm.transform_format = MultiMesh.TRANSFORM_3D
		mm.mesh = p.mesh
		mm.instance_count = xforms.size()
		for i in xforms.size():
			mm.set_instance_transform(i, xforms[i] * p.xform)
		var mmi := MultiMeshInstance3D.new()
		mmi.multimesh = mm
		mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		out.append(mmi)
	return out


## Many copies of one simple mesh, each with its own color. items: [{xf, color}]
static func colored(mesh: Mesh, items: Array, material: Material = null, shadows := false) -> MultiMeshInstance3D:
	var mm := MultiMesh.new()
	mm.transform_format = MultiMesh.TRANSFORM_3D
	mm.use_colors = true
	mm.mesh = mesh
	mm.instance_count = items.size()
	for i in items.size():
		mm.set_instance_transform(i, items[i].xf)
		mm.set_instance_color(i, items[i].get("color", Color.WHITE))
	var mmi := MultiMeshInstance3D.new()
	mmi.multimesh = mm
	var mat: Material = material
	if mat == null:
		var std := StandardMaterial3D.new()
		std.vertex_color_use_as_albedo = true
		std.vertex_color_is_srgb = true
		std.roughness = 1.0
		mat = std
	mmi.material_override = mat
	mmi.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_ON if shadows else GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	return mmi


## A matte flat-shaded material.
static func mat(color: String, emissive := "", energy := 0.0) -> StandardMaterial3D:
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(color)
	m.roughness = 0.9
	if emissive != "":
		m.emission_enabled = true
		m.emission = Color(emissive)
		m.emission_energy_multiplier = energy
	return m


## A transform from position, Euler rotation, and uniform or per-axis scale.
static func xf(pos: Vector3, rot := Vector3.ZERO, scale: Variant = 1.0) -> Transform3D:
	var s: Vector3 = scale if scale is Vector3 else Vector3.ONE * float(scale)
	var b := Basis.from_euler(rot, EULER_ORDER_XYZ) * Basis.from_scale(s)
	return Transform3D(b, pos)


## Deterministic pseudo-random number from an integer, for scattering details (same as the web game).
static func hash(n: float) -> float:
	var x := sin(n * 12.9898) * 43758.5453
	return x - floorf(x)
