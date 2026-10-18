class_name Menus
## The menus you open while playing. Port of Menus.tsx, Shop.tsx, JournalBook.tsx, and Town.tsx.
## Each returns Ui.modal()'s {root, body}; GameUi rebuilds them when the world changes.


static func build(game_ui: GameUi, menu: String) -> Variant:
	match menu:
		"intro": return intro(game_ui)
		"house": return house(game_ui)
		"tv": return tv()
		"summary": return summary()
		"bag": return bag(game_ui)
		"store": return store(game_ui)
		"shipping": return shipping()
		"chest": return chest()
		"plot": return plot_menu()
		"mine": return mine_cart()
		"craft": return craft_menu()
		"stall": return stall_menu(game_ui)
		"journal": return journal(game_ui)
		"pause": return Screens.pause(game_ui)
		"npc": return TownMenus.npc_dialog(game_ui)
		"board": return TownMenus.notice_board(game_ui)
		"quests": return TownMenus.quest_log()
	return null


static func _avatar_picker() -> Control:
	return Screens.avatar_choice(Game.world.get("avatar", Data.world().defaultAvatar), func(a): Game.update(func(w): return Js.with(w, {"avatar": a})))


static func intro(_game_ui: GameUi) -> Dictionary:
	var m := Ui.modal("A letter for you", "✉️")
	var body: VBoxContainer = m.body
	var letter := Ui.vbox(10)
	letter.add_child(Ui.text("Congratulations! You inherited an organic garden!", 24, Ui.LEAF, 900))
	for p in [
		"My dear grandchild, the farm is yours now. I'm sorry to say it's grown wild. Weeds, sticks, and stones are everywhere, and I never did test the soil. Treat it kindly and it will feed you for a lifetime.",
		"Clear the weeds, test the soil, and feed it with compost and cover crops. Watch the sky, too: the weather decides more than you'd think. Keep an eye out for the little creatures. Most of them are friends.",
		"My old scythe is in the chest beside the front door. I've left you a note for each thing I learned here, and the rest of my tools go with them, one lesson at a time. My workbench is somewhere in the barn. Save the beans and tomatoes for when the nights stay above freezing.",
		"The folks at Seed & Soil Co. will buy what you grow. Remember, organic produce sells for more.",
	]:
		letter.add_child(Ui.text(p, 15))
	var sign := Ui.text("[i]Love, Grandma Rosa[/i] 🌻", 15)
	sign.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	letter.add_child(sign)
	body.add_child(Ui.panel(letter, Color("#fdf6e3"), 12, 16, Color(0, 0, 0, 0), 0))
	body.add_child(Ui.text("Choose your farmer:", 14, Ui.INK, 900))
	body.add_child(_avatar_picker())
	var tips := Ui.grid(2, 6)
	for kv in [["W A S D", "Walk (or arrow keys)"], ["Space", "Use the item in your hand"], ["1 – 0", "Pick a hotbar item"], ["E", "Talk, open, and harvest"], ["I", "Open your bag"], ["J", "Open your Nature Journal"]]:
		var row := Ui.hbox(6)
		row.add_child(Ui.key(kv[0]))
		row.add_child(Ui.text(kv[1], 13, Ui.INK, 600, false))
		tips.add_child(row)
	body.add_child(tips)
	body.add_child(Ui.small("Time passes only while you play. Each crop takes a few in-game days to grow. Sleep in your house to start a new day and save."))
	body.add_child(Ui.button("Let's get gardening! 🌱", func():
		Game.update(func(w): return Js.with(w, {"introSeen": true}))
		Game.close(), "primary", 18))
	return m


static func house(game_ui: GameUi) -> Dictionary:
	var m := Ui.modal("Your farmhouse", "🏠", Game.close)
	var body: VBoxContainer = m.body
	var h := Clock.time_of_day(Game.world.minute) / 60.0
	body.add_child(Ui.button("🛏️ Go to bed%s" % (" (skip the rest of today)" if h < 18 else ""), func():
		Game.update(World.sleep)
		Game.save()
		Game.open("summary"), "soil", 16))
	body.add_child(Ui.button("📺 Watch the weather channel", func(): Game.open("tv"), "ghost", 16))
	body.add_child(Ui.button("📓 Read your Nature Journal", func(): Game.open("journal"), "ghost", 16))
	if Site.is_web():
		# My Homestead lives on the website: save, and the page opens it over the game.
		body.add_child(Ui.button("🏡 My Homestead: decorate your room and yard", func():
			Game.save()
			Game.close()
			Site.post({"type": "soil:openHomestead"}), "ghost", 16))
	var ui: Dictionary = game_ui.ui
	body.add_child(Ui.button("👕 Change your look", func():
		ui.look = not ui.get("look", false)
		game_ui.refresh(), "ghost", 16))
	if ui.get("look", false):
		body.add_child(_avatar_picker())
	body.add_child(Ui.small("Your farm saves itself every in-game hour and whenever you sleep."))
	body.add_child(Ui.button("⚙️ Game settings & main menu", func(): Game.open("pause"), "ghost", 16))
	return m


