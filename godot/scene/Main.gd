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
var _mine := MineView.new()
var _plots := PlotsView.new()
## Where the camera last was ("up", or "mine-<floor>"), so it can jump when you change places.
var _place := ""
var _sky := SkyView.new()
var _camera := Camera3D.new()
var _player: Actor
var _npcs := []
var _marker := MeshInstance3D.new()
var _ghost := MeshInstance3D.new()
var _ghost_arrow := MeshInstance3D.new()
var _critters := Node3D.new()
var _critter_list: Array = []
var _ui: GameUi
var _world_root := Node3D.new()
var _built := false
var _acc := 0.0
var _zoom := 1.0
## The animation for the action just taken ("swing", "use", "pickup"), played on the next frame.
var _action_anim := ""
var _publish_at := 0.0


func _ready() -> void:
	_ui = GameUi.new()
	add_child(_ui)
	add_child(_world_root)
	_world_root.visible = false
	Game.screen_changed.connect(_on_screen)
	Game.world_changed.connect(_refresh)
	_on_screen()
	if Site.is_web():
		_command_cb = JavaScriptBridge.create_callback(_command)
		JavaScriptBridge.get_interface("window").__soilCommand = _command_cb


var _command_cb: JavaScriptObject


## For tests and the smoke test: window.__soilCommand("open:bag"), "continue", "use"…
func _command(args: Array) -> void:
	var cmd := str(args[0]) if args.size() else ""
	var arg := cmd.get_slice(":", 1)
	match cmd.get_slice(":", 0):
		"continue": Game.continue_game()
		"start": Game.start_quick()
		"setup": Game.open_setup()
		"open": Game.open(arg)
		"close": Game.close()
		"talk": Game.talk_to(arg)
		"use": do_action("use")
		"interact": do_action("interact")
		"select": Game.update(func(s): return Js.with(s, {"selected": int(arg)}))
		"quit": Game.quit_to_menu()


## The 3D world is built the first time you play, and hidden on the menus.
func _on_screen() -> void:
	var playing := Game.screen == "playing"
	_world_root.visible = playing
	if not playing:
		return
	if not _built:
		_build()
	_refresh()
	var p: Dictionary = Game.runtime.player
	_camera.position = Vector3(p.x, 12 * _zoom, p.y + 0.5 + 9.5 * _zoom)
	_acc = 0.0


func _build() -> void:
	_built = true
	for n in [_sky, _terrain, _crops, _buildings, _critters, _mine, _plots]:
		_world_root.add_child(n)
	_camera.fov = 40
	_camera.near = 0.5
	_camera.far = 120
	_world_root.add_child(_camera)
	_player = Actor.make(Game.world.get("avatar", Data.world().defaultAvatar))
	_world_root.add_child(_player)
	for npc in Town.npcs():
		var a := Actor.make(npc.avatar, npc)
		_npcs.append(a)
		_world_root.add_child(a)
	_make_marker()
	for layer in Site.debug:
		match layer:
			"noland": _terrain._land.visible = false
			"noground": _terrain._ground.visible = false
			"nobuildings": _buildings.visible = false
			"nonpcs":
				for a in _npcs: a.visible = false
			"noshadow": _sky.sun.shadow_enabled = false
			"nohud": _ui.visible = false


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
	_world_root.add_child(_marker)
	# A see-through preview of the building you're about to place: green if it fits, red if not.
	_ghost.mesh = BoxMesh.new()
	var g := StandardMaterial3D.new()
	g.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	g.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	_ghost.material_override = g
	_ghost.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_world_root.add_child(_ghost)
	# An arrow at its front, so you can see which way it will face.
	var cone := CylinderMesh.new()
	cone.top_radius = 0.0
	cone.bottom_radius = 0.18
	cone.height = 0.3
	cone.radial_segments = 3
	_ghost_arrow.mesh = cone
	_ghost_arrow.rotation.x = PI / 2
	_ghost_arrow.material_override = m
	_ghost.add_child(_ghost_arrow)


func _season() -> String:
	return World.season_now(Game.world)


