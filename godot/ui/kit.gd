class_name Ui
## Building blocks for the game's menus, styled like the Earth Science Lab site: its colors,
## rounded cards, and the leaf, soil, and ghost buttons. Text goes through Emoji so icons show.

const PAPER := Color("#f6efe2")
const CARD := Color("#fffcf5")
const INK := Color("#2a2017")
const MUTED := Color("#6e5f50")
const LINE := Color("#e3d6c1")
const SOIL := Color("#6b4423")
const SOIL_DARK := Color("#3d2716")
const LEAF := Color("#3f7d4e")
const LEAF_LIGHT := Color("#dcebd6")
const SUN := Color("#e0a83a")
const SKY := Color("#3f86b0")
const CLAY := Color("#c0603b")
const DANGER := Color("#b8432f")

static var _theme: Theme
static var _fonts := {}


static func font(weight := 600) -> Font:
	if not _fonts.has(weight):
		var f := FontVariation.new()
		f.base_font = load("res://assets/fonts/Nunito.ttf")
		f.variation_opentype = {TextServerManager.get_primary_interface().name_to_tag("wght"): weight}
		_fonts[weight] = f
	return _fonts[weight]


## Nunito has no italic in the variable font we ship, so italics are slanted.
static func _italic(weight: int) -> Font:
	var k := -weight
	if not _fonts.has(k):
		var f := FontVariation.new()
		f.base_font = font(weight)
		f.variation_transform = Transform2D(Vector2(1, 0), Vector2(0.2, 1), Vector2.ZERO)
		_fonts[k] = f
	return _fonts[k]


static func box(bg: Color, radius := 14, border := Color(0, 0, 0, 0), border_width := 0, pad := 10.0) -> StyleBoxFlat:
	var sb := StyleBoxFlat.new()
	sb.bg_color = bg
	sb.set_corner_radius_all(radius)
	sb.border_color = border
	sb.set_border_width_all(border_width)
	sb.set_content_margin_all(pad)
	sb.anti_aliasing = true
	return sb


static func theme() -> Theme:
	if _theme:
		return _theme
	var t := Theme.new()
	t.default_font = font(600)
	t.default_font_size = 16
	for type in ["Label", "RichTextLabel", "Button", "CheckBox", "CheckButton", "LineEdit"]:
		t.set_color("font_color", type, INK)
		t.set_color("default_color", type, INK)
	t.set_font("bold_font", "RichTextLabel", font(850))
	t.set_color("font_disabled_color", "Button", Color(INK, 0.45))
	t.set_stylebox("panel", "PanelContainer", box(CARD, 20, LINE, 1, 0))
	t.set_stylebox("focus", "Button", StyleBoxEmpty.new())
	t.set_stylebox("grabber_area", "HSlider", box(LEAF, 4, Color(0, 0, 0, 0), 0, 3))
	t.set_stylebox("grabber_area_highlight", "HSlider", box(LEAF, 4, Color(0, 0, 0, 0), 0, 3))
	t.set_stylebox("slider", "HSlider", box(LINE, 4, Color(0, 0, 0, 0), 0, 3))
	t.set_constant("separation", "VBoxContainer", 8)
	t.set_constant("separation", "HBoxContainer", 8)
	_theme = t
	return t


# ───────────────────────── text ─────────────────────────

## Text that may contain emoji. Wraps unless `wrap` is false.
static func text(s: String, size := 16, color := INK, weight := 600, wrap := true) -> RichTextLabel:
	var r := RichTextLabel.new()
	r.bbcode_enabled = true
	r.fit_content = true
	r.scroll_active = false
	r.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART if wrap else TextServer.AUTOWRAP_OFF
	r.add_theme_font_override("normal_font", font(weight))
	r.add_theme_font_override("bold_font", font(900))
	r.add_theme_font_override("italics_font", _italic(weight))
	r.add_theme_font_size_override("normal_font_size", size)
	r.add_theme_font_size_override("bold_font_size", size)
	r.add_theme_font_size_override("italics_font_size", size)
	r.add_theme_color_override("default_color", color)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	r.text = Emoji.bb(s, int(size * 1.15))
	if not wrap:
		r.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	else:
		r.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return r


static func title(s: String, size := 24) -> RichTextLabel:
	return text(s, size, INK, 900)


static func small(s: String, color := MUTED) -> RichTextLabel:
	return text(s, 13, color)


static func heading(s: String) -> RichTextLabel:
	return text(s.to_upper(), 12, MUTED, 900)


# ───────────────────────── layout ─────────────────────────

static func vbox(sep := 8) -> VBoxContainer:
	var v := VBoxContainer.new()
	v.add_theme_constant_override("separation", sep)
	v.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return v


static func hbox(sep := 8) -> HBoxContainer:
	var h := HBoxContainer.new()
	h.add_theme_constant_override("separation", sep)
	h.alignment = BoxContainer.ALIGNMENT_BEGIN
	return h


