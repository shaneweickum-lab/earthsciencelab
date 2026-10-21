class_name TownMenus
## Talking with townsfolk, the notice board, and the quest log. Port of Town.tsx.


static func hearts(value: int) -> Control:
	var row := Ui.hbox(1)
	for i in Town.MAX_HEARTS:
		var h := Ui.emoji_icon("❤️", 15)
		if i >= value:
			h.modulate = Color(1, 1, 1, 0.25)
		row.add_child(h)
	row.tooltip_text = "Friendship: %d of %d hearts" % [value, Town.MAX_HEARTS]
	return row


## Talking with a townsperson: today's chat, a gift, and anything special they offer.
static func npc_dialog(game_ui: GameUi) -> Dictionary:
	var w := Game.world
	var id := Game.talking_to
	var npc: Dictionary = Town.npc(id)
	var ui: Dictionary = game_ui.ui
	var said: String = ui.get("said", Game.npc_line)
	var m := Ui.modal(npc.name, "💬", Game.close)
	var body: VBoxContainer = m.body
	var top := Ui.hbox(16)
	var portrait := TextureRect.new()
	var p := "res://assets/icons/avatar_%s.png" % npc.avatar
	if ResourceLoader.exists(p):
		portrait.texture = load(p)
	portrait.expand_mode = TextureRect.EXPAND_IGNORE_SIZE
	portrait.stretch_mode = TextureRect.STRETCH_KEEP_ASPECT_CENTERED
	portrait.custom_minimum_size = Vector2(96, 96)
	top.add_child(Ui.panel(portrait, Ui.PAPER, 16, 4, Color(0, 0, 0, 0), 0))
	var info := Ui.vbox(4)
	info.add_child(Ui.text(npc.role.to_upper(), 12, Ui.MUTED, 900))
	info.add_child(hearts(Town.hearts(w, id)))
	info.add_child(Ui.text("Right now: " + Town.npc_pose(w, npc, w.minute).doing, 12, Ui.MUTED))
	top.add_child(info)
	body.add_child(top)
	body.add_child(Ui.panel(Ui.text("“%s”" % said, 18), Ui.PAPER, 16, 16, Color(0, 0, 0, 0), 0))
	var slot = w.inventory[int(w.selected)]
	var giftable: bool = slot != null and Town.can_gift(slot.item)
	var f := Town.friendship(w, id)
	var gifted_today: bool = f.get("gifted") != null and f.gifted == World.day(w)
	var row := Ui.hbox(6)
	if giftable:
		var def := Items.get_def(slot.item)
		row.add_child(Ui.button("🎁 Give %s%s" % [def.name, " (tomorrow)" if gifted_today else ""], func():
			var r := Town.give_gift(Game.world, id)
			ui.said = r.text
			Game.update(func(_s): return r.state), "primary", 14, gifted_today))
	if id == "mei":
		row.add_child(Ui.button("🛒 Shop", func(): Game.open("store"), "soil", 14))
	row.add_child(Ui.button("👋 Bye", Game.close, "ghost", 14))
	body.add_child(row)
	_npc_quests(body, w, id, ui)
	if not giftable:
		body.add_child(Ui.small("Tip: hold an item in your hotbar to give it as a gift. Everyone has favorites!"))
	elif not gifted_today:
		var h := Town.hearts(w, id)
		var hint := "One gift a day. Get to know them to learn what they love."
		if h >= 2:
			hint = {"love": "💖 They'll love this!", "like": "😊 They'll like this.", "neutral": "🙂 They won't mind it.", "dislike": "😬 Hmm, maybe not this."}[Town.gift_reaction(npc, slot.item)]
		body.add_child(Ui.small(hint))
	return m


## Requests this person has for you, and ones you can hand in.
static func _npc_quests(body: VBoxContainer, w: Dictionary, npc_id: String, ui: Dictionary) -> void:
	var qs := Quests.quest_state(w)
	for a in qs.active:
		var st := Quests.quest_status(w, a)
		if st.giver != npc_id:
			continue
		var box := Ui.vbox(4)
		box.add_child(Ui.text("📜 " + st.title, 15, Ui.INK, 900))
		box.add_child(quest_step(w, a))
		if st.progress.done:
			var label := "Hand over" if st.step.goal.kind == "deliver" else "Done!"
			if st.last:
				label += " · " + Quests.reward_text(st.reward)
			box.add_child(Ui.button("✅ " + label, func():
				var r := Quests.turn_in(Game.world, a.id)
				ui.said = r.text
				Game.update(func(_s): return r.state), "primary", 14))
		body.add_child(Ui.panel(box, Ui.CARD, 12, 12))
	var offered := Quests.offers(w, npc_id)
	if offered.size():
		var q: Dictionary = offered[0]
		var box := Ui.vbox(4)
		box.add_child(Ui.text("%s: %s" % ["🏡 Community project" if q.get("project") else "📜 New request", q.title], 15, Ui.INK, 900))
		box.add_child(Ui.text("“%s”" % q.ask, 14))
		box.add_child(Ui.text("Reward: " + Quests.reward_text(q.reward), 12, Ui.MUTED, 900))
		box.add_child(Ui.button("Accept", func():
			ui.said = "Wonderful, thank you! Come find me when it's done."
			Game.update(func(s): return Quests.accept(s, q.id)), "soil", 14))
		body.add_child(Ui.panel(box, Color(Ui.SUN, 0.1), 12, 12, Ui.SUN, 2))


