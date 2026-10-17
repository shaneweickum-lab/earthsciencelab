class_name Quests
## Port of src/world/quests.ts. The story quests come from data/town.json.


static func all() -> Array:
	return Data.quests()


static func by_id(id: String) -> Variant:
	for q in Data.quests():
		if q.id == id:
			return q
	return null


static func quest_state(s: Dictionary) -> Dictionary:
	var q = s.get("quests")
	return q if q is Dictionary else {"active": [], "done": []}


static func _def(a: Dictionary) -> Dictionary:
	var board = a.get("board")
	if board is Dictionary:
		return {"title": board.title, "giver": board.giver, "steps": [{"goal": board.goal, "label": goal_label(board.goal)}], "reward": board.reward}
	return by_id(a.id)


# ───────────────────────── progress ─────────────────────────

static func _grade_at_least(g: Variant, min_grade: Variant) -> bool:
	if not min_grade:
		return true
	return Grades.GRADES.find(g if g else "C") >= Grades.GRADES.find(min_grade)


static func _count_at_grade(s: Dictionary, item: String, min_grade: Variant) -> int:
	var n := 0
	for x in s.inventory:
		if x != null and x.item == item and _grade_at_least(x.get("grade"), min_grade):
			n += int(x.qty)
	return n


## Your own garden soil: the farm field and greenhouse beds.
static func _own_garden(s: Dictionary) -> Array:
	var out := []
	for i in s.tiles.size():
		var t: Dictionary = s.tiles[i]
		if i % WorldMap.W < WorldMap.FARM_W and (t.ground == "farm" or t.greenhouse):
			out.append(t)
	return out


static func _garden_tiles(s: Dictionary) -> Array:
	var g: Dictionary = WorldMap.TOWN.garden
	var out := []
	for y in range(g.y0, g.y1 + 1):
		for x in range(g.x0, g.x1 + 1):
			out.append(s.tiles[y * WorldMap.W + x])
	return out


static func _p(have: float, need: float) -> Dictionary:
	return {"have": minf(have, need), "need": need, "done": have >= need}


## {have, need, done}
static func goal_progress(s: Dictionary, goal: Dictionary) -> Dictionary:
	match goal.kind:
		"deliver":
			var need := 0.0
			var have := 0.0
			for i in goal.items:
				need += i.qty
				have += minf(i.qty, _count_at_grade(s, i.item, i.get("minGrade")))
			return _p(have, need)
		"meetAll":
			var met := 0
			for n in Town.npcs():
				if Town.friendship(s, n.id).get("met", false):
					met += 1
			return _p(met, Town.npcs().size())
		"testSpots":
			var tested := 0
			for t in s.tiles:
				if (t.ground == "farm" or t.greenhouse) and t.known.lab and t.known.shovel and t.known.water:
					tested += 1
			return _p(tested, goal.count)
		"raisePh":
			var ok: bool = s.tiles.any(func(t): return t.ground == "farm" and t.known.lab and t.soil.ph >= goal.to)
			return _p(1 if ok else 0, 1)
		"discover":
			return _p(1 if goal.entry in s.journal else 0, 1)
		"gardenCleared":
			var tiles := _garden_tiles(s)
			var clear := tiles.filter(func(t): return not t.weeds and not t.obstacle).size()
			return _p(Js.round((float(clear) / tiles.size()) * 100), goal.percent)
		"gardenPlanted":
			var planted := _garden_tiles(s).filter(func(t): return t.crop != null and t.crop.id == goal.crop and not t.crop.dead).size()
			return _p(planted, goal.count)
		"farmPlanted":
			return _p(_own_garden(s).filter(func(t): return t.crop != null and not t.crop.dead).size(), goal.count)
		"fedSpots":
			return _p(_own_garden(s).filter(func(t): return t.get("boost", 0) > 0).size(), goal.count)
		"wetSpots":
			return _p(_own_garden(s).filter(func(t): return t.crop != null and not t.crop.dead and t.moisture >= 60).size(), goal.count)
	return _p(0, 1)