static func flow(sep := 6) -> HFlowContainer:
	var f := HFlowContainer.new()
	f.add_theme_constant_override("h_separation", sep)
	f.add_theme_constant_override("v_separation", sep)
	f.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return f


static func grid(cols: int, sep := 6) -> GridContainer:
	var g := GridContainer.new()
	g.columns = cols
	g.add_theme_constant_override("h_separation", sep)
	g.add_theme_constant_override("v_separation", sep)
	g.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return g


## A rounded panel around some content.
static func panel(content: Control, bg := CARD, radius := 14, pad := 10.0, border := LINE, border_width := 1) -> PanelContainer:
	var p := PanelContainer.new()
	p.add_theme_stylebox_override("panel", box(bg, radius, border, border_width, pad))
	p.add_child(content)
	p.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return p


static func spacer() -> Control:
	var c := Control.new()
	c.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	return c


## A colored rounded label.
static func pill(s: String, bg := PAPER, fg := INK, size := 13) -> PanelContainer:
	var p := panel(text(s, size, fg, 850, false), bg, 99, 4, Color(0, 0, 0, 0), 0)
	p.get_theme_stylebox("panel").content_margin_left = 10
	p.get_theme_stylebox("panel").content_margin_right = 10
	p.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	return p


## A progress bar.
static func meter(value: float, maximum: float, color := LEAF, width := 96.0, height := 8.0) -> Control:
	var bg := Panel.new()
	bg.custom_minimum_size = Vector2(width, height)
	bg.add_theme_stylebox_override("panel", box(LINE, int(height / 2), Color(0, 0, 0, 0), 0, 0))
	var fill := Panel.new()
	fill.add_theme_stylebox_override("panel", box(color, int(height / 2), Color(0, 0, 0, 0), 0, 0))
	fill.size = Vector2(width * clampf(value / maximum if maximum > 0 else 0.0, 0, 1), height)
	bg.add_child(fill)
	bg.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	return bg


# ───────────────────────── buttons ─────────────────────────

## style: primary (leaf), soil, ghost, sun, or flat
static func button(s: String, on_press: Callable, style := "ghost", size := 16, disabled := false) -> Button:
	var b := Button.new()
	var colors := {"primary": [LEAF, Color("#356a42"), Color.WHITE], "soil": [SOIL, SOIL_DARK, Color.WHITE], "sun": [SUN, Color("#c9922b"), INK], "ghost": [Color(0, 0, 0, 0), Color.WHITE, INK], "flat": [PAPER, LINE, INK]}
	var c: Array = colors.get(style, colors.ghost)
	var border := LINE if style == "ghost" else Color(0, 0, 0, 0)
	b.add_theme_stylebox_override("normal", box(c[0], 12, border, 2 if style == "ghost" else 0, 8))
	b.add_theme_stylebox_override("hover", box(c[1], 12, border, 2 if style == "ghost" else 0, 8))
	b.add_theme_stylebox_override("pressed", box(c[1], 12, border, 2 if style == "ghost" else 0, 8))
	b.add_theme_stylebox_override("disabled", box(Color(c[0], c[0].a * 0.45), 12, Color(border, 0.45), 2 if style == "ghost" else 0, 8))
	for state in ["font_color", "font_hover_color", "font_pressed_color", "font_focus_color"]:
		b.add_theme_color_override(state, c[2])
	b.add_theme_color_override("font_disabled_color", Color(c[2], 0.5))
	b.add_theme_font_override("font", font(850))
	b.add_theme_font_size_override("font_size", size)
	# Emoji in button text become an icon on the left.
	var parts := Emoji.split(s)
	if parts.size() and parts[0].has("emoji"):
		b.icon = Emoji.sized(parts[0].emoji, int(size * 1.25))
	b.text = Emoji.strip(s)
	b.disabled = disabled
	b.focus_mode = Control.FOCUS_NONE
	b.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	b.pressed.connect(on_press)
	return b


## Make any content clickable: a card that sizes to its content, with a button over it.
static func clickable(content: Control, on_press: Callable, bg := CARD, border := LINE, hover := Color.WHITE) -> PanelContainer:
	var p := panel(content, bg, 12, 10, border, 2)
	var b := Button.new()
	b.flat = true
	b.focus_mode = Control.FOCUS_NONE
	b.mouse_default_cursor_shape = Control.CURSOR_POINTING_HAND
	b.add_theme_stylebox_override("hover", box(Color(hover, 0.25), 12, Color(0, 0, 0, 0), 0, 0))
	b.pressed.connect(on_press)
	p.add_child(b)
	return p


## A small rounded toggle chip, like the site's tabs and preset buttons.
static func chip(s: String, active: bool, on_press: Callable, size := 13) -> Button:
	var b := button(s, on_press, "soil" if active else "flat", size)
	for state in ["normal", "hover", "pressed"]:
		var sb: StyleBoxFlat = b.get_theme_stylebox(state)
		sb.set_corner_radius_all(99)
		sb.content_margin_top = 4
		sb.content_margin_bottom = 4
		sb.content_margin_left = 12
		sb.content_margin_right = 12
	return b


