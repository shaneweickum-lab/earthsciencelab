class_name Town
## Port of src/world/town.ts. The townsfolk (schedules, lines, gifts, stories) come from data/town.json.

const POINTS_PER_HEART := 100
const MAX_HEARTS := 10
## Game minutes per tile when walking.
const WALK_MINUTES := 2

const GIFT_POINTS := {"love": 80, "like": 45, "neutral": 20, "dislike": -20}
const GIFT_TEXT := {
	"love": "Oh! I love this! Thank you so much!",
	"like": "How thoughtful. Thank you!",
	"neutral": "Thanks, that's nice of you.",
	"dislike": "Oh… um. Thanks, I guess.",
}

## Route caches, one per buildings array (by reference, like the TS WeakMap). The engine makes a
## new buildings array whenever a building changes and every night, which resets the cache.
static var _route_caches := []


static func npcs() -> Array:
	return Data.npcs()


static func npc(id: String) -> Variant:
	for n in Data.npcs():
		if n.id == id:
			return n
	return null


# ───────────────────────── where NPCs are ─────────────────────────

## Shortest walkable route between two tiles (breadth-first search). Falls back to a straight hop.
static func route(state: Dictionary, from: Array, to: Array) -> Array:
	var cache: Dictionary = {}
	var found := false
	for entry in _route_caches:
		if is_same(entry[0], state.buildings):
			cache = entry[1]
			found = true
			break
	if not found:
		_route_caches.push_front([state.buildings, cache])
		_route_caches.resize(mini(_route_caches.size(), 8))
	var key := "%d,%d>%d,%d" % [from[0], from[1], to[0], to[1]]
	if cache.has(key):
		return cache[key]
	var W := WorldMap.W
	var start: int = int(from[1]) * W + int(from[0])
	var goal: int = int(to[1]) * W + int(to[0])
	var prev := {start: -1}
	var queue := [start]
	var head := 0
	while head < queue.size():
		var cur: int = queue[head]
		head += 1
		if cur == goal:
			break
		var cx := cur % W
		var cy := cur / W
		for d in World.DIRS.values():
			var nx: int = cx + d[0]
			var ny: int = cy + d[1]
			var n := ny * W + nx
			if prev.has(n) or not (n == goal or World.is_walkable(state, nx, ny)):
				continue
			prev[n] = cur
			queue.append(n)
	var path := []
	if prev.has(goal):
		var c := goal
		while c != -1:
			path.push_front([c % W, c / W])
			c = prev[c]
	var result := path if path.size() else [from, to]
	cache[key] = result
	return result


static func _stop_at(n: Dictionary, hour: int) -> Dictionary:
	var s: Array = n.schedule
	var i := s.size() - 1
	for k in s.size():
		if hour >= s[k].hour:
			i = k
	if hour < s[0].hour:
		i = s.size() - 1
	return {"stop": s[i], "prev": s[posmod(i - 1, s.size())]}


## Where an NPC is at a moment (game minute, fractions allowed), walking between stops along real paths.
static func npc_pose(state: Dictionary, n: Dictionary, minute: float) -> Dictionary:
	var tod := Clock.time_of_day(minute)
	var hour := fmod(tod / 60.0, 24.0)
	var at := _stop_at(n, int(floorf(hour)))
	var stop: Dictionary = at.stop
	var prev: Dictionary = at.prev
	var since := fposmod(tod - stop.hour * 60, 1440.0)
	var inside: bool = stop.get("inside", false)
	if inside and since > 0:
		return {"x": stop.x, "y": stop.y, "facing": stop.facing, "moving": false, "visible": false, "doing": stop.doing}
	var path: Array
	if prev.get("inside", false) and not inside:
		path = [[stop.x, stop.y]]
	else:
		path = route(state, [int(prev.x), int(prev.y)], [int(stop.x), int(stop.y)])
	var steps := path.size() - 1
	var t := since / WALK_MINUTES
	if t >= steps:
		return {"x": stop.x, "y": stop.y, "facing": stop.facing, "moving": false, "visible": not inside, "doing": stop.doing}
	var i := int(floorf(t))
	var f := t - i
	var a: Array = path[i]
	var b: Array = path[i + 1]
	var facing := "right" if b[0] > a[0] else ("left" if b[0] < a[0] else ("down" if b[1] > a[1] else "up"))
	return {"x": a[0] + (b[0] - a[0]) * f, "y": a[1] + (b[1] - a[1]) * f, "facing": facing, "moving": true, "visible": true, "doing": "walking (%s next)" % stop.doing}


