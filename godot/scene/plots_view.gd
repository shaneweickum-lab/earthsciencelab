class_name PlotsView
extends Node3D
## Farmland you don't own yet: a low post-and-rail fence around each locked plot, and a sign.
## Port of scene/Plots.tsx. Rebuilt when the plots you own change.

var _owned = null
var _box := BoxMesh.new()


func _init() -> void:
	_box.size = Vector3.ONE


func refresh(world: Dictionary) -> void:
	var owned := World.owned_plots(world)
	if _owned != null and owned == _owned:
		return
	_owned = owned.duplicate()
	for c in get_children():
		c.queue_free()
	var posts := []
	var rails := []
	var signs := []
	for p in WorldMap.plots():
		if Js.includes(owned, p.id):
			continue
		var x0: float = p.x0 - 0.45
		var x1: float = p.x1 + 0.45
		var z0: float = p.y0 - 0.45
		var z1: float = p.y1 + 0.45
		for x in [x0, (x0 + x1) / 2, x1]:
			for z in [z0, z1]:
				posts.append({"xf": Transform3D(Basis.from_scale(Vector3(0.1, 0.44, 0.1)), Vector3(x, 0.22, z)), "color": Color("#9a6b3f")})
		for x in [x0, x1]:
			posts.append({"xf": Transform3D(Basis.from_scale(Vector3(0.1, 0.44, 0.1)), Vector3(x, 0.22, (z0 + z1) / 2)), "color": Color("#9a6b3f")})
		for z in [z0, z1]:
			rails.append({"xf": Transform3D(Basis.from_scale(Vector3(x1 - x0, 0.05, 0.05)), Vector3((x0 + x1) / 2, 0.3, z)), "color": Color("#b08458")})
		for x in [x0, x1]:
			rails.append({"xf": Transform3D(Basis.from_scale(Vector3(0.05, 0.05, z1 - z0)), Vector3(x, 0.3, (z0 + z1) / 2)), "color": Color("#b08458")})
		signs.append(Models.xf(Vector3(p.x0, 0, p.y0), Vector3(0, PI, 0), 1.2))
	if posts.is_empty():
		return
	add_child(Models.colored(_box, posts, null, true))
	add_child(Models.colored(_box, rails))
	for n in Models.instances("survival/signpost", signs, true):
		add_child(n)