static func quest_step(w: Dictionary, a: Dictionary) -> Control:
	var st := Quests.quest_status(w, a)
	var col := Ui.vbox(4)
	var label: String = st.step.label
	if st.steps.size() > 1:
		label = "[b]Step %d of %d:[/b] %s" % [st.stepIndex + 1, st.steps.size(), label]
	col.add_child(Ui.text(label, 13))
	var row := Ui.hbox(6)
	var prog: Dictionary = st.progress
	row.add_child(Ui.meter(prog.have, prog.need, Ui.LEAF if prog.done else Ui.SUN, 360, 6))
	row.add_child(Ui.text("%s/%s" % [Js.num(prog.have), Js.num(prog.need)], 12, Ui.INK, 900, false))
	col.add_child(row)
	return col


## The town notice board: today's delivery requests and the community project.
static func notice_board(game_ui: GameUi) -> Dictionary:
	var w := Game.world
	var ui: Dictionary = game_ui.ui
	var m := Ui.modal("Town notice board", "📌", Game.close)
	var body: VBoxContainer = m.body
	body.add_child(Ui.text("Requests from your neighbors. Fill them here before they come down (3 days).", 14, Ui.MUTED))
	var qs := Quests.quest_state(w)
	for r in Quests.board_requests(w):
		var active = null
		for a in qs.active:
			if a.id == r.id:
				active = a
		var done: bool = r.id in qs.done
		var box := Ui.vbox(4)
		box.add_child(Ui.text("📄 " + r.board.title, 15, Ui.INK, 900))
		if active == null:
			box.add_child(Ui.text(Quests.goal_label(r.board.goal), 13))
		var who: Dictionary = Town.npc(r.board.npc)
		box.add_child(Ui.text("Pays: %s (with %s)" % [Quests.reward_text(r.board.reward), who.short], 12, Ui.MUTED, 900))
		if done:
			box.add_child(Ui.text("✅ Filled. Thank you!", 13, Ui.LEAF, 900))
		elif active != null:
			box.add_child(quest_step(w, active))
			if Quests.quest_status(w, active).progress.done:
				box.add_child(Ui.button("✅ Deliver", func():
					var res := Quests.turn_in(Game.world, r.id)
					ui.said = res.text
					Game.update(func(_s): return res.state), "primary", 14))
		else:
			box.add_child(Ui.button("Take this request", func(): Game.update(func(s): return Quests.accept(s, r.id, r.board)), "soil", 14))
		body.add_child(Ui.panel(box, Color("#fdf6e3"), 12, 12))
	var project: Dictionary = Quests.by_id("community-garden")
	var proj_active = null
	for a in qs.active:
		if a.id == project.id:
			proj_active = a
	var pbox := Ui.vbox(4)
	pbox.add_child(Ui.text("🏡 Community project: " + project.title, 15, Ui.INK, 900))
	if project.id in qs.done:
		pbox.add_child(Ui.text("Finished! The community garden is thriving, and you can farm there too.", 13))
	elif proj_active != null:
		pbox.add_child(quest_step(w, proj_active))
	else:
		pbox.add_child(Ui.text("Talk to Dr. Okafor at the Extension Office to help%s" % ("." if "soil-check" in qs.done else " (she'll ask after you've tested your soil)."), 13))
	body.add_child(Ui.panel(pbox, Color(Ui.LEAF_LIGHT, 0.5), 12, 12, Color(Ui.LEAF, 0.5), 2))
	if ui.has("said"):
		body.add_child(Ui.panel(Ui.text(ui.said, 14), Ui.PAPER, 12, 12, Color(0, 0, 0, 0), 0))
	return m