static func tv() -> Dictionary:
	var w := Game.world
	var m := Ui.modal("Weather Channel 4", "📺", func(): Game.open("house"))
	var body: VBoxContainer = m.body
	var today := World.today_climate(w)
	var tomorrow := World.tomorrow_climate(w)
	var t_info := Weather.info(tomorrow.kind)
	var u: String = w.settings.units
	var d := World.day(w) + 1
	var box := Ui.vbox(4)
	box.add_child(Ui.text("TOMORROW'S FORECAST · %s · %s" % [Clock.format_date(d, w.settings).to_upper(), Clock.season_label(d, w.settings).to_upper()], 12, Color("#bae6fd"), 900))
	box.add_child(Ui.text("%s %s" % [t_info.icon, t_info.name], 30, Color.WHITE, 900))
	box.add_child(Ui.text("High %s · Low %s" % [Settings.format_temp(tomorrow.high, u), Settings.format_temp(tomorrow.low, u)], 20, Color.WHITE, 900))
	box.add_child(Ui.text(t_info.tv, 15, Color("#e0f2fe")))
	body.add_child(Ui.panel(box, Color("#1f3550"), 16, 16, Color(0, 0, 0, 0), 0))
	body.add_child(Ui.panel(Ui.text("[b]🔬 Weather science: %s[/b]\n%s" % [t_info.name.to_lower(), t_info.science], 14), Ui.LEAF_LIGHT, 12, 12, Color(0, 0, 0, 0), 0))
	var info := Weather.info(today.kind)
	body.add_child(Ui.text("Today: %s %s, high %s. %s" % [info.icon, info.name, Settings.format_temp(today.high, u), info.science], 14, Ui.MUTED))
	if w.settings.seasons:
		body.add_child(Ui.panel(Ui.text("[b]🌍 Why seasons?[/b] Earth's axis is tilted. In summer your part of the world leans toward the Sun, so sunlight hits more directly and days are longer. In winter sunlight comes in at a low slant and days are short, so it gets cold.", 14), Ui.PAPER, 12, 12, Color(0, 0, 0, 0), 0))
	return m


static func summary() -> Dictionary:
	var w := Game.world
	var d := World.day(w)
	var m := Ui.modal("Good morning! Day %d" % d, "🌅")
	var body: VBoxContainer = m.body
	var c := World.today_climate(w)
	var info := Weather.info(c.kind)
	body.add_child(Ui.text("%s · %s · Today: %s %s, high %s" % [Clock.format_date(d, w.settings), Clock.season_label(d, w.settings), info.icon, info.name, Settings.format_temp(c.high, w.settings.units)], 14, Ui.MUTED, 800))
	var log = w.get("log")
	if log is Dictionary:
		if log.earned > 0:
			var earned := Ui.text("🪙 +%s" % Js.num(log.earned), 26, Ui.INK, 900)
			earned.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
			body.add_child(Ui.panel(earned, Color(Ui.SUN, 0.2), 12, 10, Color(0, 0, 0, 0), 0))
		for n in log.notes:
			body.add_child(Ui.panel(Ui.text(n, 14), Ui.PAPER, 10, 8, Color(0, 0, 0, 0), 0))
	body.add_child(Ui.button("Start the day", Game.close, "primary", 16))
	return m


