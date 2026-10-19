class_name Screens
## The main menu, new-game setup, pause menu, and the settings panels they share.
## Port of MainMenu.tsx and SettingsPanels.tsx.

const CATEGORIES := ["Soil", "Water", "Plants", "Weeds & pests", "Climate", "Daily life"]
const STEPS := ["Farmer", "Science", "Time", "Calendar"]


## Rolling hills and a sunrise behind the menus.
static func backdrop(content: Control) -> Control:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	var sky := TextureRect.new()
	var grad := Gradient.new()
	grad.offsets = PackedFloat32Array([0.0, 0.55, 1.0])
	grad.colors = PackedColorArray([Color("#bfe3f2"), Color("#f6e7c4"), Color("#7fb069")])
	var tex := GradientTexture2D.new()
	tex.gradient = grad
	tex.fill_from = Vector2(0, 0)
	tex.fill_to = Vector2(0, 1)
	sky.texture = tex
	sky.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	sky.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(sky)
	var hills := _Hills.new()
	hills.set_anchors_preset(Control.PRESET_FULL_RECT)
	hills.mouse_filter = Control.MOUSE_FILTER_IGNORE
	root.add_child(hills)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	center.add_child(content)
	root.add_child(center)
	return root


class _Hills:
	extends Control

	func _draw() -> void:
		var s := size
		draw_circle(Vector2(s.x / 2, 140), 80, Color("#ffd27a", 0.8))
		_ellipse(Vector2(s.x * 0.25, s.y + 40), Vector2(s.x * 0.4, 180), Color("#6fa04a"))
		_ellipse(Vector2(s.x * 0.8, s.y + 50), Vector2(s.x * 0.45, 200), Color("#5c8f3d"))

	func _ellipse(c: Vector2, r: Vector2, color: Color) -> void:
		var pts := PackedVector2Array()
		for i in 48:
			var a := TAU * i / 48
			pts.append(c + Vector2(cos(a) * r.x, sin(a) * r.y))
		draw_colored_polygon(pts, color)


static func _card(width := 460.0) -> Dictionary:
	var body := Ui.vbox(12)
	var margin := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 24)
	margin.add_child(body)
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", Ui.box(Ui.CARD, 20, Ui.LINE, 1, 0))
	card.custom_minimum_size = Vector2(width, 0)
	card.add_child(margin)
	return {"card": card, "body": body}


static func main_menu(game_ui: GameUi) -> Control:
	var c := _card()
	var body: VBoxContainer = c.body
	var top := Ui.vbox(4)
	var sprout := Ui.emoji_icon("🌱", 56)
	sprout.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	top.add_child(sprout)
	var t := Ui.title("Soil & Sprout", 36)
	t.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top.add_child(t)
	var sub := Ui.text("Grow a garden, care for the soil, and learn how the living world works.", 14, Ui.MUTED)
	sub.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	top.add_child(sub)
	body.add_child(top)
	var saved = Game.saved_world
	var ui: Dictionary = game_ui.ui
	body.add_child(Ui.button("▶️ Start", func():
		if saved != null:
			ui.confirm = true
			game_ui.refresh()
		else:
			Game.start_quick(), "primary", 18))
	if ui.get("confirm"):
		var box := Ui.vbox(6)
		box.add_child(Ui.text("Start a new farm with the recommended settings? This replaces your saved farm.", 14, Ui.INK, 800))
		var row := Ui.hbox(6)
		row.add_child(Ui.button("Yes, start fresh", func():
			ui.erase("confirm")
			Game.start_quick(), "soil", 14))
		row.add_child(Ui.button("Never mind", func():
			ui.erase("confirm")
			game_ui.refresh(), "ghost", 14))
		box.add_child(row)
		body.add_child(Ui.panel(box, Ui.PAPER, 12, 12, Color(0, 0, 0, 0), 0))
	var cont := Ui.button("⏯️ Continue", Game.continue_game, "soil", 18, saved == null)
	body.add_child(cont)
	if saved != null:
		var d := World.day(saved)
		var s: Dictionary = saved.settings
		var info := Ui.text("%s, Year %d · %s · 🪙 %s" % [Clock.format_date(d, s), Clock.year_of(d, s), Clock.season_label(d, s), Js.num(saved.coins)], 13, Ui.MUTED, 700)
		info.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
		body.add_child(info)
	body.add_child(Ui.button("✨ New Game", func():
		ui.erase("confirm")
		Game.open_setup(), "ghost", 18))
	var note := Ui.small("Your farm is saved in this browser." if Site.is_web() else "Your farm is saved on this computer.")
	note.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	body.add_child(note)
	return backdrop(c.card)


