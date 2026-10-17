class_name Hud
extends CanvasLayer
## A plain heads-up display for the Godot preview: clock and weather, coins and energy, the
## message feed, and the hotbar, plus simple panels for bed and the morning summary.
## The full menus (bag, shop, journal, settings, townsfolk) replace this in the UI milestone.

var _clock := Label.new()
var _feed := VBoxContainer.new()
var _hotbar := HBoxContainer.new()
var _panel := PanelContainer.new()
var _panel_box := VBoxContainer.new()
var _talk := ""
var _talk_until := 0


func _ready() -> void:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	add_child(root)

	_clock.set_anchors_preset(Control.PRESET_TOP_RIGHT)
	_clock.position = Vector2(-330, 12)
	_clock.size = Vector2(318, 80)
	_clock.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	_style(_clock, 18)
	root.add_child(_clock)

	_feed.position = Vector2(14, 12)
	_feed.add_theme_constant_override("separation", 4)
	root.add_child(_feed)

	_hotbar.set_anchors_preset(Control.PRESET_CENTER_BOTTOM)
	_hotbar.position = Vector2(-470, -64)
	_hotbar.add_theme_constant_override("separation", 4)
	root.add_child(_hotbar)

	_panel.set_anchors_preset(Control.PRESET_CENTER)
	_panel.position = Vector2(-220, -160)
	_panel.custom_minimum_size = Vector2(440, 0)
	var sb := StyleBoxFlat.new()
	sb.bg_color = Color("#fffcf5")
	sb.set_corner_radius_all(14)
	sb.set_content_margin_all(18)
	_panel.add_theme_stylebox_override("panel", sb)
	_panel_box.add_theme_constant_override("separation", 10)
	_panel.add_child(_panel_box)
	_panel.visible = false
	root.add_child(_panel)

	Game.world_changed.connect(_refresh)
	Game.menu_changed.connect(_refresh_menu)
	Game.message.connect(func(_t): _refresh())
	_refresh()


func _style(l: Label, size: int) -> void:
	l.add_theme_font_size_override("font_size", size)
	l.add_theme_color_override("font_color", Color("#fffcf5"))
	l.add_theme_color_override("font_outline_color", Color("#2d2015"))
	l.add_theme_constant_override("outline_size", 6)


## Show a line of dialogue for a few seconds.
func say(text: String) -> void:
	_talk = text
	_talk_until = Time.get_ticks_msec() + 6000
	_refresh()


func _process(_delta: float) -> void:
	if _talk != "" and Time.get_ticks_msec() > _talk_until:
		_talk = ""
		_refresh()
	if Game.has_world():
		_update_clock()


func _update_clock() -> void:
	var w := Game.world
	var d := World.day(w)
	var c := World.today_climate(w)
	var units: String = w.settings.units
	var now := Weather.temp_at(c, Clock.time_of_day(w.minute))
	_clock.text = "%s · %s · Year %d\n%s  %s  %s\nCoins %s · Energy %s · Water %s" % [
		Clock.season_label(d, w.settings), Clock.format_date(d, w.settings, true), Clock.year_of(d, w.settings),
		Weather.info(c.kind).name, Settings.format_temp(now, units), Clock.format_time(w.minute),
		Js.num(w.coins), Js.num(w.energy), Js.num(w.water),
	]


func _refresh() -> void:
	if not Game.has_world():
		return
	var w := Game.world
	for c in _feed.get_children():
		c.queue_free()
	var msgs: Array = w.messages.slice(-4)
	if _talk != "":
		msgs = msgs + [{"text": _talk}]
	for m in msgs:
		var l := Label.new()
		l.text = m.text
		l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		l.custom_minimum_size = Vector2(420, 0)
		_style(l, 15)
		_feed.add_child(l)
	for c in _hotbar.get_children():
		c.queue_free()
	for i in World.HOTBAR_SIZE:
		var s = w.inventory[i]
		var b := Label.new()
		b.custom_minimum_size = Vector2(90, 52)
		b.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		b.vertical_alignment = VERTICAL_ALIGNMENT_CENTER
		b.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
		var name: String = Items.get_def(s.item).name if s else ""
		b.text = "%d %s%s" % [(i + 1) % 10, name, " ×%s" % Js.num(s.qty) if s and s.qty > 1 else ""]
		var sb := StyleBoxFlat.new()
		sb.bg_color = Color("#e7b43a") if i == int(w.selected) else Color("#2d2015", 0.65)
		sb.set_corner_radius_all(8)
		b.add_theme_stylebox_override("normal", sb)
		_style(b, 12)
		_hotbar.add_child(b)


func _refresh_menu() -> void:
	for c in _panel_box.get_children():
		c.queue_free()
	_panel.visible = Game.menu != ""
	if not _panel.visible:
		return
	var w := Game.world
	match Game.menu:
		"house":
			_title("Your farmhouse")
			_button("Go to bed", func():
				Game.update(World.sleep)
				Game.save()
				Game.open("summary"))
		"summary":
			var log = w.get("log")
			_title("Good morning! Day %d" % World.day(w))
			if log is Dictionary:
				if log.earned > 0:
					_text("Earned %s coins." % Js.num(log.earned))
				for n in log.notes:
					_text(n)
			_button("Start the day", Game.close)
			return
		_:
			_title({"store": "Seed & Soil Co.", "shipping": "Shipping bin", "board": "Town notice board"}.get(Game.menu, Game.menu.capitalize()))
			_text("This menu is coming to the Godot version soon. Use the current game for now.")
	_button("Close", Game.close)


func _title(t: String) -> void:
	var l := Label.new()
	l.text = t
	l.add_theme_font_size_override("font_size", 24)
	l.add_theme_color_override("font_color", Color("#2d2015"))
	_panel_box.add_child(l)


func _text(t: String) -> void:
	var l := Label.new()
	l.text = t
	l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.add_theme_color_override("font_color", Color("#2d2015"))
	_panel_box.add_child(l)


func _button(t: String, fn: Callable) -> void:
	var b := Button.new()
	b.text = t
	b.pressed.connect(fn)
	_panel_box.add_child(b)