## Your bag. Click one slot, then another, to swap them. The top row is your hotbar.
static func bag(game_ui: GameUi) -> Dictionary:
	var w := Game.world
	var ui: Dictionary = game_ui.ui
	var m := Ui.modal("Your bag", "🎒", Game.close, true)
	var body: VBoxContainer = m.body
	body.add_child(Ui.small("Click an item, then another slot, to move it. The top row is your hotbar."))
	var g := Ui.grid(10, 6)
	var inv: Array = w.inventory
	for i in inv.size():
		var s = inv[i]
		var b := Button.new()
		b.custom_minimum_size = Vector2(62, 62)
		b.focus_mode = Control.FOCUS_NONE
		var held: bool = ui.get("held", -1) == i
		var bg := Ui.SUN if held else (Ui.LEAF_LIGHT if i < World.HOTBAR_SIZE else Ui.PAPER)
		b.add_theme_stylebox_override("normal", Ui.box(bg, 12, Ui.SOIL if held else Color(0, 0, 0, 0), 2 if held else 0, 4))
		b.add_theme_stylebox_override("hover", Ui.box(Color.WHITE, 12, Color(0, 0, 0, 0), 0, 4))
		b.add_theme_stylebox_override("pressed", Ui.box(Ui.SUN, 12, Ui.SOIL, 2, 4))
		if s:
			var icon := Ui.item_icon(s.item, 34, s.get("grade"))
			icon.position = Vector2(14, 12)
			b.add_child(icon)
			if s.qty > 1:
				var q := Ui.text(Js.num(s.qty), 12, Ui.INK, 900, false)
				q.position = Vector2(40, 40)
				b.add_child(q)
			var wear := Ui.wear_bar(s, 62, 55)
			if wear:
				b.add_child(wear)
			b.tooltip_text = Items.get_def(s.item).name
		b.pressed.connect(func():
			ui.look_slot = i
			var h: int = ui.get("held", -1)
			if h == -1:
				if s:
					ui.held = i
				game_ui.refresh()
				return
			ui.erase("held")
			if h != i:
				Game.update(func(x): return World.swap_slots(x, h, i))
			else:
				game_ui.refresh())
		g.add_child(b)
	body.add_child(g)
	var look: int = ui.get("look_slot", -1)
	var shown = inv[look] if look >= 0 else null
	var info := Ui.vbox(4)
	if shown:
		var def := Items.get_def(shown.item)
		var row := Ui.hbox(8)
		row.add_child(Ui.item_icon(shown.item, 28, shown.get("grade")))
		row.add_child(Ui.text("%s ×%s" % [def.name, Js.num(shown.qty)], 16, Ui.INK, 900))
		info.add_child(row)
		if shown.get("grade"):
			info.add_child(Ui.text("Grade %s: sells for ×%s the normal price. Healthier soil and good care grow higher grades." % [shown.grade, Js.num(Grades.info(shown.grade).price)], 13, Ui.INK, 800))
		info.add_child(Ui.text(def.desc, 14, Ui.MUTED))
		var d = World.durability(shown)
		if d != null:
			info.add_child(Ui.text("Uses left: %d of %d" % [d.left, d.max], 12, Ui.INK, 800))
		if def.get("energy"):
			info.add_child(Ui.button("Eat · ⚡ +%d" % int(def.energy), func(): Game.update(func(x): return World.eat(x, look)), "primary", 13))
	else:
		info.add_child(Ui.text("Click an item to read about it.", 14, Ui.MUTED))
	body.add_child(Ui.panel(info, Ui.PAPER, 12, 12, Color(0, 0, 0, 0), 0))
	return m


# ───────────────────────── shop ─────────────────────────