static func new_game(game_ui: GameUi) -> Control:
	var ui: Dictionary = game_ui.ui
	if not ui.has("setup"):
		ui.setup = {"step": 0, "avatar": Data.world().defaultAvatar, "settings": Settings.normalize(Settings.defaults())}
	var st: Dictionary = ui.setup
	var redraw := func(): game_ui.refresh()
	var c := _card(780)
	var body: VBoxContainer = c.body
	body.add_child(Ui.title("✨ New farm", 26))
	var steps := Ui.hbox(4)
	for i in STEPS.size():
		steps.add_child(Ui.chip("%d. %s" % [i + 1, STEPS[i]], st.step == i, func():
			st.step = i
			redraw.call()))
	body.add_child(steps)
	body.add_child(HSeparator.new())
	var settings: Dictionary = st.settings
	var patch := func(p: Dictionary):
		st.settings = Settings.normalize(Js.with(st.settings, p))
		redraw.call()
	match st.step:
		0:
			body.add_child(Ui.text("Choose your farmer", 15, Ui.INK, 900))
			body.add_child(avatar_choice(st.avatar, func(a):
				st.avatar = a
				redraw.call()))
			body.add_child(Ui.small("%d farmers to pick from. You can change your look later at home." % Data.world().avatars.size()))
		1:
			body.add_child(Ui.text("Turn science features on for a more realistic (and harder) farm, or off to just build and grow. You can change these any time from the pause menu.", 14))
			body.add_child(science_panel(settings.science, func(sci): patch.call({"science": sci})))
		2:
			body.add_child(time_panel(settings, patch))
		3:
			body.add_child(calendar_panel(settings, patch, false))
	var foot := Ui.hbox(8)
	foot.add_child(Ui.button("Main menu" if st.step == 0 else "Back", func():
		if st.step == 0:
			ui.erase("setup")
			Game.back_to_menu()
		else:
			st.step -= 1
			redraw.call(), "ghost", 15))
	var preset := Settings.preset_of(settings.science)
	foot.add_child(Ui.spacer())
	foot.add_child(Ui.text("%s · %s× · %s" % ["Custom science" if preset == "custom" else Settings.presets()[preset].label, Js.num(settings.speed), ("%s-day months" % Js.num(settings.daysPerMonth)) if settings.seasons else "No seasons"], 12, Ui.MUTED, 700, false))
	if st.step < STEPS.size() - 1:
		foot.add_child(Ui.button("Next", func():
			st.step += 1
			redraw.call(), "soil", 15))
	else:
		foot.add_child(Ui.button("🌱 Begin%s" % (" (replaces saved farm)" if Game.saved_world != null else ""), func():
			var s: Dictionary = st.settings
			var a: String = st.avatar
			ui.erase("setup")
			Game.start_new(s, a), "primary", 15))
	body.add_child(HSeparator.new())
	body.add_child(foot)
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size = Vector2(800, minf(680, game_ui.get_viewport().get_visible_rect().size.y - 40))
	var center := CenterContainer.new()
	center.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	center.add_child(c.card)
	scroll.add_child(center)
	return backdrop(scroll)


static func avatar_choice(current: String, on_pick: Callable) -> Control:
	var g := Ui.grid(6, 6)
	for a in Data.world().avatars:
		var b := Button.new()
		b.custom_minimum_size = Vector2(72, 72)
		b.focus_mode = Control.FOCUS_NONE
		b.tooltip_text = "Farmer " + a
		var on: bool = a == current
		b.add_theme_stylebox_override("normal", Ui.box(Ui.SUN if on else Ui.PAPER, 12, Ui.SOIL if on else Color(0, 0, 0, 0), 2 if on else 0, 2))
		b.add_theme_stylebox_override("hover", Ui.box(Ui.SUN if on else Color.WHITE, 12, Ui.SOIL if on else Color(0, 0, 0, 0), 2 if on else 0, 2))
		b.add_theme_stylebox_override("pressed", Ui.box(Ui.SUN, 12, Ui.SOIL, 2, 2))
		var p := "res://assets/icons/avatar_%s.png" % a
		if ResourceLoader.exists(p):
			b.icon = load(p)
			b.expand_icon = true
		b.pressed.connect(func(): on_pick.call(a))
		g.add_child(b)
	return g


