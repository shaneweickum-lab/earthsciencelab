extends Node3D
## The farm in 3D: moves the player, runs the game clock, keeps the camera following, and
## turns keys into actions. Port of WorldScene.tsx and the key handling in WorldScreen.tsx.

const SPEED := 4.2  # tiles per second
const MOVE_KEYS := {
	KEY_W: "up", KEY_UP: "up", KEY_S: "down", KEY_DOWN: "down", KEY_A: "left", KEY_LEFT: "left", KEY_D: "right", KEY_RIGHT: "right",
}

var _terrain := TerrainView.new()
var _crops := CropsView.new()
var _buildings := BuildingsView.new()
var _sky := SkyView.new()
var _camera := Camera3D.new()
var _player: Actor
var _npcs := []
var _marker := MeshInstance3D.new()
var _ghost := MeshInstance3D.new()
var _critters := Node3D.new()
var _critter_list: Array = []
var _hud: Hud
var _acc := 0.0
var _zoom := 1.0
var _acted := false
var _publish_at := 0.0


func _ready() -> void:
	Game.load_or_new()
	for n in [_sky, _terrain, _crops, _buildings, _critters]:
		add_child(n)
	_camera.fov = 40
	_camera.near = 0.5
	_camera.far = 120
	add_child(_camera)
	_player = Actor.make(Game.world.get("avatar", Data.world().defaultAvatar))
	add_child(_player)
	for npc in Town.npcs():
		var a := Actor.make(npc.avatar, npc)
		_npcs.append(a)
		add_child(a)
	_make_marker()
	_hud = Hud.new()
	add_child(_hud)
	Game.world_changed.connect(_refresh)
	_refresh()
	for layer in Site.debug:
		match layer:
			"noland": _terrain._land.visible = false
			"noground": _terrain._ground.visible = false
			"nobuildings": _buildings.visible = false
			"nonpcs":
				for a in _npcs: a.visible = false
			"noshadow": _sky.sun.shadow_enabled = false
			"nohud": _hud.visible = false
	var p: Dictionary = Game.runtime.player
	_camera.position = Vector3(p.x, 12, p.y + 10)


func _make_marker() -> void:
	# Square outline on the tile you're about to work on.
	var ring := TorusMesh.new()
	ring.inner_radius = 0.6
	ring.outer_radius = 0.68
	ring.rings = 4
	ring.ring_segments = 3
	_marker.mesh = ring
	_marker.rotation.y = PI / 4
	_marker.scale = Vector3(1, 0.05, 1)
	var m := StandardMaterial3D.new()
	m.albedo_color = Color("#fffcf5", 0.85)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_marker.material_override = m
	add_child(_marker)
	# A see-through preview of the building you're about to place: green if it fits, red if not.
	_ghost.mesh = BoxMesh.new()
	var g := StandardMaterial3D.new()
	g.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	g.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_ghost.material_override = g
	_ghost.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(_ghost)


func _season() -> String:
	return World.season_now(Game.world)


func _refresh() -> void:
	var w := Game.world
	_terrain.refresh(w, _season())
	_crops.refresh(w)
	_buildings.refresh(w)
	_player.set_avatar(w.get("avatar", Data.world().defaultAvatar))
	_update_ghost()
	if not is_same(w.critters, _critter_list):
		_critter_list = w.critters
		for c in _critters.get_children():
			c.queue_free()
		for c in _critter_list:
			var e = World.journal_entry(c.kind)
			var label := Label3D.new()
			label.text = "✦ %s" % (e.name if e else c.kind)
			label.position = Vector3(c.x, 0.6, c.y)
			label.billboard = BaseMaterial3D.BILLBOARD_ENABLED
			label.font_size = 28
			label.pixel_size = 0.006
			label.outline_size = 10
			label.modulate = Color("#fff3b0")
			label.outline_modulate = Color("#2d2015")
			_critters.add_child(label)


func _update_ghost() -> void:
	var w := Game.world
	var slot = w.inventory[int(w.selected)]
	var kind = Data.items()[slot.item].get("building") if slot else null
	_ghost.visible = kind != null
	if kind == null:
		return
	var f := World.facing_tile(w)
	var o := World.placement_for(w, kind, f.x, f.y)
	var ok := World.can_place(w, kind, o.x, o.y) == ""
	var sz := WorldMap.size_of(kind)
	(_ghost.mesh as BoxMesh).size = Vector3(sz[0] - 0.05, 1, sz[1] - 0.05)
	_ghost.position = Vector3(o.x + (sz[0] - 1) / 2.0, 0.5, o.y + (sz[1] - 1) / 2.0)
	(_ghost.material_override as StandardMaterial3D).albedo_color = Color("#5fd16f" if ok else "#e0533d", 0.3)


