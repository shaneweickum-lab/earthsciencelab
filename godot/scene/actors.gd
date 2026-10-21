class_name Actor
extends Node3D
## A Kenney mini character that walks and idles: the farmer (holding the selected hotbar item,
## and swinging, using, or picking up when you act), or a townsperson on their daily schedule.

const ROT := {"down": 0.0, "right": PI / 2, "up": PI, "left": -PI / 2}

var avatar := ""
var npc: Dictionary = {}
var _anim: AnimationPlayer
var _current := ""
var _tag: Label3D
var _lamp: OmniLight3D
## The farmer's right hand (a BoneAttachment3D on the arm bone), what's in it, and an action
## animation that's playing, if any.
var _hand: BoneAttachment3D
var _held := ""
var _held_node: Node3D
var _one_shot := ""
var _pour := 0.0

## Which character animation each kind of action plays, and how fast (Kenney's swing and
## pick-up are quick, so they're slowed a little to read).
const ACTION_CLIPS := {"swing": "attack-melee-right", "use": "interact-right", "pickup": "pick-up"}
const ACTION_SPEED := {"swing": 0.7, "use": 1.0, "pickup": 0.55}
## Where the fist is on the arm bone: the arm runs along the bone's −x, and +y points up out of
## the fist (the same numbers as the web game's HeldItem.tsx).
const HAND := Vector3(-0.13, -0.03, 0)
const TIER_COLORS := {"copper": "#c8753d", "bronze": "#b8893a", "iron": "#d4d8dc", "gold": "#f2c230", "mithril": "#7fd6e8"}


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
	_hand = null
	_held = ""
	if npc.is_empty():
		var skel := _find_skeleton(body)
		if skel and skel.find_bone("arm-right") >= 0:
			_hand = BoneAttachment3D.new()
			_hand.bone_name = "arm-right"
			skel.add_child(_hand)
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


static func _find_skeleton(n: Node) -> Skeleton3D:
	if n is Skeleton3D:
		return n
	for c in n.get_children():
		var s := _find_skeleton(c)
		if s:
			return s
	return null


## The farmer: follows the player's position and facing, holds the selected item, and plays an
## action animation ("swing", "use", "pickup") when one is given.
## `ground` is the height of the ground under them (mountain terraces).
func update_player(p: Dictionary, moving: bool, action: String, delta: float, daylight: float, held: String, ground := 0.0) -> void:
	position = Vector3(p.x, ground, p.y)
	rotation.y = _turn(rotation.y, ROT[p.facing], delta * 14)
	_set_held(held)
	if _anim:
		if action != "" and _anim.has_animation(ACTION_CLIPS[action]):
			_one_shot = ACTION_CLIPS[action]
			_anim.play(_one_shot, 0.05, ACTION_SPEED[action])
			_current = _one_shot
			_pour = 0.65 if action == "use" and held == "can" else 0.0
		# Walking cuts an action short; otherwise it plays to the end.
		if _one_shot != "" and (moving or not _anim.is_playing() or _anim.current_animation != _one_shot):
			_one_shot = ""
		if _one_shot == "":
			_play("walk" if moving else ("holding-right" if held != "" and _anim.has_animation("holding-right") else "idle"))
	# The watering can tips forward while you pour.
	if _held_node:
		_pour = maxf(0.0, _pour - delta)
		_held_node.rotation.x = -sin((1.0 - _pour / 0.65) * PI) * 1.1 if _pour > 0 else 0.0
	if _lamp:
		# Only after dark: in the Compatibility renderer every light is an extra pass over the
		# whole map's meshes.
		_lamp.visible = daylight < 0.3
		_lamp.light_energy = (1 - daylight) * 0.8