## Switch each science feature on or off, or pick a preset.
static func science_panel(science: Dictionary, on_change: Callable) -> Control:
	var col := Ui.vbox(10)
	var preset := Settings.preset_of(science)
	var presets := Ui.hbox(8)
	for id in Settings.presets():
		var p: Dictionary = Settings.presets()[id]
		var on: bool = preset == id
		var box := Ui.vbox(2)
		box.add_child(Ui.text("%s %s" % [p.icon, p.label], 15, Ui.INK, 900))
		box.add_child(Ui.small(p.desc))
		var card := Ui.clickable(box, func(): on_change.call(p.science.duplicate()), Ui.LEAF_LIGHT if on else Ui.CARD, Ui.LEAF if on else Ui.LINE)
		card.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		card.custom_minimum_size = Vector2(200, 0)
		presets.add_child(card)
	col.add_child(presets)
	var count := 0
	for id in science:
		if science[id]:
			count += 1
	col.add_child(Ui.text("%s · %d of %d science features on" % ["Custom mix" if preset == "custom" else Settings.presets()[preset].label, count, Settings.features().size()], 12, Ui.MUTED, 800))
	for cat in CATEGORIES:
		col.add_child(Ui.heading(cat))
		var g := Ui.grid(2, 6)
		for f in Settings.features():
			if f.category != cat:
				continue
			var value: bool = science[f.id]
			var box := Ui.vbox(2)
			var row := Ui.hbox(6)
			var sw := Ui.toggle("", value, func(v):
				var next := science.duplicate()
				next[f.id] = v
				on_change.call(next))
			sw.tooltip_text = f.label
			sw.set_meta("feature", f.id)
			row.add_child(sw)
			row.add_child(Ui.text("%s %s" % [f.icon, f.label], 14, Ui.INK, 900))
			box.add_child(row)
			box.add_child(Ui.text(f.on if value else f.off, 12))
			box.add_child(Ui.text("[i]%s[/i]" % f.science, 11, Ui.MUTED))
			var p := Ui.panel(box, Color(Ui.LEAF_LIGHT, 0.6) if value else Ui.CARD, 12, 10, Color(Ui.LEAF, 0.6) if value else Ui.LINE, 1)
			p.custom_minimum_size = Vector2(340, 0)
			g.add_child(p)
		col.add_child(g)
	return col


## How fast game time runs, and which temperature units to show.
static func time_panel(settings: Dictionary, on_change: Callable) -> Control:
	var col := Ui.vbox(8)
	var head := Ui.hbox()
	head.add_child(Ui.text("⏱️ Time speed", 15, Ui.INK, 900))
	head.add_child(Ui.spacer())
	head.add_child(Ui.text("%s×" % Js.num(settings.speed), 15, Ui.INK, 900, false))
	col.add_child(head)
	var slider := HSlider.new()
	slider.min_value = Settings.SPEED_MIN
	slider.max_value = Settings.SPEED_MAX
	slider.value = settings.speed
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.drag_ended.connect(func(_c): on_change.call({"speed": int(slider.value)}))
	col.add_child(slider)
	var presets := Ui.hbox(4)
	for v in Settings.SPEED_PRESETS:
		presets.add_child(Ui.chip("%d×" % v, settings.speed == v, func(): on_change.call({"speed": v})))
	col.add_child(presets)
	col.add_child(Ui.small("%s. A farm day runs 6 AM to 2 AM, so it lasts %s." % [Settings.speed_label(settings.speed), _day_length(settings.speed)]))
	var units := Ui.hbox(6)
	units.add_child(Ui.text("🌡️ Temperature", 15, Ui.INK, 900, false))
	for u in ["F", "C"]:
		units.add_child(Ui.chip("°" + u, settings.units == u, func(): on_change.call({"units": u})))
	col.add_child(units)
	return col