static func goal_label(goal: Dictionary) -> String:
	match goal.kind:
		"deliver":
			var parts := []
			for i in goal.items:
				var g = i.get("minGrade")
				parts.append("%s %s%s" % [Js.num(i.qty), Items.get_def(i.item).name, " (grade %s+)" % g if g else ""])
			return "Bring " + ", ".join(parts)
		"meetAll":
			return "Talk to everyone in town"
		"testSpots":
			return "Fully test %s garden spots" % Js.num(goal.count)
		"raisePh":
			return "Raise a tested spot to pH %s+" % Js.num(goal.to)
		"discover":
			return "Find: %s" % goal.entry
		"gardenCleared":
			return "Clear %s%% of the community garden" % Js.num(goal.percent)
		"gardenPlanted":
			return "Plant %s on %s community garden spots" % [goal.crop, Js.num(goal.count)]
		"farmPlanted":
			return "Plant %s crops on your farm" % Js.num(goal.count)
		"fedSpots":
			return "Spread compost or lime on %s garden spots" % Js.num(goal.count)
		"wetSpots":
			return "Get %s of your crops' soil damp" % Js.num(goal.count)
	return ""


## The active quest's current step and progress.
static func quest_status(s: Dictionary, a: Dictionary) -> Dictionary:
	var d := _def(a)
	var step_index := int(a.step)
	var steps: Array = d.steps
	var step: Dictionary = steps[mini(step_index, steps.size() - 1)]
	return Js.with(d, {"stepIndex": step_index, "step": step, "progress": goal_progress(s, step.goal), "last": step_index >= steps.size() - 1})


# ───────────────────────── offering, accepting, finishing ─────────────────────────

## Story quests this NPC can offer right now.
static func offers(s: Dictionary, npc_id: String) -> Array:
	var qs := quest_state(s)
	var h := Town.hearts(s, npc_id)
	return all().filter(func(q):
		var needs: Dictionary = q.get("needs", {})
		return q.giver == npc_id \
			and not q.id in qs.done and not qs.active.any(func(a): return a.id == q.id) \
			and needs.get("hearts", 0) <= h \
			and needs.get("quests", []).all(func(id): return id in qs.done))


static func accept(s: Dictionary, id: String, board: Variant = null) -> Dictionary:
	var qs := quest_state(s)
	if qs.active.any(func(a): return a.id == id):
		return s
	var a := {"id": id, "accepted": Clock.day_of(s.minute), "step": 0}
	if board is Dictionary:
		a.board = board
	return Js.with(s, {"quests": Js.with(qs, {"active": qs.active + [a]})})


## Active quests you can turn in to this NPC (or at the board, for "board").
static func ready_to_turn_in(s: Dictionary, giver: String) -> Array:
	return quest_state(s).active.filter(func(a):
		var st := quest_status(s, a)
		return st.giver == giver and st.progress.done)


static func _take_items(s: Dictionary, items: Array) -> Dictionary:
	var inv: Array = s.inventory.duplicate()
	for want in items:
		var left: int = int(want.qty)
		# Hand over the lowest grade that still qualifies, so you keep your best produce.
		var order := []
		for i in inv.size():
			var x = inv[i]
			if x != null and x.item == want.item and _grade_at_least(x.get("grade"), want.get("minGrade")):
				order.append(i)
		order = Js.stable_sort(order, func(i): return Grades.GRADES.find(inv[i].get("grade") if inv[i].get("grade") else "C"))
		for i in order:
			if left <= 0:
				break
			var x: Dictionary = inv[i]
			var take := mini(left, int(x.qty))
			inv[i] = Js.with(x, {"qty": x.qty - take}) if x.qty - take > 0 else null
			left -= take
	return Js.with(s, {"inventory": inv})


static func _give_reward(s: Dictionary, giver: String, r: Dictionary) -> Dictionary:
	var next := Js.with(s, {"coins": s.coins + r.get("coins", 0)})
	for it in r.get("items", []):
		var got = World.add_item(next, it.item, int(it.qty))
		if got != null:
			next = got
	var friends: Dictionary = next.get("friends", {}).duplicate() if next.get("friends") is Dictionary else {}
	var bump := func(id: String, pts: float) -> void:
		var f: Dictionary = friends.get(id, {"points": 0})
		friends[id] = Js.with(f, {"points": minf(10 * Town.POINTS_PER_HEART, f.points + pts)})
	if r.get("friendship") and Town.npc(giver) != null:
		bump.call(giver, r.friendship)
	if r.get("everyone"):
		for n in Town.npcs():
			bump.call(n.id, r.everyone)
	return Js.with(next, {"friends": friends})