func _refresh() -> void:
	if not _built or not Game.has_world():
		return
	var w := Game.world
	# Underground, only the mine floor shows; the farm keeps growing out of sight.
	var up: bool = w.get("mine") == null
	for n in [_terrain, _crops, _buildings, _critters, _plots]:
		n.visible = up
	for a in _npcs:
		a.visible = up and not "nonpcs" in Site.debug
	_mine.refresh(w)
	_terrain.refresh(w, _season())
	_crops.refresh(w)
	_buildings.refresh(w)
	_plots.refresh(w)
	_player.set_avatar(w.get("avatar", Data.world().defaultAvatar))
	_update_ghost()
	if not is_same(w.critters, _critter_list):
		_critter_list = w.critters
		for c in _critters.get_children():
			c.queue_free()
		for c in _critter_list:
			var sprite := Sprite3D.new()
			sprite.texture = Emoji.texture(Nature.critter_icon(c.kind))
			sprite.pixel_size = 0.008
			sprite.billboard = BaseMaterial3D.BILLBOARD_ENABLED
			sprite.position = Vector3(c.x, 0.6 + TerrainView.height_at(w.tiles, c.x, c.y), c.y)
			sprite.set_meta("y", sprite.position.y)
			_critters.add_child(sprite)


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
	var ground := 0.0 if w.get("mine") != null else TerrainView.height_at(w.tiles, o.x, o.y)
	_ghost.position = Vector3(o.x + (sz[0] - 1) / 2.0, 0.5 + ground, o.y + (sz[1] - 1) / 2.0)
	(_ghost.material_override as StandardMaterial3D).albedo_color = Color("#5fd16f" if ok else "#e0533d", 0.3)
	# Which way its front will face (R turns it).
	_ghost.rotation.y = (int(w.get("placeRot", 0)) if World.rotatable(kind) else 0) * PI / 2
	_ghost_arrow.position = Vector3(0, -0.42, sz[1] / 2.0 + 0.2)


func _process(delta: float) -> void:
	var dt := minf(delta, 0.05)
	_publish(delta)
	if not Game.has_world() or not _built:
		return
	var paused := Game.menu != ""
	var w := Game.world
	var rt := Game.runtime

	# Movement.
	var dx := 0.0
	var dy := 0.0
	if not paused:
		var held: Dictionary = rt.touch.duplicate()
		for k in MOVE_KEYS:
			if Input.is_physical_key_pressed(k):
				held[MOVE_KEYS[k]] = true
		dx = (1.0 if held.has("right") else 0.0) - (1.0 if held.has("left") else 0.0)
		dy = (1.0 if held.has("down") else 0.0) - (1.0 if held.has("up") else 0.0)
	rt.moving = dx != 0 or dy != 0
	if rt.moving:
		var len := Vector2(dx, dy).length()
		var before: Dictionary = rt.player
		var p := World.move_player(Js.with(w, {"player": before}), dx / len * SPEED * dt, dy / len * SPEED * dt)
		rt.player = p
		if Js.round(p.x) != Js.round(before.x) or Js.round(p.y) != Js.round(before.y) or p.facing != before.facing:
			Game.update(func(s): return Js.with(s, {"player": p}))
		# The end of your farm's road leads out to your gate on Garden Lane.
		if w.get("mine") == null and WorldMap.at_garden_exit(p):
			Game.update(World.leave_farm)

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
	# Your lantern lights up at night, and always underground.
	var slot = w.inventory[int(w.selected)]
	var up: bool = w.get("mine") == null
	var ground := TerrainView.height_at(w.tiles, player.x, player.y) if up else 0.0
	_player.update_player(player, rt.moving, _action_anim, dt, Clock.daylight(w.minute) if up else 0.0, slot.item if slot else "", ground)
	_action_anim = ""
	for a in _npcs:
		a.update_npc(w, w.minute + rt.minute_frac, player, dt)
	_sky.update(w, player)
	var d: Array = World.DIRS[player.facing]
	var mx: float = Js.round(player.x) + d[0]
	var mz: float = Js.round(player.y) + d[1]
	_marker.position = Vector3(mx, 0.07 + (TerrainView.height_at(w.tiles, mx, mz) if up else 0.0), mz)
	for c in _critters.get_children():
		c.position.y = c.get_meta("y", 0.6) + absf(sin(Time.get_ticks_msec() / 250.0)) * 0.15

	# Camera follows the player (and jumps there when you go in or out of the mine). Up the
	# mountain the camera rises too; at the map's edges it stops short of the void.
	var z := _zoom
	var tx: float = player.x if not up else minf(WorldMap.W - 9 * z, maxf(9 * z, player.x))
	var tz: float = (player.y if not up else minf(WorldMap.H - 4 * z, maxf(2, player.y))) + 0.5
	var target := Vector3(tx, ground + 12 * z, tz + 9.5 * z)
	var place: String = "mine-%d" % int(w.mine.floor) if w.get("mine") != null else "up"
	if place != _place:
		_place = place
		_camera.position = target
	_camera.position += (target - _camera.position) * minf(1, dt * 5)
	_camera.look_at(Vector3(_camera.position.x, _camera.position.y - 12 * _zoom, _camera.position.z - 9.5 * _zoom))


