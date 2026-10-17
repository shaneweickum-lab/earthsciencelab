class_name Play
## Replays the scripted playthroughs recorded by src/world/godot-golden.test.ts.


## Same as apply() in the TS fixture generator. Returns {state, text}.
static func apply(s: Dictionary, op: Dictionary) -> Dictionary:
	match op.op:
		"player":
			return {"state": Js.with(s, {"player": {"x": op.x, "y": op.y, "facing": op.facing}})}
		"tile":
			var tiles: Array = s.tiles.duplicate()
			tiles[int(op.i)] = Js.with(tiles[int(op.i)], op.patch)
			return {"state": Js.with(s, {"tiles": tiles})}
		"weather":
			var weather: Dictionary = s.weather.duplicate()
			weather[str(int(op.day))] = op.w
			return {"state": Js.with(s, {"weather": weather})}
		"select":
			return {"state": Js.with(s, {"selected": int(op.i)})}
		"enterMine":
			return {"state": World.enter_mine(s, int(op.floor))}
		"craft":
			return {"state": World.craft(s, op.id)}
		"selectItem":
			var at := 0
			for i in s.inventory.size():
				if s.inventory[i] != null and s.inventory[i].item == op.item:
					at = i
					break
			return {"state": Js.with(s, {"selected": at})}
		"give":
			var got = World.add_item(s, op.item, int(op.qty), op.get("grade"))
			return {"state": got if got != null else s}
		"act":
			return {"state": World.act(s)}
		"applyTool":
			return {"state": World.apply_tool(s)}
		"interact":
			return {"state": World.interact(s)}
		"tick":
			return {"state": World.tick(s, int(op.n))}
		"sleep":
			return {"state": World.sleep(s)}
		"buy":
			return {"state": World.buy(s, op.id, int(op.qty))}
		"sellNow":
			return {"state": World.sell_now(s, int(op.slot), int(op.qty))}
		"ship":
			return {"state": World.ship(s, int(op.slot))}
		"move":
			return {"state": Js.with(s, {"player": World.move_player(s, op.dx, op.dy)})}
		"swap":
			return {"state": World.swap_slots(s, int(op.a), int(op.b))}
		"take":
			return {"state": World.take_from_chest(s, op.id, int(op.slot))}
		"takeAll":
			return {"state": World.take_all_from_chest(s, op.id)}
		"put":
			return {"state": World.put_in_chest(s, op.id, int(op.slot))}
		"pickUp":
			return {"state": World.pick_up_building(s, op.id)}
		"talk":
			return Town.talk(s, op.id)
		"gift":
			return Town.give_gift(s, op.id)
		"accept":
			if op.get("board") == null:
				return {"state": Quests.accept(s, op.id)}
			var r: Dictionary = Quests.board_requests(s)[int(op.board)]
			return {"state": Quests.accept(s, r.id, r.board)}
		"turnIn":
			var r := Quests.turn_in(s, op.id)
			return {"state": r.state, "text": "%s|%s" % ["true" if r.finished else "false", r.text]}
		"expireBoard":
			return {"state": Quests.expire_board(s)}
	assert(false, "unknown op " + op.op)
	return {"state": s}


static func summary(s: Dictionary, text: Variant) -> Dictionary:
	var f := World.facing_tile(s)
	var t = World.tile_at(s, f.x, f.y)
	var inv := []
	for i in s.inventory.size():
		var x = s.inventory[i]
		if x != null:
			inv.append([i, x.item, x.qty, x.get("grade")])
	var npc = Town.npc_in_front(s)
	return {
		"minute": s.minute, "coins": s.coins, "energy": s.energy, "water": s.water, "canSize": s.canSize, "organic": s.organic,
		"selected": s.selected, "harvests": s.harvests, "player": s.player,
		"msg": s.messages[-1].text if s.messages.size() else null, "nMsg": s.messages.size(), "text": text,
		"inv": inv, "journal": s.journal, "shipping": s.shipping, "nBuildings": s.buildings.size(),
		"preview": Preview.preview_action(s), "tile": t,
		"growth": World.growth_factor(s, f.x, f.y) if t != null else null,
		"grade": Grades.expected_grade(s, t) if t != null else null,
		"npc": npc.id if npc != null else null, "quests": s.get("quests"), "friends": s.get("friends"),
		"mine": {"floor": s.mine.floor, "ladderAt": s.mine.ladderAt, "buildings": s.mine.buildings} if s.get("mine") != null else null,
		"deepest": s.get("deepest"),
	}


## The end state, with only the tiles that can change (garden and greenhouse).
static func final_state(s: Dictionary) -> Dictionary:
	var tiles := []
	for i in s.tiles.size():
		var t: Dictionary = s.tiles[i]
		if t.ground == "farm" or t.greenhouse:
			tiles.append([i, t])
	return Js.with(s, {"tiles": tiles})