## A switch with a label.
static func toggle(s: String, value: bool, on_change: Callable, disabled := false) -> CheckButton:
	var c := CheckButton.new()
	c.text = Emoji.strip(s)
	c.button_pressed = value
	c.disabled = disabled
	c.focus_mode = Control.FOCUS_NONE
	c.add_theme_font_override("font", font(850))
	c.toggled.connect(on_change)
	return c


# ───────────────────────── icons ─────────────────────────

## An item's picture (rendered from its model) or its emoji, with a grade badge for produce.
static func item_icon(id: String, px := 32, grade: Variant = null) -> Control:
	var def = Data.items().get(id, Data.upgrades().get(id))
	var tex: Texture2D = null
	if def and def.get("image"):
		var p: String = "res://assets/icons/" + def.image.get_file()
		if ResourceLoader.exists(p):
			tex = load(p)
	if tex == null and def:
		tex = Emoji.texture(def.icon)
	var r := TextureRect.new()
	r.texture = tex
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	r.custom_minimum_size = Vector2(px, px)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	if grade:
		var badge := grade_badge(grade)
		badge.position = Vector2(px - 12, -4)
		r.add_child(badge)
	return r


static func emoji_icon(e: String, px := 24) -> TextureRect:
	var r := TextureRect.new()
	r.texture = Emoji.texture(e)
	r.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	r.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	r.custom_minimum_size = Vector2(px, px)
	r.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return r


static func grade_badge(grade: String) -> Control:
	var g := Grades.info(grade)
	var p := panel(text(grade, 11, Color(g.text), 900, false), Color(g.color), 99, 1, Color(0, 0, 0, 0), 0)
	p.get_theme_stylebox("panel").content_margin_left = 5
	p.get_theme_stylebox("panel").content_margin_right = 5
	p.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	p.mouse_filter = Control.MOUSE_FILTER_IGNORE
	return p


## A keyboard key, like <kbd>.
static func key(k: String) -> PanelContainer:
	var p := panel(text(k, 11, INK, 900, false), Color.WHITE, 4, 2, LINE, 1)
	p.size_flags_horizontal = Control.SIZE_SHRINK_BEGIN
	p.size_flags_vertical = Control.SIZE_SHRINK_CENTER
	return p


# ───────────────────────── dialogs ─────────────────────────

## A modal card over a dimmed screen. Returns {root, body}; add content to body.
static func modal(title_text: String, icon: String, on_close: Variant = null, wide := false) -> Dictionary:
	var root := Control.new()
	root.set_anchors_preset(Control.PRESET_FULL_RECT)
	var dim := ColorRect.new()
	dim.color = Color(SOIL_DARK, 0.5)
	dim.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(dim)
	var center := CenterContainer.new()
	center.set_anchors_preset(Control.PRESET_FULL_RECT)
	root.add_child(center)
	var card := PanelContainer.new()
	card.add_theme_stylebox_override("panel", box(CARD, 20, LINE, 1, 0))
	card.custom_minimum_size = Vector2(760 if wide else 520, 0)
	center.add_child(card)
	var col := VBoxContainer.new()
	col.add_theme_constant_override("separation", 0)
	card.add_child(col)
	var head := hbox(10)
	head.add_child(emoji_icon(icon, 28))
	head.add_child(text(title_text, 22, INK, 900, false))
	if on_close is Callable:
		head.add_child(spacer())
		head.add_child(button("×", on_close, "flat", 20))
	col.add_child(panel(head, PAPER, 0, 14, LINE, 0))
	var scroll := ScrollContainer.new()
	scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	scroll.custom_minimum_size = Vector2(0, 0)
	var body := vbox(10)
	var margin := MarginContainer.new()
	for side in ["left", "right", "top", "bottom"]:
		margin.add_theme_constant_override("margin_" + side, 20)
	margin.add_child(body)
	margin.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	scroll.add_child(margin)
	col.add_child(scroll)
	root.set_meta("scroll", scroll)
	root.set_meta("card", card)
	return {"root": root, "body": body, "scroll": scroll}


## A worn tool's uses left, as a little bar along the bottom of its slot (null while it's like new).
static func wear_bar(slot: Variant, width: float, y: float) -> Control:
	if slot == null:
		return null
	var d = World.durability(slot)
	if d == null or d.left >= d.max:
		return null
	var f: float = float(d.left) / d.max
	var back := ColorRect.new()
	back.color = Color(0, 0, 0, 0.2)
	back.position = Vector2(4, y)
	back.size = Vector2(width - 8, 4)
	back.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var bar := ColorRect.new()
	bar.color = Color("#4f9a45") if f > 0.5 else (Color("#e0a030") if f > 0.2 else Color("#b8432f"))
	bar.size = Vector2(maxf(2, (width - 8) * f), 4)
	bar.mouse_filter = Control.MOUSE_FILTER_IGNORE
	back.add_child(bar)
	return back