func _unhandled_input(event: InputEvent) -> void:
	if not Game.has_world():
		return
	if event is InputEventMouseButton and event.pressed and Game.menu == "":
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_zoom = clampf(_zoom * 0.93, 0.55, 1.7)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_zoom = clampf(_zoom * 1.08, 0.55, 1.7)
	if not event is InputEventKey or not event.pressed:
		return
	var k: int = event.physical_keycode
	var menu := Game.menu
	# The I window: I (or Tab) opens or closes it; J, Q, and C go straight to their tab.
	var tab: String = {KEY_J: "journal", KEY_Q: "quests", KEY_C: "cookbook"}.get(k, "")
	if menu != "":
		if menu in Game.HUB_TABS and tab != "":
			if menu == tab:
				Game.close()
			else:
				Game.open(tab)
			return
		# Escape (or I in the I window) closes it, except the letter and the morning summary.
		var toggles: bool = (k == KEY_I or k == KEY_TAB) and menu in Game.HUB_TABS
		if (k == KEY_ESCAPE or toggles) and menu != "intro" and menu != "summary":
			Game.close()
		return
	match k:
		KEY_ESCAPE:
			Game.open("pause")
		KEY_SPACE, KEY_E:
			if not event.echo:
				do_action("interact" if k == KEY_E else "use")
		KEY_I, KEY_TAB:
			Game.open("bag")
		KEY_J:
			Game.open("journal")
		KEY_Q:
			Game.open("quests")
		KEY_P:
			var f := World.facing_tile(Game.world)
			var b = World.building_at(Game.world, f.x, f.y)
			if b:
				Game.update(func(s): return World.pick_up_building(s, b.id))
		KEY_R:
			# Turn what you built, or the next thing you're about to build.
			var here := Js.with(Game.world, {"player": Game.runtime.player})
			var f := World.facing_tile(here)
			var b = World.building_at(here, f.x, f.y)
			var slot = here.inventory[int(here.selected)]
			if b != null and World.can_pick_up(b) and here.get("mine") == null:
				Game.update(World.rotate_building)
			elif slot != null and Items.get_def(slot.item).kind == "kit":
				Game.update(World.turn_placing)
		KEY_C:
			Game.open("cookbook")
		KEY_F:
			Site.toggle_fullscreen()
		_:
			if k >= KEY_0 and k <= KEY_9:
				var n := 9 if k == KEY_0 else k - KEY_1
				Game.update(func(s): return Js.with(s, {"selected": n}))
	get_viewport().set_input_as_handled()


## Space uses the item in your hand; E always interacts: talk, open, harvest, or observe.
func do_action(mode: String) -> void:
	if not Game.has_world() or Game.menu != "":
		return
	var here := Js.with(Game.world, {"player": Game.runtime.player})
	var npc = Town.npc_in_front(here)
	if npc:
		Game.talk_to(npc.id)
		return
	var target := World.interact_target(here)
	if target == "gate":
		var f := World.facing_tile(here)
		var garden := int(World.building_at(here, f.x, f.y).data.get("garden", 0))
		Game.update(func(s): return World.enter_gate(s, garden))
		return
	if target == "chest" or target == "craft":
		var f := World.facing_tile(here)
		Game.chest_id = World.building_at(here, f.x, f.y).id
	if target == "plot":
		var f := World.facing_tile(here)
		Game.chest_id = str(WorldMap.plot_at(f.x, f.y))
	if target != "":
		Game.open(target)
		return
	# E reaches out to touch or collect; Space uses the item in hand.
	_action_anim = "pickup" if mode == "interact" else Preview.action_anim(here)
	Game.update(func(s): return World.interact(s) if mode == "interact" else World.act(s))


## For the site and the smoke test: a small state dump on window.__soil.
func _publish(delta: float) -> void:
	_publish_at -= delta
	if _publish_at > 0 or not Site.is_web():
		return
	_publish_at = 0.25
	var state := {"ready": true, "grade": Site.grade_level, "save": Game.saved, "screen": Game.screen, "menu": Game.menu, "fps": Engine.get_frames_per_second()}
	if Game.has_world():
		var w := Game.world
		var p: Dictionary = Game.runtime.player
		state.merge({
			"day": World.day(w), "minute": w.minute, "coins": w.coins, "selected": w.selected, "journal": w.journal.size(),
			"player": {"x": p.x, "y": p.y, "facing": p.facing},
			"message": w.messages[-1].text if w.messages.size() else "",
			"draw_calls": Performance.get_monitor(Performance.RENDER_TOTAL_DRAW_CALLS_IN_FRAME),
			"primitives": Performance.get_monitor(Performance.RENDER_TOTAL_PRIMITIVES_IN_FRAME),
		})
	JavaScriptBridge.eval("window.__soil = %s" % JSON.stringify(state), true)