static func store(game_ui: GameUi) -> Dictionary:
	var w := Game.world
	var ui: Dictionary = game_ui.ui
	var tab: String = ui.get("tab", "seeds")
	var m := Ui.modal("Seed & Soil Co.", "🌱", Game.close, true)
	var body: VBoxContainer = m.body
	var tabs := Ui.hbox(6)
	for t in [["seeds", "🌱 Seeds"], ["tools", "🛠️ Tools"], ["soil", "🧪 Soil care"], ["build", "🔨 Build"], ["kitchen", "🍳 Kitchen"], ["sell", "🪙 Sell"]]:
		tabs.add_child(Ui.button(t[1], func():
			ui.tab = t[0]
			game_ui.refresh(), "soil" if tab == t[0] else "ghost", 14))
	tabs.add_child(Ui.spacer())
	tabs.add_child(Ui.pill("🪙 %s" % Js.num(w.coins), Ui.PAPER, Ui.INK, 15))
	body.add_child(tabs)
	var season := World.season_now(w)
	var seasonal: bool = w.settings.seasons and Settings.on(w, "plantingSeasons")
	var greenhouse: bool = w.buildings.any(func(b): return b.kind == "greenhouse")
	var items: Array = Data.items().values()
	var buy := func(id: String, n: int): Game.update(func(s): return World.buy(s, id, n))
	var kitchenware := func(i): return i.kind == "utensil" or i.get("building") in ["stove", "oven"]
	match tab:
		"seeds":
			var note := "Every seed is for sale. Cool-season crops like it mild; warm-season crops like it hot."
			if seasonal:
				note = "You have a greenhouse, so every seed is for sale. Out-of-season seeds only grow inside it." if greenhouse else "In stock for %s. Build a greenhouse to grow crops in any season!" % season
			body.add_child(Ui.text(note, 14, Ui.MUTED))
			var seeds := items.filter(func(i): return i.kind == "seed" and (not seasonal or greenhouse or season in Items.world_crop(i.crop).seasons))
			body.add_child(_item_list(w, seeds, buy, func(i):
				var wc := Items.world_crop(i.crop)
				var crop := Items.crop(i.crop)
				var bits := "%s-season · about %s days%s%s" % ["Cool" if wc.type == "cool" else "Warm", Js.num(Items.crop_days(wc.id, w.settings.daysPerMonth)), " · keeps producing" if wc.get("regrowDays") else "", " · cover crop" if wc.get("cover") else " · sells %s" % Js.num(wc.sellPrice)]
				if Settings.on(w, "frost"):
					bits += " · frost-tender" if wc.killF >= 30 else " · frost-hardy"
				if seasonal and not season in wc.seasons:
					bits += " · greenhouse only"
				var col := Ui.vbox(2)
				col.add_child(Ui.text(bits, 12, Ui.MUTED, 800))
				col.add_child(Ui.text("[b]Takes:[/b] %s [b]Gives back:[/b] %s" % [crop.takes, crop.givesText], 12))
				return col))
		"tools":
			var science := func(i): return Data.shop_unlocks().has(i.id) and not kitchenware.call(i)
			body.add_child(Ui.text("Tools wear out with use. Buy a new one here, or craft a better one at a workbench.", 14, Ui.MUTED))
			body.add_child(Ui.heading("Farm tools"))
			body.add_child(_item_list(w, items.filter(func(i): return i.kind == "tool" and i.get("price") and not science.call(i)), buy))
			body.add_child(Ui.heading("Science tools"))
			body.add_child(_item_list(w, items.filter(science), buy))
		"soil":
			body.add_child(_item_list(w, items.filter(func(i): return i.kind == "amendment" and not Data.shop_unlocks().has(i.id)), buy))
			var up: Dictionary = Data.upgrades().bigCan
			var row := Ui.hbox(10)
			row.add_child(Ui.item_icon("bigCan", 32))
			var col := Ui.vbox(2)
			col.add_child(Ui.text(up.name, 15, Ui.INK, 900))
			col.add_child(Ui.small(up.desc))
			row.add_child(col)
			var owned: bool = w.canSize >= 40
			row.add_child(Ui.button("Owned" if owned else "🪙 %s" % Js.num(up.price), func(): Game.update(func(s): return World.buy(s, "bigCan")), "primary", 14, owned or w.coins < up.price))
			body.add_child(Ui.panel(row, Ui.CARD, 12, 10))
		"build":
			body.add_child(Ui.text("Buy a kit, put it in your hotbar, face an open spot, and press Space to build. Face it and press P to pick it back up.", 14, Ui.MUTED))
			body.add_child(_item_list(w, items.filter(func(i): return i.kind == "kit" and not kitchenware.call(i)), buy))
		"kitchen":
			body.add_child(Ui.text("Cook your harvest into food that gives you energy back. Carry the utensils a recipe needs, and cook at a stove or oven (set them side by side for recipes that need both). Press C for your cookbook.", 14, Ui.MUTED))
			body.add_child(_item_list(w, items.filter(func(i): return kitchenware.call(i) and i.get("price")), buy))
		"sell":
			body.add_child(Ui.text("Sell right now, or use the shipping bin by your house. %s" % ("Your organic produce earns 25% extra!" if w.organic else "Your farm lost its organic certification, so no bonus."), 14, Ui.MUTED))
			var any := false
			for i in w.inventory.size():
				var s = w.inventory[i]
				if not s or not Items.get_def(s.item).get("sell"):
					continue
				any = true
				var def := Items.get_def(s.item)
				var each := Items.sell_price(def, s.get("grade"), w.organic)
				var row := Ui.hbox(10)
				row.add_child(Ui.item_icon(s.item, 30, s.get("grade")))
				row.add_child(Ui.text("%s%s ×%s" % [def.name, " (grade %s)" % s.grade if s.get("grade") else "", Js.num(s.qty)], 15, Ui.INK, 800))
				row.add_child(Ui.text("🪙 %s each" % Js.num(each), 13, Ui.MUTED, 700, false))
				row.add_child(Ui.button("Sell 1", func(): Game.update(func(x): return World.sell_now(x, i, 1)), "ghost", 13))
				row.add_child(Ui.button("All · %s" % Js.num(each * s.qty), func(): Game.update(func(x): return World.sell_now(x, i, int(s.qty))), "primary", 13))
				body.add_child(Ui.panel(row, Ui.CARD, 12, 8))
			if not any:
				body.add_child(Ui.panel(Ui.text("Nothing to sell yet. Go grow something!", 14, Ui.MUTED), Ui.PAPER, 12, 14, Color(0, 0, 0, 0), 0))
	return m


static func _item_list(w: Dictionary, items: Array, buy: Callable, extra: Variant = null) -> Control:
	var col := Ui.vbox(6)
	for i in items:
		var row := Ui.hbox(10)
		row.add_child(Ui.item_icon(i.id, 32))
		var info := Ui.vbox(2)
		info.add_child(Ui.text("%s%s" % [i.name, "  [color=#b8432f](not organic)[/color]" if i.get("notOrganic") else ""], 15, Ui.INK, 900))
		info.add_child(extra.call(i) if extra is Callable else Ui.text(i.desc, 12, Ui.MUTED))
		var price: float = i.price
		if World.locked_in_shop(w, i.id):
			var q = Quests.by_id(Data.shop_unlocks()[i.id])
			info.add_child(Ui.text("🔒 Not in stock yet. Finish “%s” for %s to unlock it." % [q.title, Town.npc(q.giver).short], 12, Ui.SOIL, 800))
			row.add_child(info)
			row.add_child(Ui.pill("🔒 %s" % Js.num(price), Ui.PAPER, Ui.MUTED, 13))
			row.modulate = Color(1, 1, 1, 0.6)
		elif i.kind == "tool" and World.owns(w, i.id):
			row.add_child(info)
			row.add_child(Ui.pill("Owned", Ui.LEAF_LIGHT, Ui.INK, 13))
		else:
			row.add_child(info)
			row.add_child(Ui.button("🪙 %s" % Js.num(price), func(): buy.call(i.id, 1), "primary", 13, w.coins < price))
			if i.kind != "tool" and i.kind != "utensil" and (i.kind != "kit" or price < 50):
				row.add_child(Ui.button("×5", func(): buy.call(i.id, 5), "ghost", 13, w.coins < price * 5))
		col.add_child(Ui.panel(row, Ui.CARD, 12, 8))
	return col