## Put the selected hotbar item in the farmer's hand: tools as small models, anything else as
## its hotbar picture on a card that faces the camera.
func _set_held(id: String) -> void:
	if id == _held or _hand == null:
		return
	_held = id
	if _held_node:
		_held_node.queue_free()
		_held_node = null
	if id == "" or not Data.items().has(id):
		return
	var root := Node3D.new()
	root.position = HAND
	var holder := Node3D.new()
	root.add_child(holder)
	var def: Dictionary = Data.items()[id]
	var tool = def.get("tool")
	if tool:
		var tint: String = TIER_COLORS.get(tool.tier, "")
		match tool.use:
			"axe", "pickaxe", "hoe", "shovel":
				var m := Models.instance("survival/tool-" + tool.use, Transform3D(Basis().scaled(Vector3.ONE * 1.8), Vector3.ZERO), true)
				if tint != "":
					_tint_metal(m, Color(tint))
				holder.add_child(m)
			"scythe":
				holder.add_child(_part(_cyl_mesh(0.012, 0.015, 0.45), Vector3(0, 0.15, 0), Vector3.ZERO, "#b07a4f"))
				holder.add_child(_part(_box_mesh(Vector3(0.22, 0.03, 0.02)), Vector3(0.1, 0.37, 0), Vector3(0, 0, -0.3), "#c9ced6"))
			"can":
				holder.add_child(_part(_cyl_mesh(0.085, 0.09, 0.15), Vector3(0, -0.12, 0), Vector3.ZERO, "#4f8a6e"))
				holder.add_child(_part(_cyl_mesh(0.01, 0.018, 0.17), Vector3(0, -0.09, 0.1), Vector3(0.9, 0, 0), "#4f8a6e"))
			"ring":
				holder.add_child(_part(_cyl_mesh(0.13, 0.13, 0.12), Vector3(0, -0.02, 0), Vector3.ZERO, "#b9bcb6"))
	else:
		var card := Sprite3D.new()
		var path := "res://assets/icons/%s.png" % id
		card.texture = load(path) if ResourceLoader.exists(path) else Emoji.texture(def.icon)
		card.pixel_size = 0.32 / 96.0
		card.billboard = BaseMaterial3D.BILLBOARD_ENABLED
		card.position = Vector3(0, 0.14, 0)
		card.no_depth_test = false
		holder.add_child(card)
	_hand.add_child(root)
	_held_node = holder


func _part(mesh: Mesh, pos: Vector3, rot: Vector3, color: String) -> MeshInstance3D:
	var mi := MeshInstance3D.new()
	mi.mesh = mesh
	mi.position = pos
	mi.rotation = rot
	mi.material_override = Models.mat(color)
	return mi


static func _cyl_mesh(top: float, bottom: float, h: float) -> CylinderMesh:
	var m := CylinderMesh.new()
	m.top_radius = top
	m.bottom_radius = bottom
	m.height = h
	m.radial_segments = 10
	return m


static func _box_mesh(size: Vector3) -> BoxMesh:
	var m := BoxMesh.new()
	m.size = size
	return m


## Tinted tool materials, made once per material and tier.
static var _tinted := {}


## Recolor a tool's grey metal for its tier, as the icons do.
static func _tint_metal(n: Node, tint: Color) -> void:
	if n is MeshInstance3D and n.mesh:
		for s in n.mesh.get_surface_count():
			var m = n.get_active_material(s)
			if m is BaseMaterial3D and m.albedo_texture:
				var key := "%d|%s" % [m.get_instance_id(), tint.to_html()]
				if _tinted.has(key):
					n.set_surface_override_material(s, _tinted[key])
					continue
				var img: Image = m.albedo_texture.get_image()
				if img == null:
					continue
				img = img.duplicate()
				if img.is_compressed():
					img.decompress()
				for y in img.get_height():
					for x in img.get_width():
						var c := img.get_pixel(x, y)
						var mx := maxf(c.r, maxf(c.g, c.b))
						var mn := minf(c.r, minf(c.g, c.b))
						if mx > 90.0 / 255.0 and (mx - mn) / mx < 0.3:
							var k := mx * 255.0 / 175.0
							img.set_pixel(x, y, Color(minf(1, tint.r * k), minf(1, tint.g * k), minf(1, tint.b * k), c.a))
				var copy: BaseMaterial3D = m.duplicate()
				copy.albedo_texture = ImageTexture.create_from_image(img)
				_tinted[key] = copy
				n.set_surface_override_material(s, copy)
	for c in n.get_children():
		_tint_metal(c, tint)


## A townsperson: walks their daily route, with a name tag when the player is close.
func update_npc(world: Dictionary, minute: float, player: Dictionary, delta: float) -> void:
	var pose := Town.npc_pose(world, npc, minute)
	visible = pose.visible
	position = Vector3(pose.x, TerrainView.height_at(world.tiles, pose.x, pose.y), pose.y)
	rotation.y = _turn(rotation.y, ROT[pose.facing], delta * 10)
	_play("walk" if pose.moving else "idle", 0.2)
	if _tag:
		_tag.visible = pose.visible and Vector2(pose.x - player.x, pose.y - player.y).length() < 4.5


static func _turn(from: float, to: float, t: float) -> float:
	var diff := wrapf(to - from, -PI, PI)
	return from + diff * minf(1, t)