func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	if not Game.has_world():
		return
	var paused := Game.menu != ""
	var w := Game.world
	var rt := Game.runtime

	# Movement.
	var dx := 0.0
	var dy := 0.0
	if not paused:
		for k in MOVE_KEYS:
			if Input.is_physical_key_pressed(k):
				match MOVE_KEYS[k]:
					"up": dy = -1
					"down": dy = 1
					"left": dx = -1
					"right": dx = 1
	rt.moving = dx != 0 or dy != 0
	if rt.moving:
		var len := Vector2(dx, dy).length()
		var before: Dictionary = rt.player
		var p := World.move_player(Js.with(w, {"player": before}), dx / len * SPEED * dt, dy / len * SPEED * dt)
		rt.player = p
		if Js.round(p.x) != Js.round(before.x) or Js.round(p.y) != Js.round(before.y) or p.facing != before.facing:
			Game.update(func(s): return Js.with(s, {"player": p}))

	# Clock: game time only passes while you're playing.
	if not paused:
		_acc += dt * 1000
		var ms := Clock.ms_per_game_minute(w.settings.speed)
		var minutes := int(floorf(_acc / ms))
		rt.minute_frac = minf(0.999, _acc / ms)
		if minutes > 0:
			_acc -= minutes * ms
			rt.minute_frac = _acc / ms
			var before_minute: float = Game.world.minute
			Game.update(func(s): return Nature.expire_critters(World.tick(s, minutes)))
			var after_minute: float = Game.world.minute
			if Clock.day_of(after_minute) != Clock.day_of(before_minute):
				Game.save()
				Game.open("summary")
			elif floorf(after_minute / 60) != floorf(before_minute / 60):
				Game.save()

	w = Game.world
	var player: Dictionary = rt.player
	_player.update_player(player, rt.moving, _acted, dt, Clock.daylight(w.minute))
	_acted = false
	for a in _npcs:
		a.update_npc(w, w.minute + rt.minute_frac, player, dt)
	_sky.update(w, player)
	var d: Array = World.DIRS[player.facing]
	_marker.position = Vector3(Js.round(player.x) + d[0], 0.07, Js.round(player.y) + d[1])
	for c in _critters.get_children():
		c.position.y = 0.6 + absf(sin(Time.get_ticks_msec() / 250.0)) * 0.15

	# Camera follows the player.
	var target := Vector3(player.x, 12 * _zoom, player.y + 0.5 + 9.5 * _zoom)
	_camera.position += (target - _camera.position) * minf(1, dt * 5)
	_camera.look_at(Vector3(_camera.position.x, 0, _camera.position.z - 9.5 * _zoom))

	_publish(delta)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_zoom = clampf(_zoom * 0.93, 0.55, 1.7)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_zoom = clampf(_zoom * 1.08, 0.55, 1.7)
	if not event is InputEventKey or not event.pressed:
		return
	var k: int = event.physical_keycode
	if Game.menu != "":
		if k == KEY_ESCAPE and Game.menu != "summary":
			Game.close()
		return
	if k == KEY_SPACE or k == KEY_E:
		if not event.echo:
			_do_action("interact" if k == KEY_E else "use")
		get_viewport().set_input_as_handled()
	elif k >= KEY_0 and k <= KEY_9:
		var n := 9 if k == KEY_0 else k - KEY_1
		Game.update(func(s): return Js.with(s, {"selected": n}))
	elif k == KEY_P:
		var f := World.facing_tile(Game.world)
		var b = World.building_at(Game.world, f.x, f.y)
		if b:
			Game.update(func(s): return World.pick_up_building(s, b.id))


## E talks, opens buildings, harvests, and observes; Space uses the item in your hand.
func _do_action(mode: String) -> void:
	var here := Js.with(Game.world, {"player": Game.runtime.player})
	var npc = Town.npc_in_front(here)
	if npc:
		var r := Town.talk(here, npc.id)
		Game.update(func(_s): return r.state)
		_hud.say("%s: “%s”" % [npc.short, r.text])
		return
	var target := World.interact_target(here)
	if target != "":
		Game.open(target)
		return
	_acted = true
	Game.update(func(s): return World.interact(s) if mode == "interact" else World.act(s))


## For the site and the smoke test: a small state dump on window.__soil.
func _publish(delta: float) -> void:
	_publish_at -= delta
	if _publish_at > 0 or not Site.is_web():
		return
	_publish_at = 0.25
	var w := Game.world
	var p: Dictionary = Game.runtime.player
	var state := {
		"ready": true, "grade": Site.grade_level, "save": Game.saved,
		"day": World.day(w), "minute": w.minute, "coins": w.coins, "menu": Game.menu,
		"player": {"x": p.x, "y": p.y, "facing": p.facing}, "selected": w.selected,
		"message": w.messages[-1].text if w.messages.size() else "",
		"fps": Engine.get_frames_per_second(),
		"process_ms": Performance.get_monitor(Performance.TIME_PROCESS) * 1000,
		"draw_calls": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
		"primitives": Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),
		"objects": Performance.get_monitor(Performance.RENDER_TOTAL_OBJECTS_IN_FRAME),
	}
	JavaScriptBridge.eval("window.__soil = %s" % JSON.stringify(state), true)