const STATION_ICONS := {"workbench": "🪚", "grinder": "⚙️", "spinningWheel": "🧵", "furnace": "🔥", "stove": "🍳", "oven": "🥖"}


## A crafting station: what it makes, what each takes, and a button to make one. A stove or oven
## opens the kitchen (every dish, and what's missing for each); the cookbook (C) does the same,
## where only knife-only food can be made.
static func craft_menu() -> Dictionary:
	var w := Game.world
	var cooking: Array = Data.recipes().filter(func(r): return World.is_cooking(r))
	if Game.chest_id == "cookbook":
		var cm := Ui.modal("Cookbook", "📖", Game.close, true)
		cm.body.add_child(Ui.text("Carry the utensils a dish needs in your bag. Food with only a knife can be made anywhere; the rest cook at a stove or oven (put them side by side for recipes that need both). Select food and use it to eat it.", 14, Ui.MUTED))
		for r in cooking:
			cm.body.add_child(_recipe_row(w, r, ""))
		return cm
	var b = null
	for x in w.buildings:
		if x.id == Game.chest_id:
			b = x
	var station: String = b.kind if b != null else "workbench"
	var kitchen: bool = station in ["stove", "oven"]
	var title: String = World.STATIONS.get(station, "Workbench")
	if kitchen:
		var names := []
		for k in World.kitchen_at(w, b.id):
			names.append(World.STATIONS[k])
		title = "Kitchen: " + " and ".join(names)
	var m := Ui.modal(title, STATION_ICONS.get(station, "🪚"), Game.close, true)
	var body: VBoxContainer = m.body
	for r in (cooking if kitchen else Data.recipes().filter(func(x): return x.get("station") == station and not World.is_cooking(x))):
		body.add_child(_recipe_row(w, r, b.id if b != null else ""))
	return m


static func _recipe_row(w: Dictionary, r: Dictionary, at: String) -> Control:
	var st := World.recipe_status(w, r, at)
	var cooking := World.is_cooking(r)
	var out := Items.get_def(r.id)
	var row := Ui.hbox(10)
	row.add_child(Ui.item_icon(r.id, 32))
	var info := Ui.vbox(2)
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.add_child(Ui.text("%s%s%s" % [out.name, " ×%d" % r.qty if r.qty > 1 else "", "  [color=#3f7d4e]⚡ +%d[/color]" % int(out.energy) if out.get("energy") else ""], 15, Ui.INK, 900))
	var needs := Ui.hbox(10)
	for i in st.inputs:
		var short: bool = i.have < i.qty
		var chip := Ui.hbox(3)
		chip.add_child(Ui.item_icon(i.item, 18))
		chip.add_child(Ui.text("%s %d/%d" % [Items.get_def(i.item).name, mini(i.have, i.qty), i.qty], 12, Ui.DANGER if short else Ui.MUTED, 900 if short else 600, false))
		needs.add_child(chip)
	info.add_child(needs)
	if cooking and (r.get("tools", []).size() or r.get("stations", []).size()):
		var gear := Ui.hbox(10)
		for t in r.get("tools", []):
			var missing: bool = t in st.missingTools
			var chip := Ui.hbox(3)
			chip.add_child(Ui.item_icon(t, 18))
			chip.add_child(Ui.text(Items.get_def(t).name, 12, Ui.DANGER if missing else Ui.MUTED, 900 if missing else 600, false))
			gear.add_child(chip)
		for x in r.get("stations", []):
			var missing: bool = x in st.missingStations
			gear.add_child(Ui.text("%s %s" % [STATION_ICONS[x], World.STATIONS[x]], 12, Ui.DANGER if missing else Ui.MUTED, 900 if missing else 600, false))
		info.add_child(gear)
	row.add_child(info)
	var id: String = r.id
	row.add_child(Ui.button("Cook" if cooking else "Make", func(): Game.update(func(s): return World.craft(s, id, at)), "primary", 13, not st.ok))
	return Ui.panel(row, Ui.CARD, 12, 8)


