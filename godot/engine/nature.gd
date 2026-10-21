class_name Nature
## Port of src/world/nature.ts. The spawn table comes from data/nature.json.

## Mushrooms only fruit after damp weather.
const FUNGI := ["oyster-mushroom", "puffball", "turkey-tail"]


static func _weather_kind(state: Dictionary, day: int) -> String:
	var w = state.weather.get(str(day))
	return w.kind if w is Dictionary else "sunny"


static func _habitat_ok(state: Dictionary, x: int, y: int, habitat: String) -> bool:
	var t: Dictionary = state.tiles[WorldMap.idx(x, y)]
	for b in state.buildings:
		var sz := WorldMap.size_of(b.kind)
		if x >= b.x and x < b.x + sz[0] and y >= b.y and y < b.y + sz[1]:
			return false
	match habitat:
		"farm":
			return t.ground == "farm" and not t.obstacle
		"grass":
			return t.ground == "grass" and not t.obstacle
		"forest":
			return t.ground == "forest" and t.obstacle == "tree"
		"log":
			return t.obstacle == "log" or t.obstacle == "stump"
		"shore":
			return t.ground == "sand"
		"flowers":
			var c = t.crop
			if c and not c.dead and c.growth > 0.5 and c.id in ["sunflower", "buckwheat", "clover"]:
				return true
			for b in state.buildings:
				if b.kind == "flowerBed" and absf(b.x - x) + absf(b.y - y) == 1:
					return true
			return false
	return false


## Each morning, a few creatures and fungi appear around the farm for the day.
static func spawn_critters(state: Dictionary, day: int) -> Dictionary:
	var rand := Rng.stream(int(state.seed) ^ (day * 104729) ^ 0x5eed)
	var season := Clock.season_of(day, state.settings)
	var today := _weather_kind(state, day)
	var yesterday := _weather_kind(state, day - 1)
	var damp := today in ["rain", "storm", "fog"] or yesterday in ["rain", "storm", "fog"]
	var until := Clock.start_of_day(day + 1) - 1

	var pool := []
	for s in Data.spawns():
		if season in s.seasons and not today in s.get("avoids", []) and (not s.kind in FUNGI or damp):
			pool.append(s)
	var weights := pool.map(func(s): return s.weight * (3 if today in s.get("likes", []) else 1))
	var total := 0.0
	for w in weights:
		total += w
	var count := 2 if season == "Winter" else 6
	var critters := []
	var n := 0
	while n < count and total > 0:
		var r := rand.next() * total
		var found := -1
		for i in weights.size():
			r -= weights[i]
			if r < 0:
				found = i
				break
		var spec: Dictionary = pool[found] if found >= 0 else pool[0]
		# Try some random spots for its habitat: mostly around the farm and the country road, then anywhere in the valley.
		for tries in 60:
			var x := int(floorf(rand.next() * (WorldMap.TOWN.x0 if tries < 40 else WorldMap.W)))
			var y := int(floorf(rand.next() * WorldMap.H))
			if critters.any(func(c): return c.x == x and c.y == y):
				continue
			if not _habitat_ok(state, x, y, spec.habitat):
				continue
			critters.append({"id": "%s-%d-%d" % [spec.kind, day, n], "kind": spec.kind, "x": x, "y": y, "until": until})
			break
		n += 1
	return Js.with(state, {"critters": critters})


## Drop critters whose time is up.
static func expire_critters(state: Dictionary) -> Dictionary:
	var left: Array = state.critters.filter(func(c): return c.until > state.minute)
	return state if left.size() == state.critters.size() else Js.with(state, {"critters": left})


static func critter_icon(kind: String) -> String:
	for s in Data.spawns():
		if s.kind == kind:
			return s.icon
	return "✨"
