class_name Actor
extends Node3D
## A Kenney mini character that walks, idles, and reaches out when you use a tool: the
## farmer, or a townsperson following their daily schedule.

const ROT := {"down": 0.0, "right": PI / 2, "up": PI, "left": -PI / 2}

var avatar := ""
var npc: Dictionary = {}
var _anim: AnimationPlayer
var _current := ""
var _tag: Label3D
var _lamp: OmniLight3D


static func make(avatar_name: String, npc_def: Dictionary = {}) -> Actor:
	var a := Actor.new()
	a.npc = npc_def
	a.set_avatar(avatar_name)
	if not npc_def.is_empty():
		a._tag = Label3D.new()
		a._tag.text = npc_def.short
		a._tag.position.y = 1.55 * npc_def.get("scale", 1.0)
		a._tag.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		a._tag.font_size = 36
		a._tag.pixel_size = 0.006
		a._tag.outline_size = 12
		a._tag.outline_modulate = Color("#2d2015")
		a._tag.no_depth_test = true
		a._tag.visible = false
		a.add_child(a._tag)
	else:
		a._lamp = OmniLight3D.new()
		a._lamp.position = Vector3(0, 1.6, 0.3)
		a._lamp.light_color = Color("#ffcf8a")
		a._lamp.omni_range = 7
		a._lamp.omni_attenuation = 1.6
		a._lamp.light_energy = 0
		a.add_child(a._lamp)
	return a


func set_avatar(name: String) -> void:
	if name == avatar:
		return
	avatar = name
	for c in get_children():
		if c != _tag and c != _lamp:
			c.queue_free()
	_anim = null
	_current = ""
	var packed := Models.scene("characters/character-" + name)
	if packed == null:
		return
	var body := packed.instantiate()
	(body as Node3D).scale = Vector3.ONE * 1.35 * npc.get("scale", 1.0)
	add_child(body)
	_fix_materials(body)
	_anim = body.find_child("AnimationPlayer", true, false)
	if _anim:
		for loop in ["idle", "walk"]:
			if _anim.has_animation(loop):
				_anim.get_animation(loop).loop_mode = Animation.LOOP_LINEAR
		_play("idle")


func _fix_materials(n: Node) -> void:
	if n is MeshInstance3D and n.mesh:
		for s in n.mesh.get_surface_count():
			var m: Material = n.mesh.surface_get_material(s)
			if m is BaseMaterial3D:
				m.metallic = 0.0
				m.roughness = maxf(m.roughness, 0.8)
	for c in n.get_children():
		_fix_materials(c)


func _play(name: String, blend := 0.15) -> void:
	if _anim and _anim.has_animation(name) and name != _current:
		_anim.play(name, blend)
		_current = name


## The farmer: follows the player's position and facing, and reaches out when acting.
func update_player(p: Dictionary, moving: bool, acted: bool, delta: float, daylight: float) -> void:
	position = Vector3(p.x, 0, p.y)
	rotation.y = _turn(rotation.y, ROT[p.facing], delta * 14)
	if acted and _anim and _anim.has_animation("interact-right"):
		_anim.play("interact-right", 0.05)
		_current = "interact-right"
	elif _current != "interact-right" or not _anim.is_playing() or moving:
		_play("walk" if moving else "idle")
	if _lamp:
		# Only after dark: in the Compatibility renderer every light is an extra pass over the
		# whole map's meshes.
		_lamp.visible = daylight < 0.3
		_lamp.light_energy = (1 - daylight) * 0.8


## A townsperson: walks their daily route, with a name tag when the player is close.
func update_npc(world: Dictionary, minute: float, player: Dictionary, delta: float) -> void:
	var pose := Town.npc_pose(world, npc, minute)
	visible = pose.visible
	position = Vector3(pose.x, 0, pose.y)
	rotation.y = _turn(rotation.y, ROT[pose.facing], delta * 10)
	_play("walk" if pose.moving else "idle", 0.2)
	if _tag:
		_tag.visible = pose.visible and Vector2(pose.x - player.x, pose.y - player.y).length() < 4.5


static func _turn(from: float, to: float, t: float) -> float:
	var diff := wrapf(to - from, -PI, PI)
	return from + diff * minf(1, t)