## Your market stall in the square: townsfolk stop by during the day and buy what you put out.
static func stall_menu(game_ui: GameUi) -> Dictionary:
	var w := Game.world
	var ui: Dictionary = game_ui.ui
	var m := Ui.modal("Your market stall", "🧺", Game.close, true)
	var body: VBoxContainer = m.body
	body.add_child(Ui.text("Townsfolk browse the square from 8 AM to 8 PM and buy what you put out. Near the store's price it sells steadily; a bargain sells fast; ask too much and nobody bites. You can show %d kinds of things at once." % WorldMap.STALL_SIZE, 14, Ui.MUTED))
	body.add_child(Ui.heading("On your stall"))
	var list := World.stall_listings(w)
	if list.is_empty():
		body.add_child(Ui.panel(Ui.text("Nothing on the stall right now.", 14, Ui.MUTED), Ui.PAPER, 12, 12, Color(0, 0, 0, 0), 0))
	for i in list.size():
		var l: Dictionary = list[i]
		var row := Ui.hbox(10)
		row.add_child(Ui.item_icon(l.item, 28, l.get("grade")))
		var info := Ui.vbox(2)
		info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		info.add_child(Ui.text("%s ×%d" % [Items.get_def(l.item).name, int(l.qty)], 15, Ui.INK, 900))
		info.add_child(Ui.text("🪙 %d each%s · %d%% chance an hour" % [int(l.price), " · grade %s" % l.grade if l.get("grade") else "", roundi(World.stall_chance(w, l) * 100)], 12, Ui.MUTED, 700))
		row.add_child(info)
		row.add_child(Ui.button("Take back", func(): Game.update(func(s): return World.unstock_stall(s, i)), "ghost", 13))
		body.add_child(Ui.panel(row, Ui.CARD, 12, 8))
	body.add_child(Ui.heading("Put something out"))
	var picks := Ui.hbox(6)
	var any := false
	for i in w.inventory.size():
		var s = w.inventory[i]
		if s == null:
			continue
		var def := Items.get_def(s.item)
		if not def.get("sell") or def.get("tool") or def.kind == "utensil":
			continue
		any = true
		var b := Ui.button("", func():
			ui.stall_pick = i
			ui.stall_qty = int(s.qty)
			ui.stall_price = World.fair_price(w, s)
			game_ui.refresh(), "soil" if ui.get("stall_pick", -1) == i else "ghost", 13)
		b.custom_minimum_size = Vector2(52, 52)
		var icon := Ui.item_icon(s.item, 30, s.get("grade"))
		icon.position = Vector2(11, 8)
		b.add_child(icon)
		if s.qty > 1:
			var q := Ui.text(Js.num(s.qty), 12, Ui.INK, 900, false)
			q.position = Vector2(34, 32)
			b.add_child(q)
		b.tooltip_text = "Sell %s" % def.name
		picks.add_child(b)
	if not any:
		body.add_child(Ui.text("Nothing in your bag to sell. Crops, food, honey, eggs, wood, and stone all sell.", 14, Ui.MUTED))
	body.add_child(picks)
	var pick: int = ui.get("stall_pick", -1)
	var chosen = w.inventory[pick] if pick >= 0 and pick < w.inventory.size() else null
	if chosen != null:
		var row := Ui.hbox(10)
		row.add_child(Ui.text(Items.get_def(chosen.item).name, 15, Ui.INK, 900, false))
		row.add_child(Ui.text("How many", 12, Ui.INK, 800, false))
		var qty := SpinBox.new()
		qty.min_value = 1
		qty.max_value = int(chosen.qty)
		qty.value = clampi(int(ui.get("stall_qty", chosen.qty)), 1, int(chosen.qty))
		qty.value_changed.connect(func(v): ui.stall_qty = int(v))
		row.add_child(qty)
		row.add_child(Ui.text("Price each", 12, Ui.INK, 800, false))
		var price := SpinBox.new()
		price.min_value = 1
		price.max_value = 99999
		price.value = int(ui.get("stall_price", World.fair_price(w, chosen)))
		price.value_changed.connect(func(v): ui.stall_price = int(v))
		row.add_child(price)
		row.add_child(Ui.small("The store pays %d." % World.fair_price(w, chosen)))
		row.add_child(Ui.button("Put on the stall", func():
			var n := int(ui.get("stall_qty", chosen.qty))
			var each := int(ui.get("stall_price", World.fair_price(w, chosen)))
			ui.erase("stall_pick")
			Game.update(func(x): return World.stock_stall(x, pick, n, each)), "primary", 13))
		body.add_child(Ui.panel(row, Ui.PAPER, 12, 10, Color(0, 0, 0, 0), 0))
	return m


## The mine cart at the entrance: ride down to the top or any fifth floor you've reached.
static func mine_cart() -> Dictionary:
	var w := Game.world
	var m := Ui.modal("The old mine", "⛏️", Game.close)
	var body: VBoxContainer = m.body
	body.add_child(Ui.text("Climb down the ladder, or ride the mine cart to a floor you've already reached.", 14, Ui.MUTED))
	var g := Ui.grid(4, 8)
	for f in World.cart_floors(w):
		var label := "🪜 Floor 1" if f == 1 else "🛒 Floor %d" % f
		g.add_child(Ui.button(label, func():
			Game.update(func(s): return World.enter_mine(s, f))
			Game.close(), "ghost" if f == 1 else "primary", 14))
	body.add_child(g)
	body.add_child(Ui.small("Deepest floor reached: %d" % int(w.get("deepest", 0))))
	return m


