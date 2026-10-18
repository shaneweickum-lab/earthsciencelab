class_name Hud
## The heads-up display: date, weather, and time; coins, energy, and water; the message feed;
## the hotbar; and the tile inspector. Port of Hud.tsx.

const SEASON_ICON := {"Spring": "🌸", "Summer": "☀️", "Fall": "🍂", "Winter": "❄️"}
const GROUND_NAME := {"grass": "Grass", "farm": "Garden soil", "path": "Path", "water": "Pond", "sand": "Sandy shore", "forest": "Forest", "cave": "Cave floor", "caveWall": "Rock wall"}
const LABELS := {
	"house": "Farmhouse", "store": "Seed & Soil Co.", "shippingBin": "Shipping Bin", "chest": "Tool Chest", "extension": "Extension Office", "cottage": "Cottage",
	"mineEntrance": "Old Mine", "ladderUp": "Ladder up", "ladderDown": "Ladder down",
	"workbench": "Workbench", "grinder": "Grinder", "spinningWheel": "Spinning Wheel", "furnace": "Furnace", "stove": "Stove", "oven": "Oven",
	"gardenGate": "Garden gate", "marketStall": "Market stall",
	"fountain": "Fountain", "noticeBoard": "Notice board", "field": "Cornfield", "lamp": "Street lamp", "prop": "Market cart",
}


## Everything the status card shows, to tell when it needs redrawing.
static func clock_text(w: Dictionary) -> String:
	return "%s|%s|%s|%s|%s" % [Clock.format_time(w.minute), w.coins, w.energy, w.water, w.organic]


static func status(w: Dictionary) -> Control:
	var d := World.day(w)
	var cal: Dictionary = w.settings
	var c := World.today_climate(w)
	var units: String = cal.units
	var info := Weather.info(c.kind)
	var col := Ui.vbox(6)
	col.size_flags_horizontal = Control.SIZE_SHRINK_END
	var card := Ui.vbox(2)
	var season: String = SEASON_ICON[Clock.season_of(d, cal)] if cal.seasons else "🌱"
	card.add_child(Ui.text("%s %s · %s · YEAR %d" % [season, Clock.season_label(d, cal).to_upper(), Clock.format_date(d, cal, true).to_upper(), Clock.year_of(d, cal)], 12, Ui.MUTED, 900, false))
	var now := Weather.temp_at(c, Clock.time_of_day(w.minute))
	card.add_child(Ui.text("%s %s  %s" % [info.icon, Settings.format_temp(now, units), Clock.format_time(w.minute)], 22, Ui.INK, 900, false))
	card.add_child(Ui.text("High %s · Low %s" % [Settings.format_temp(c.high, units), Settings.format_temp(c.low, units)], 12, Ui.MUTED, 700, false))
	var p := Ui.panel(card, Color(Ui.CARD, 0.95), 16, 10, Color(Ui.SOIL_DARK, 0.2), 2)
	p.size_flags_horizontal = Control.SIZE_SHRINK_END
	col.add_child(p)
	var row := Ui.hbox(6)
	row.alignment = BoxContainer.ALIGNMENT_END
	row.add_child(Ui.pill("🪙 %s" % Js.num(w.coins), Color(Ui.CARD, 0.95), Ui.INK, 15))
	if w.organic:
		row.add_child(Ui.pill("🌿 Organic", Ui.LEAF, Color.WHITE, 13))
	col.add_child(row)
	if Settings.on(w, "energy"):
		col.add_child(_meter("⚡", w.energy, w.maxEnergy, Ui.DANGER if w.energy < 20 else Ui.SUN))
	col.add_child(_meter("💧", w.water, w.canSize, Ui.SKY))
	return col


static func _meter(icon: String, value: float, maximum: float, color: Color) -> Control:
	var h := Ui.hbox(6)
	h.add_child(Ui.emoji_icon(icon, 14))
	h.add_child(Ui.meter(value, maximum, color, 96, 8))
	var p := Ui.panel(h, Color(Ui.CARD, 0.95), 99, 5, Color(0, 0, 0, 0), 0)
	p.size_flags_horizontal = Control.SIZE_SHRINK_END
	return p