## The NPC standing on the tile you're facing, if any.
static func npc_in_front(state: Dictionary) -> Variant:
	if state.get("mine") != null:
		return null
	var f := World.facing_tile(state)
	for n in npcs():
		var p := npc_pose(state, n, state.minute)
		if p.visible and absf(p.x - f.x) < 0.75 and absf(p.y - f.y) < 0.75:
			return n
	return null


# ───────────────────────── friendship ─────────────────────────

static func friendship(state: Dictionary, id: String) -> Dictionary:
	var friends = state.get("friends")
	if friends is Dictionary and friends.has(id):
		return friends[id]
	return {"points": 0}


static func hearts(state: Dictionary, id: String) -> int:
	return mini(MAX_HEARTS, int(floorf(friendship(state, id).points / float(POINTS_PER_HEART))))


static func _set_friend(state: Dictionary, id: String, f: Dictionary) -> Dictionary:
	var friends: Dictionary = state.get("friends", {}).duplicate() if state.get("friends") is Dictionary else {}
	friends[id] = Js.with(f, {"points": maxf(0, minf(MAX_HEARTS * POINTS_PER_HEART, f.points))})
	return Js.with(state, {"friends": friends})


## Today's line from an NPC. The first chat each day raises friendship. Returns {state, text}.
static func talk(state: Dictionary, id: String) -> Dictionary:
	var n: Dictionary = npc(id)
	var f := friendship(state, id)
	var d := Clock.day_of(state.minute)
	if not f.get("met", false):
		return {"state": _set_friend(state, id, Js.with(f, {"met": true, "talked": d, "points": f.points + 20})), "text": n.greeting}
	var h := hearts(state, id)
	var told: Array = f.get("stories", [])
	for st in n.stories:
		if st.hearts <= h and not Js.includes(told, st.hearts):
			var talked_today: bool = f.get("talked") != null and f.talked == d
			var nf := Js.with(f, {"stories": told + [st.hearts], "talked": d, "points": f.points + (0 if talked_today else 20)})
			return {"state": _set_friend(state, id, nf), "text": st.text}
	var tier := 2 if h >= 8 else (1 if h >= 4 else 0)
	var pool: Array = n.lines[tier] + _seasonal_lines(state)
	var text: String = pool[(d * 7 + id.length()) % pool.size()]
	if f.get("talked") != null and f.talked == d:
		return {"state": state, "text": text}
	return {"state": _set_friend(state, id, Js.with(f, {"talked": d, "points": f.points + 20})), "text": text}


static func _seasonal_lines(state: Dictionary) -> Array:
	var w := World.today_weather(state)
	var season := Clock.season_of(Clock.day_of(state.minute), state.settings)
	var out := []
	if w == "rain" or w == "storm":
		out.append("At least the rain is watering everyone's gardens for free.")
	if w == "snow":
		out.append("Snow! The soil sleeps under it like a blanket.")
	if w == "frost":
		out.append("Frost this morning. Hope your tender crops were covered!")
	if w == "heat":
		out.append("Too hot! Mulch your beds or they'll bake.")
	if state.settings.seasons and season == "Fall":
		out.append("I love fall. Everything turns gold.")
	return out


## love, like, neutral, or dislike
static func gift_reaction(n: Dictionary, item_id: String) -> String:
	if item_id in n.loves:
		return "love"
	if item_id in n.likes:
		return "like"
	if item_id in n.dislikes:
		return "dislike"
	return "neutral"


static func can_gift(item_id: String) -> bool:
	var def = Data.items().get(item_id)
	return def != null and def.kind != "tool"


## Give the selected item. One gift per NPC per day. Returns {state, text}.
static func give_gift(state: Dictionary, id: String) -> Dictionary:
	var n: Dictionary = npc(id)
	var slot = state.inventory[int(state.selected)]
	if slot == null or not can_gift(slot.item):
		return {"state": state, "text": "Pick an item in your hotbar to give as a gift."}
	var f := friendship(state, id)
	var d := Clock.day_of(state.minute)
	if f.get("gifted") != null and f.gifted == d:
		return {"state": state, "text": "You already gave me something today. You're too kind!"}
	var reaction := gift_reaction(n, slot.item)
	var inv: Array = state.inventory.duplicate()
	inv[int(state.selected)] = Js.with(slot, {"qty": slot.qty - 1}) if slot.qty > 1 else null
	var next := _set_friend(Js.with(state, {"inventory": inv}), id, Js.with(f, {"met": true, "gifted": d, "points": f.points + GIFT_POINTS[reaction]}))
	return {"state": next, "text": GIFT_TEXT[reaction]}