## Everything you're working on.
static func quest_log() -> Dictionary:
	var w := Game.world
	var m := Ui.modal("Quests", "📜", Game.close)
	var body: VBoxContainer = m.body
	var qs := Quests.quest_state(w)
	if qs.active.is_empty():
		body.add_child(Ui.text("No quests yet. Visit town, talk to people, and check the notice board in the square.", 14, Ui.MUTED))
	for a in qs.active:
		var st := Quests.quest_status(w, a)
		var who: String = "Notice board" if a.get("board") else ("Grandma Rosa's note" if st.giver == "rosa" else Town.npc(st.giver).short)
		var box := Ui.vbox(4)
		box.add_child(Ui.text("[b]%s[/b] [color=#6e5f50]· %s[/color]" % [st.title, who], 15))
		box.add_child(quest_step(w, a))
		if st.progress.done:
			box.add_child(Ui.text("Ready! Claim it on Grandma's note." if st.giver == "rosa" else "Ready! Go see %s." % ("the notice board" if who == "Notice board" else who), 13, Ui.LEAF, 900))
		box.add_child(Ui.text("Reward: " + Quests.reward_text(st.reward), 11, Ui.MUTED))
		body.add_child(Ui.panel(box, Ui.CARD, 12, 12))
	var story := 0
	var board := 0
	for id in qs.done:
		if id.begins_with("board-"):
			board += 1
		elif not id.begins_with("lesson-"):
			story += 1
	body.add_child(Ui.small("Finished: %d story quests, %d notice-board requests." % [story, board]))
	return m


# ───────────────────────── around the valley ─────────────────────────

## A signpost: everywhere it points, and how long the walk takes. Port of TravelMenu in Travel.tsx.
static func travel_menu() -> Dictionary:
	var w := Game.world
	var m := Ui.modal("Signpost", "🪧", Game.close)
	var body: VBoxContainer = m.body
	body.add_child(Ui.text("Pick a place and you'll walk there. The clock keeps running on the way.", 14, Ui.MUTED))
	var p := World.player_tile(w)
	for d in WorldMap.DESTINATIONS:
		var row := Ui.hbox(10)
		row.add_child(Ui.emoji_icon(d.icon, 28))
		var name := Ui.text(d.name, 15, Ui.INK, 800, false)
		name.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		row.add_child(name)
		var here: bool = absi(int(d.x) - p.x) + absi(int(d.y) - p.y) <= 3
		if here:
			row.add_child(Ui.pill("You're here", Ui.PAPER, Ui.MUTED, 13))
		else:
			var steps := Town.route(w, [p.x, p.y], [int(d.x), int(d.y)]).size()
			var id: String = d.id
			row.add_child(Ui.button("🚶 %d min" % World.travel_minutes(steps), func():
				Game.update(func(s): return World.travel_to(s, id))
				Game.close(), "primary", 14))
		body.add_child(Ui.panel(row, Ui.CARD, 12, 8))
	return m


## Kai's fishing hut: a rod for sale, and Kai buys whatever you've caught. Port of HutMenu in Travel.tsx.
static func hut_menu() -> Dictionary:
	var w := Game.world
	var m := Ui.modal("Kai's Fishing Hut", "🎣", Game.close)
	var body: VBoxContainer = m.body
	var rod := Items.get_def("rod")
	var row := Ui.hbox(10)
	row.add_child(Ui.item_icon("rod", 32))
	var info := Ui.vbox(2)
	info.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	info.add_child(Ui.text(rod.name, 15, Ui.INK, 900))
	info.add_child(Ui.text(rod.desc, 12, Ui.MUTED))
	row.add_child(info)
	row.add_child(Ui.button("🪙 %s" % Js.num(rod.price), func(): Game.update(func(s): return World.buy(s, "rod", 1)), "primary", 14, w.coins < rod.price))
	body.add_child(Ui.panel(row, Ui.CARD, 12, 8))
	body.add_child(Ui.heading("Kai buys your catch"))
	var catches := {}
	for c in Data.catches():
		catches[c.id] = true
	var any := false
	for i in w.inventory.size():
		var s = w.inventory[i]
		if s == null or not catches.has(s.item):
			continue
		any = true
		var def := Items.get_def(s.item)
		var each := Items.sell_price(def, s.get("grade"), false)
		var fish := Ui.hbox(10)
		fish.add_child(Ui.item_icon(s.item, 30))
		var label := Ui.text("%s ×%s" % [def.name, Js.num(s.qty)], 15, Ui.INK, 800)
		label.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		fish.add_child(label)
		var slot: int = i
		var qty := int(s.qty)
		fish.add_child(Ui.button("Sell 1 · %s" % Js.num(each), func(): Game.update(func(x): return World.sell_now(x, slot, 1)), "ghost", 13))
		fish.add_child(Ui.button("All · %s" % Js.num(each * qty), func(): Game.update(func(x): return World.sell_now(x, slot, qty)), "primary", 13))
		body.add_child(Ui.panel(fish, Ui.CARD, 12, 8))
	if not any:
		body.add_child(Ui.panel(Ui.text("No fish yet. Try the dock at dawn or dusk.", 14, Ui.MUTED), Ui.PAPER, 12, 14, Color(0, 0, 0, 0), 0))
	return m
