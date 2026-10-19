class_name GameUi
extends CanvasLayer
## Everything drawn over the 3D world: the main menu and new-game setup, the HUD, and the open
## menu. Port of WorldScreen.tsx's layout. Menus are rebuilt when the world or menu changes;
## `ui` keeps their own small state (tabs, selections) between rebuilds.

var ui := {}
var _root := Control.new()
var _screens := Control.new()
var _hud := Control.new()
var _modal := Control.new()
var _clock: Control
var _clock_text := ""
var _rebuild_queued := false


func _ready() -> void:
	_root.theme = Ui.theme()
	_root.set_anchors_preset(Control.PRESET_FULL_RECT)
	_root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(_root)
	for c in [_hud, _screens, _modal]:
		c.set_anchors_preset(Control.PRESET_FULL_RECT)
		c.mouse_filter = Control.MOUSE_FILTER_IGNORE
		_root.add_child(c)
	Game.screen_changed.connect(_queue)
	Game.menu_changed.connect(_on_menu)
	Game.world_changed.connect(_queue)
	get_viewport().size_changed.connect(_queue)
	_queue()


func _on_menu() -> void:
	ui.erase("tab")
	ui.erase("held")
	ui.erase("look")
	ui.erase("said")
	_queue()


func _queue() -> void:
	if not _rebuild_queued:
		_rebuild_queued = true
		_rebuild.call_deferred()


func refresh() -> void:
	_queue()


func _clear(n: Node) -> void:
	for c in n.get_children():
		n.remove_child(c)
		c.queue_free()


func _rebuild() -> void:
	_rebuild_queued = false
	_clear(_screens)
	_clear(_hud)
	_clear(_modal)
	match Game.screen:
		"menu":
			_screens.add_child(Screens.main_menu(self))
			return
		"setup":
			_screens.add_child(Screens.new_game(self))
			return
	if not Game.has_world():
		return
	_build_hud()
	if Game.menu != "":
		var m = Menus.build(self, Game.menu)
		if m is Dictionary:
			_modal.add_child(m.root)
			_fit.call_deferred(m)


## Size a modal's scroll area to its content, up to most of the screen.
func _fit(m: Dictionary) -> void:
	if not is_instance_valid(m.root):
		return
	var scroll: ScrollContainer = m.scroll
	var content: Control = scroll.get_child(0)
	var h := get_viewport().get_visible_rect().size.y
	scroll.custom_minimum_size.y = minf(content.get_combined_minimum_size().y, h - 140)
	if ui.has("scroll_" + Game.menu):
		scroll.set_deferred("scroll_vertical", ui["scroll_" + Game.menu])
	scroll.get_v_scroll_bar().value_changed.connect(func(v): ui["scroll_" + Game.menu] = v)


func _process(_delta: float) -> void:
	if _clock and is_instance_valid(_clock) and Game.has_world():
		var t := Hud.clock_text(Game.world)
		if t != _clock_text:
			_clock_text = t
			_queue()


func _build_hud() -> void:
	var w := Game.world
	_clock_text = Hud.clock_text(w)
	# Top left: Grandma's note and recent messages.
	var tl := Ui.vbox(6)
	tl.position = Vector2(12, 12)
	var tut = Hud.tutorial(self, w)
	if tut:
		tut.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
		tl.add_child(tut)
	tl.add_child(Hud.messages(w))
	_hud.add_child(tl)
	# Top right: date, weather, time, and coins.
	_clock = Hud.status(w)
	_clock.set_anchors_and_offsets_preset(Control.PRESET_TOP_RIGHT, Control.PRESET_MODE_MINSIZE, 12)
	_clock.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	_hud.add_child(_clock)
	# Bottom: energy and water over the hotbar.
	var bar := Hud.hotbar(w)
	bar.set_anchors_and_offsets_preset(Control.PRESET_CENTER_BOTTOM, Control.PRESET_MODE_MINSIZE, 12)
	bar.grow_horizontal = Control.GROW_DIRECTION_BOTH
	bar.grow_vertical = Control.GROW_DIRECTION_BEGIN
	_hud.add_child(bar)
	var size := get_viewport().get_visible_rect().size
	# Bottom left: the I window (bag, journal, quests, cookbook, and game menu). Bottom right: what's in front of you.
	var bl := Ui.hbox(6)
	bl.add_child(Ui.button("🎒 (I)", func(): Game.open(Game.last_tab), "flat", 14))
	bl.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT, Control.PRESET_MODE_MINSIZE, 12)
	bl.grow_vertical = Control.GROW_DIRECTION_BEGIN
	if size.x >= 900:
		_hud.add_child(bl)
		var insp := Hud.inspector(w)
		if insp:
			insp.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT, Control.PRESET_MODE_MINSIZE, 12)
			insp.grow_horizontal = Control.GROW_DIRECTION_BEGIN
			insp.grow_vertical = Control.GROW_DIRECTION_BEGIN
			insp.position.y -= 84
			_hud.add_child(insp)
	if DisplayServer.is_touchscreen_available():
		_hud.add_child(Hud.touch_controls(self))