## A storage chest: click something in the chest to take it, or in your bag to put it away.
static func chest() -> Dictionary:
	var w := Game.world
	var id := Game.chest_id
	var m := Ui.modal("Grandma Rosa's chest" if id == "chest" else "Storage chest", "🧰", Game.close, true)
	var body: VBoxContainer = m.body
	var b = null
	for x in w.buildings:
		if x.id == id:
			b = x
	if b == null:
		return m
	var items := []
	for i in WorldMap.CHEST_SIZE:
		var have: Array = b.data.get("items", [])
		items.append(have[i] if i < have.size() else null)
	var top := Ui.hbox(8)
	var note := Ui.text("Click something in the chest to take it. Click something in your bag to put it away.", 14, Ui.MUTED)
	note.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	top.add_child(note)
	top.add_child(Ui.button("Take all", func(): Game.update(func(s): return World.take_all_from_chest(s, id)), "primary", 14, items.all(func(x): return x == null)))
	body.add_child(top)
	body.add_child(_slot_grid(items, 0, func(i): Game.update(func(s): return World.take_from_chest(s, id, i))))
	body.add_child(Ui.heading("Your bag (the top row is your hotbar)"))
	body.add_child(_slot_grid(w.inventory, World.HOTBAR_SIZE, func(i): Game.update(func(s): return World.put_in_chest(s, id, i))))
	return m


## A locked plot of farmland: buy it with coins.
static func plot_menu() -> Dictionary:
	var w := Game.world
	var id := int(Game.chest_id)
	var m := Ui.modal("Farmland for sale", "🌱", Game.close)
	var body: VBoxContainer = m.body
	if id < 0 or id >= WorldMap.plots().size():
		return m
	var p: Dictionary = WorldMap.plots()[id]
	var price := World.next_plot_price(w)
	body.add_child(Ui.text("This plot is %d × %d tiles of %s. You own %d of %d plots." % [p.x1 - p.x0 + 1, p.y1 - p.y0 + 1, "rich South Fields bottomland" if p.y0 >= WorldMap.OLD_H else "field by the house", World.owned_plots(w).size(), WorldMap.plots().size()], 15))
	body.add_child(Ui.small("Each plot costs a little more than the last. Some quests give you land for free, too."))
	var row := Ui.hbox(10)
	var coins := Ui.text("🪙 %s" % Js.num(w.coins), 15, Ui.INK, 900)
	coins.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	row.add_child(coins)
	row.add_child(Ui.button("Buy for 🪙 %d" % price, func():
		Game.update(func(s): return World.buy_plot(s, id))
		Game.close(), "primary", 15, w.coins < price))
	body.add_child(row)
	return m


static func _slot_grid(slots: Array, hotbar: int, pick: Callable) -> Control:
	var g := Ui.grid(10, 6)
	for i in slots.size():
		var s = slots[i]
		var b := Button.new()
		b.custom_minimum_size = Vector2(62, 62)
		b.focus_mode = Control.FOCUS_NONE
		var bg := Ui.LEAF_LIGHT if i < hotbar else Ui.PAPER
		b.add_theme_stylebox_override("normal", Ui.box(bg, 12, Color(0, 0, 0, 0), 0, 4))
		b.add_theme_stylebox_override("hover", Ui.box(Color.WHITE, 12, Ui.SOIL, 2, 4))
		b.add_theme_stylebox_override("pressed", Ui.box(Ui.SUN, 12, Ui.SOIL, 2, 4))
		b.add_theme_stylebox_override("disabled", Ui.box(bg, 12, Color(0, 0, 0, 0), 0, 4))
		b.disabled = s == null
		if s:
			var icon := Ui.item_icon(s.item, 34, s.get("grade"))
			icon.position = Vector2(14, 12)
			b.add_child(icon)
			if s.qty > 1:
				var q := Ui.text(Js.num(s.qty), 12, Ui.INK, 900, false)
				q.position = Vector2(40, 40)
				b.add_child(q)
			var wear := Ui.wear_bar(s, 62, 55)
			if wear:
				b.add_child(wear)
			b.tooltip_text = Items.get_def(s.item).name
			b.pressed.connect(func(): pick.call(i))
		g.add_child(b)
	return g