## Grandma Rosa's note for the lesson you're on: what to do, how, and the reward to claim.
## Port of Tutorial.tsx. Null once the lessons are done.
static func tutorial(game_ui: GameUi, w: Dictionary) -> Control:
	var step = Quests.tutorial_step(w)
	if step == null:
		return null
	var ui: Dictionary = game_ui.ui
	var open: bool = not ui.get("tut_closed", false)
	var col := Ui.vbox(6)
	col.custom_minimum_size = Vector2(300, 0)
	var head := Ui.button("✉️ Lesson %d of %d: %s  (%s)" % [step.number, step.of, step.title, "hide" if open else "show"], func():
		ui.tut_closed = open
		game_ui.refresh(), "flat", 14)
	head.alignment = HORIZONTAL_ALIGNMENT_LEFT
	col.add_child(head)
	if open:
		col.add_child(Ui.text(step.ask, 14))
		col.add_child(Ui.panel(Ui.text("💡 " + step.hint, 12, Ui.MUTED), Ui.PAPER, 8, 6, Color(0, 0, 0, 0), 0))
		col.add_child(Ui.text(step.step.label, 13, Ui.INK, 800))
		var row := Ui.hbox(6)
		var prog: Dictionary = step.progress
		row.add_child(Ui.meter(prog.have, prog.need, Ui.LEAF if prog.done else Ui.SUN, 230, 8))
		row.add_child(Ui.text("%s/%s" % [Js.num(prog.have), Js.num(prog.need)], 12, Ui.INK, 900, false))
		col.add_child(row)
		if prog.done:
			col.add_child(Ui.button("Claim: %s" % step.rewardText if step.rewardText != "" else "Next lesson", func(): Game.update(Quests.claim_lesson), "primary", 14))
		elif step.rewardText != "":
			col.add_child(Ui.small("Reward: " + step.rewardText))
		if ui.get("tut_skip", false):
			col.add_child(Ui.small("Skip the lessons and take all of Grandma's tools now?", Ui.INK))
			var choice := Ui.hbox(6)
			choice.add_child(Ui.button("Skip", func():
				ui.tut_skip = false
				Game.update(Quests.skip_tutorial), "soil", 13))
			choice.add_child(Ui.button("Keep going", func():
				ui.tut_skip = false
				game_ui.refresh(), "ghost", 13))
			col.add_child(choice)
		else:
			var skip := Ui.button("Skip tutorial", func():
				ui.tut_skip = true
				game_ui.refresh(), "flat", 11)
			skip.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
			col.add_child(skip)
	return Ui.panel(col, Color(Ui.CARD, 0.95), 14, 10, Ui.SUN, 2)


static func messages(w: Dictionary) -> Control:
	var col := Ui.vbox(4)
	col.custom_minimum_size = Vector2(320, 0)
	var recent: Array = w.messages.filter(func(m): return m.at >= w.minute - 45).slice(-4)
	for m in recent:
		col.add_child(Ui.panel(Ui.text(m.text, 14, Color.WHITE, 700), Color(Ui.SOIL_DARK, 0.8), 12, 7, Color(0, 0, 0, 0), 0))
	return col


static func hotbar(w: Dictionary) -> Control:
	var col := Ui.vbox(4)
	col.alignment = BoxContainer.ALIGNMENT_END
	var sel = w.inventory[int(w.selected)]
	var name := Ui.pill(Items.get_def(sel.item).name if sel else "Empty hands", Color(Ui.SOIL_DARK, 0.8), Color.WHITE, 12)
	name.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	col.add_child(name)
	var row := Ui.hbox(4)
	for i in World.HOTBAR_SIZE:
		row.add_child(_slot(w, i))
	var p := Ui.panel(row, Color(Ui.SOIL_DARK, 0.7), 16, 6, Color(0, 0, 0, 0), 0)
	p.size_flags_horizontal = Control.SIZE_SHRINK_CENTER
	col.add_child(p)
	return col


static func _slot(w: Dictionary, i: int) -> Control:
	var s = w.inventory[i]
	var selected := i == int(w.selected)
	var b := Button.new()
	b.custom_minimum_size = Vector2(52, 52)
	b.focus_mode = Control.FOCUS_NONE
	var bg := Ui.SUN if selected else Color(Ui.CARD, 0.9)
	for st in ["normal", "hover", "pressed"]:
		b.add_theme_stylebox_override(st, Ui.box(bg if st == "normal" else (Ui.SUN if selected else Color.WHITE), 12, Color.WHITE if selected else Color(0, 0, 0, 0), 2 if selected else 0, 4))
	b.pressed.connect(func(): Game.update(func(x): return Js.with(x, {"selected": i})))
	b.tooltip_text = "%s: %s" % [Items.get_def(s.item).name, Items.get_def(s.item).desc] if s else "Empty"
	if s:
		var icon := Ui.item_icon(s.item, 32, s.get("grade"))
		icon.position = Vector2(10, 10)
		b.add_child(icon)
		if s.qty > 1:
			var q := Ui.text(Js.num(s.qty), 12, Ui.INK, 900, false)
			q.position = Vector2(30, 32)
			b.add_child(q)
		var wear := Ui.wear_bar(s, 52, 45)
		if wear:
			b.add_child(wear)
	var n := Ui.text(str((i + 1) % 10), 10, Ui.MUTED, 900, false)
	n.position = Vector2(4, 0)
	b.add_child(n)
	return b