static func reward_text(r: Dictionary) -> String:
	var parts := []
	if r.get("coins"):
		parts.append("🪙 %s" % Js.num(r.coins))
	for it in r.get("items", []):
		var def := Items.get_def(it.item)
		parts.append("%s %s %s" % [def.icon, Js.num(it.qty), def.name])
	if r.get("friendship"):
		var h := Js.round(r.friendship / float(Town.POINTS_PER_HEART) * 10) / 10
		parts.append("❤️ +%s heart%s" % [Js.num(h), "" if r.friendship == Town.POINTS_PER_HEART else "s"])
	if r.get("everyone"):
		parts.append("❤️ friendship with everyone")
	return " · ".join(parts)


## Finish the current step (handing over items for deliveries). Completes the quest after its
## last step. Returns {state, finished, text}.
static func turn_in(s: Dictionary, id: String) -> Dictionary:
	var qs := quest_state(s)
	var a = null
	for q in qs.active:
		if q.id == id:
			a = q
			break
	if a == null:
		return {"state": s, "finished": false, "text": ""}
	var st := quest_status(s, a)
	if not st.progress.done:
		return {"state": s, "finished": false, "text": "Not quite yet!"}
	var next := _take_items(s, st.step.goal.items) if st.step.goal.kind == "deliver" else s
	if not st.last:
		var active: Array = qs.active.map(func(q): return Js.with(q, {"step": q.step + 1}) if q.id == id else q)
		next = Js.with(next, {"quests": Js.with(qs, {"active": active})})
		return {"state": next, "finished": false, "text": "Great, that's done! Next: %s." % st.steps[int(a.step) + 1].label}
	var board = a.get("board")
	next = _give_reward(next, board.npc if board is Dictionary else st.giver, st.reward)
	next = Js.with(next, {"quests": {"active": qs.active.filter(func(q): return q.id != id), "done": qs.done + [id]}})
	var thanks: String = "Thanks! That's exactly what I needed." if board is Dictionary else by_id(id).thanks
	return {"state": next, "finished": true, "text": thanks}


# ───────────────────────── notice board ─────────────────────────

## Two delivery requests a day from townsfolk, for crops in season: [{id, board}].
static func board_requests(s: Dictionary) -> Array:
	var day := Clock.day_of(s.minute)
	var rand := Rng.stream(int(s.seed) ^ U32.imul(day, 0x9e3779b1))
	var season := Clock.season_of(day, s.settings)
	var crops := []
	for c in Data.world_crops():
		var wc: Dictionary = Data.world_crops()[c]
		if not wc.get("cover", false) and (not s.settings.seasons or season in wc.seasons):
			crops.append(c)
	var grades := [null, null, "D", "C", "B"]
	var npcs := Town.npcs()
	var out := []
	for n in 2:
		var crop: String = crops[int(floorf(rand.next() * crops.size()))]
		var who: Dictionary = npcs[int(floorf(rand.next() * npcs.size()))]
		var qty := 2 + int(floorf(rand.next() * 5))
		var min_grade = grades[int(floorf(rand.next() * grades.size()))]
		var item := "crop_" + crop
		var def := Items.get_def(item)
		# Pays half again what the store would, plus a little friendship with whoever asked.
		var coins := Js.round(Items.sell_price(def, min_grade if min_grade else "C", false) * qty * 1.5 + 20)
		var want := {"item": item, "qty": qty}
		if min_grade:
			want.minGrade = min_grade
		out.append({
			"id": "board-%d-%d" % [day, n],
			"board": {
				"title": "%s needs %s" % [who.short, def.name.to_lower()],
				"giver": "board",
				"npc": who.id,
				"goal": {"kind": "deliver", "items": [want]},
				"reward": {"coins": coins, "friendship": 30},
				"expires": day + 3,
			},
		})
	return out


## Drop notice-board requests that ran out of time.
static func expire_board(s: Dictionary) -> Dictionary:
	var qs := quest_state(s)
	var day := Clock.day_of(s.minute)
	var active: Array = qs.active.filter(func(a): return not a.get("board") is Dictionary or a.board.expires >= day)
	return s if active.size() == qs.active.size() else Js.with(s, {"quests": Js.with(qs, {"active": active})})