static func shipping() -> Dictionary:
	var w := Game.world
	var m := Ui.modal("Shipping bin", "📦", Game.close)
	var body: VBoxContainer = m.body
	body.add_child(Ui.text("Put things in the bin. The truck picks them up overnight and you're paid in the morning.", 14, Ui.MUTED))
	var inbin := Ui.vbox(4)
	inbin.add_child(Ui.heading("In the bin"))
	var payout := 0.0
	var parts := []
	for s in w.shipping:
		var def := Items.get_def(s.item)
		payout += Items.sell_price(def, s.get("grade"), w.organic) * s.qty
		parts.append("%s %s%s ×%s" % [def.icon, def.name, " (%s)" % s.grade if s.get("grade") else "", Js.num(s.qty)])
	inbin.add_child(Ui.text(" · ".join(parts) if parts.size() else "Empty", 14, Ui.INK if parts.size() else Ui.MUTED))
	inbin.add_child(Ui.text("Tomorrow's payout: 🪙 %s" % Js.num(payout), 15, Ui.INK, 900))
	body.add_child(Ui.panel(inbin, Ui.PAPER, 12, 12, Color(0, 0, 0, 0), 0))
	var any := false
	for i in w.inventory.size():
		var s = w.inventory[i]
		if not s or not Items.get_def(s.item).get("sell"):
			continue
		any = true
		var row := Ui.hbox(10)
		row.add_child(Ui.item_icon(s.item, 30, s.get("grade")))
		row.add_child(Ui.text("%s%s ×%s" % [Items.get_def(s.item).name, " (grade %s)" % s.grade if s.get("grade") else "", Js.num(s.qty)], 15, Ui.INK, 800))
		row.add_child(Ui.button("Ship all", func(): Game.update(func(x): return World.ship(x, i)), "primary", 13))
		body.add_child(Ui.panel(row, Ui.CARD, 12, 8))
	if not any:
		body.add_child(Ui.text("Nothing in your bag can be shipped.", 14, Ui.MUTED))
	return m


# ───────────────────────── journal ─────────────────────────

static func journal(game_ui: GameUi) -> Dictionary:
	var w := Game.world
	var ui: Dictionary = game_ui.ui
	var data := Data.journal()
	var entries: Array = data.entries
	var found: Array = w.journal
	var open_id: String = ui.get("page", found[-1] if found.size() else "")
	var m := Ui.modal("Nature Journal · %d/%d pages" % [found.size(), entries.size()], "📓", Game.close, true)
	var cols := Ui.hbox(16)
	var left := Ui.vbox(8)
	left.custom_minimum_size = Vector2(340, 0)
	for cat in data.categories:
		var info: Dictionary = data.categories[cat]
		left.add_child(Ui.heading("%s %s" % [info.icon, info.label]))
		var g := Ui.grid(6, 5)
		for e in entries:
			if e.category != cat:
				continue
			var has: bool = e.id in found
			var b := Button.new()
			b.custom_minimum_size = Vector2(48, 48)
			b.focus_mode = Control.FOCUS_NONE
			var sel: bool = e.id == open_id
			b.add_theme_stylebox_override("normal", Ui.box(Ui.LEAF_LIGHT if has else Ui.PAPER, 10, Ui.SOIL if sel else Color(0, 0, 0, 0), 2 if sel else 0, 4))
			b.add_theme_stylebox_override("hover", Ui.box(Color.WHITE, 10, Ui.SOIL if sel else Color(0, 0, 0, 0), 2 if sel else 0, 4))
			b.add_theme_stylebox_override("pressed", Ui.box(Color.WHITE, 10, Ui.SOIL, 2, 4))
			if has:
				b.icon = Emoji.texture(e.icon)
				b.expand_icon = true
			else:
				b.text = "?"
			b.tooltip_text = e.name if has else "Not found yet. " + e.hint
			b.pressed.connect(func():
				ui.page = e.id
				game_ui.refresh())
			g.add_child(b)
		left.add_child(g)
	cols.add_child(left)
	var page := Ui.vbox(10)
	page.custom_minimum_size = Vector2(340, 0)
	var entry = World.journal_entry(open_id) if open_id != "" else null
	if entry == null:
		page.add_child(Ui.text("Explore the farm, the forest edge, and the pond. Press Space next to a creature to add it to your journal.", 15, Ui.MUTED))
	elif not entry.id in found:
		page.add_child(Ui.text("??? Undiscovered", 22, Ui.MUTED, 900))
		page.add_child(Ui.text("[b]Hint:[/b] " + entry.hint, 14))
	else:
		var head := Ui.hbox(10)
		head.add_child(Ui.emoji_icon(entry.icon, 56))
		var names := Ui.vbox(0)
		names.add_child(Ui.text(entry.name, 24, Ui.INK, 900))
		names.add_child(Ui.text(data.categories[entry.category].label.to_upper(), 12, Ui.MUTED, 900))
		head.add_child(names)
		page.add_child(head)
		page.add_child(Ui.text(entry.fact[Site.grade_level], 16))
		if entry.category == "fungus" and entry.id != "mycorrhizae":
			page.add_child(Ui.panel(Ui.text("⚠️ " + data.mushroomSafety, 14, Ui.DANGER, 900), Color(Ui.DANGER, 0.1), 10, 8, Color(0, 0, 0, 0), 0))
		var levels := Ui.hbox(4)
		for lv in [["elementary", "K-5"], ["middle", "6-8"], ["high", "9-12"]]:
			levels.add_child(Ui.chip(lv[1], Site.grade_level == lv[0], func():
				Site.set_grade(lv[0])
				game_ui.refresh(), 12))
		page.add_child(levels)
		page.add_child(Ui.text("Source: %s" % entry.source.org, 11, Ui.MUTED))
	cols.add_child(Ui.panel(page, Color("#fdf6e3"), 16, 16, Color(0, 0, 0, 0), 0))
	m.body.add_child(cols)
	return m