# ───────────────────────── tile inspector ─────────────────────────

static func _soil_row(label: String, value: float, known: bool, tip: String, ph := false) -> Control:
	var h := Ui.hbox(6)
	var l := Ui.text(label, 12, Ui.MUTED, 700, false)
	l.custom_minimum_size = Vector2(104, 0)
	h.add_child(l)
	if not known:
		h.add_child(Ui.text("? " + tip, 12, Ui.MUTED, 700))
	elif ph:
		h.add_child(Ui.text(Js.to_fixed(value, 1), 12, Ui.INK, 900, false))
	else:
		var color := Ui.LEAF if value >= 60 else (Ui.SUN if value >= 35 else Ui.DANGER)
		h.add_child(Ui.meter(value, 100, color, 90, 6))
		h.add_child(Ui.text(Js.num(Js.round(value)), 12, Ui.INK, 900, false))
	return h


## What's in front of you, its hidden soil (until tested), and what your next action will do.
static func inspector(w: Dictionary) -> Control:
	var f := World.facing_tile(w)
	var t = World.tile_at(w, f.x, f.y)
	if t == null:
		return null
	var b = World.building_at(w, f.x, f.y)
	var preview := Preview.preview_action(w)
	var garden: bool = t.ground == "farm" or t.greenhouse
	var known := World.known_soil(w, t)
	var col := Ui.vbox(6)
	col.custom_minimum_size = Vector2(280, 0)
	var head := Ui.hbox()
	var name: String
	if b:
		var owner := ""
		if b.data.get("owner"):
			var o = Town.npc(b.data.owner)
			owner = (o.short if o else "") + "'s "
		name = b.data.get("sign", owner + Data.items().get("kit_" + b.kind, {}).get("name", LABELS.get(b.kind, b.kind)))
	else:
		name = "Greenhouse bed" if t.greenhouse else GROUND_NAME[t.ground]
	head.add_child(Ui.title(name, 17))
	if garden and t.tilled:
		head.add_child(Ui.spacer())
		head.add_child(Ui.text("TILLED", 11, Ui.SOIL, 900, false))
	col.add_child(head)
	for line in _status(w, t, f.x, f.y):
		col.add_child(line)
	if garden and not b:
		col.add_child(HSeparator.new())
		col.add_child(_soil_row("Moisture", t.moisture, true, ""))
		col.add_child(_soil_row("Organic matter", t.soil.om, known.lab, "Lab test 🧪"))
		col.add_child(_soil_row("Nutrients", t.soil.nutrients, known.lab, "Lab test 🧪"))
		col.add_child(_soil_row("pH", t.soil.ph, known.lab, "Lab test 🧪", true))
		col.add_child(_soil_row("Soil life", t.soil.life, known.shovel, "Shovel test 🕳️"))
		col.add_child(_soil_row("Structure", t.soil.structure, known.shovel, "Shovel test 🕳️"))
		col.add_child(_soil_row("Water holding", t.soil.water, known.water, "Ring test 💧"))
		if known.lab and known.shovel and known.water:
			col.add_child(Ui.text("Soil health: %s" % Js.num(Grades.soil_health(t)), 12, Ui.INK, 900))
	if preview.label:
		col.add_child(Ui.panel(Ui.text("[b]Space · %s:[/b] %s" % [preview.label, preview.text], 12), Ui.LEAF_LIGHT if preview.ok else Ui.PAPER, 10, 7, Color(0, 0, 0, 0), 0))
	if b and World.can_pick_up(b):
		var row := Ui.hbox(6)
		row.add_child(Ui.button("Pick up (P)", func(): Game.update(func(s): return World.pick_up_building(s, b.id)), "ghost", 12))
		if World.rotatable(b.kind):
			row.add_child(Ui.button("Turn (R)", func(): Game.update(World.rotate_building), "ghost", 12))
		col.add_child(row)
	return Ui.panel(col, Color(Ui.CARD, 0.95), 16, 12, Color(Ui.SOIL_DARK, 0.2), 2)