static func _day_length(speed: float) -> String:
	var minutes := (20.0 * 60) / speed
	if minutes >= 60:
		return "%s real hours" % Js.to_fixed(minutes / 60, 1 if fmod(minutes, 60) else 0)
	return "%s real minutes" % Js.num(Js.round(minutes))


## Seasons and month length. Chosen when a farm is created.
static func calendar_panel(settings: Dictionary, on_change: Callable, locked: bool) -> Control:
	var col := Ui.vbox(8)
	var row := Ui.hbox(6)
	row.add_child(Ui.toggle("", settings.seasons, func(v): on_change.call({"seasons": v}), locked))
	row.add_child(Ui.text("🍂 Seasons", 15, Ui.INK, 900, false))
	row.add_child(Ui.text("Spring, summer, fall, and winter, with cold, snow, and frost." if settings.seasons else "An endless mild growing season (about 60–80°F), no frost or snow.", 12, Ui.MUTED))
	col.add_child(row)
	var L := int(settings.daysPerMonth)
	var head := Ui.hbox()
	head.add_child(Ui.text("📅 Days per month", 15, Ui.INK, 900))
	head.add_child(Ui.spacer())
	head.add_child(Ui.text(str(L), 15, Ui.INK, 900, false))
	col.add_child(head)
	var slider := HSlider.new()
	slider.min_value = Settings.MONTH_MIN
	slider.max_value = Settings.MONTH_MAX
	slider.value = L
	slider.editable = not locked
	slider.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	slider.drag_ended.connect(func(_c): on_change.call({"daysPerMonth": int(slider.value)}))
	col.add_child(slider)
	var seasons := ""
	if settings.seasons:
		seasons = ", so each season lasts %d days. Seasons begin on the %s of March, June, September, and December" % [Clock.days_per_season(settings), _ordinal(Clock.season_start_day(L))]
	col.add_child(Ui.small("12 months a year%s. Crops scale to fit: carrots take about %s days, squash about %s (real seed packets: 70 and 100 days)." % [seasons, Js.num(Items.crop_days("carrot", L)), Js.num(Items.crop_days("squash", L))]))
	if locked:
		col.add_child(Ui.text("The calendar is set when a farm is created.", 12, Ui.MUTED, 900))
	return col


static func _ordinal(n: int) -> String:
	var s := "th"
	if not (n % 100 >= 11 and n % 100 <= 13):
		s = ["th", "st", "nd", "rd", "th", "th", "th", "th", "th", "th"][n % 10]
	return "%d%s" % [n, s]


## In-game pause: resume, change settings, or save and quit.
static func pause(game_ui: GameUi) -> Dictionary:
	var ui: Dictionary = game_ui.ui
	var tab: String = ui.get("tab", "science")
	var m := Ui.modal("Paused", "⏸️", Game.close, true)
	var body: VBoxContainer = m.body
	var top := Ui.hbox(6)
	top.add_child(Ui.button("▶️ Resume", Game.close, "primary", 15))
	top.add_child(Ui.button("💾 Save & quit to menu", Game.quit_to_menu, "ghost", 15))
	top.add_child(Ui.button("🖥️ Full screen (F)", Site.toggle_fullscreen, "ghost", 15))
	body.add_child(top)
	var tabs := Ui.hbox(4)
	for t in [["science", "🔬 Science"], ["time", "⏱️ Time & units"], ["calendar", "📅 Calendar"]]:
		tabs.add_child(Ui.chip(t[1], tab == t[0], func():
			ui.tab = t[0]
			game_ui.refresh()))
	body.add_child(tabs)
	var w := Game.world
	match tab:
		"science":
			body.add_child(science_panel(w.settings.science, func(sci): Game.update_settings(Js.with(w.settings, {"science": sci}))))
		"time":
			body.add_child(time_panel(w.settings, func(p): Game.update_settings(Settings.normalize(Js.with(Game.world.settings, p)))))
		"calendar":
			body.add_child(calendar_panel(w.settings, func(_p): pass, true))
	return m