static func _status(w: Dictionary, t: Dictionary, x: int, y: int) -> Array:
	var lines := []
	var out := []
	if World._crit_at(w, x, y) != null:
		lines.append("Something is here! Press Space to take a closer look.")
	if t.obstacle:
		var o: String = t.obstacle
		var broken := " (%s%% broken)" % Js.num(Js.round(float(t.hits) / World.OBSTACLE_HP[o] * 100)) if t.get("hits") else ""
		lines.append("A %s is in the way.%s" % [World.obstacle_name(o), broken])
	if t.weeds:
		lines.append("Weeds are growing here.")
	if t.mulch:
		lines.append("Covered with straw mulch.")
	if t.get("boost", 0) > 0 and not t.crop:
		lines.append("🏅 Amendments: grade bonus +%s for the next crop here." % Js.num(t.boost))
	var c = t.crop
	if c:
		var crop := Items.crop(c.id)
		if c.dead:
			return [Ui.text("💀 This %s plant died. Clear it with the scythe or your hands." % crop.name.to_lower(), 12)]
		var wc := Items.world_crop(c.id)
		var head := Ui.hbox(6)
		head.add_child(Ui.text("%s %s" % [crop.icon, crop.name], 14, Ui.INK, 900, false))
		head.add_child(Ui.spacer())
		head.add_child(Ui.text("Ready!" if c.growth >= 1 else "%s%%" % Js.num(Js.round(c.growth * 100)), 12, Ui.MUTED, 900, false))
		out.append(head)
		out.append(Ui.meter(c.growth, 1, Ui.LEAF, 256, 6))
		out.append(Ui.text("%s-season · about %s days to grow" % ["Cool" if wc.type == "cool" else "Warm", Js.num(Items.crop_days(c.id, w.settings.daysPerMonth, c.harvests > 0))], 11, Ui.MUTED))
		if wc.yield[1] > 0:
			out.append(_grade_line(w, t))
		if c.growth < 1:
			for r in World.growth_factor(w, x, y).reasons:
				out.append(Ui.text("• " + r, 12))
	for l in lines:
		out.append(Ui.text(l, 12))
	return out


## The grade this crop would get if harvested now, and why.
static func _grade_line(w: Dictionary, t: Dictionary) -> Control:
	var est := Grades.expected_grade(w, t)
	var known := World.known_soil(w, t)
	var tested: bool = known.lab and known.shovel and known.water
	var parts := []
	for p in est.parts:
		parts.append("Soil health: run all three soil tests to see it" if p.begins_with("Soil health") and not tested else p)
	var h := Ui.hbox(6)
	h.add_child(Ui.grade_badge(est.grade))
	var col := Ui.vbox(0)
	col.add_child(Ui.text("Expected grade " + est.grade, 12, Ui.INK, 900))
	col.add_child(Ui.text(" · ".join(parts), 11, Ui.MUTED))
	h.add_child(col)
	return Ui.panel(h, Ui.PAPER, 8, 6, Color(0, 0, 0, 0), 0)


# ───────────────────────── touch ─────────────────────────

## An on-screen D-pad and action buttons for touch screens.
static func touch_controls(game_ui: GameUi) -> Control:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var pad := GridContainer.new()
	pad.columns = 3
	for cell in ["", "up", "", "left", "down", "right"]:
		if cell == "":
			pad.add_child(Control.new())
			continue
		var b := Ui.button({"up": "🔼", "down": "🔽", "left": "◀️", "right": "▶️"}[cell], func(): pass, "flat", 20)
		b.custom_minimum_size = Vector2(56, 56)
		b.button_down.connect(func(): Game.runtime.touch[cell] = true)
		b.button_up.connect(func(): Game.runtime.touch.erase(cell))
		pad.add_child(b)
	pad.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_LEFT, Control.PRESET_MODE_MINSIZE, 16)
	pad.grow_vertical = Control.GROW_DIRECTION_BEGIN
	pad.position.y -= 90
	root.add_child(pad)
	var acts := Ui.vbox(8)
	var row := Ui.hbox(6)
	row.add_child(Ui.button("🎒", func(): Game.open("bag"), "flat", 18))
	row.add_child(Ui.button("📓", func(): Game.open("journal"), "flat", 18))
	row.add_child(Ui.button("✋", func(): game_ui.get_parent().do_action("interact"), "flat", 18))
	acts.add_child(row)
	var a := Ui.button("A", func(): game_ui.get_parent().do_action("use"), "primary", 22)
	a.custom_minimum_size = Vector2(72, 72)
	a.size_flags_horizontal = Control.SIZE_SHRINK_END
	acts.add_child(a)
	acts.set_anchors_and_offsets_preset(Control.PRESET_BOTTOM_RIGHT, Control.PRESET_MODE_MINSIZE, 16)
	acts.grow_horizontal = Control.GROW_DIRECTION_BEGIN
	acts.grow_vertical = Control.GROW_DIRECTION_BEGIN
	acts.position.y -= 90
	root.add_child(acts)
	return root
