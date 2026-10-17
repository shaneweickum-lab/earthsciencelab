class_name World
## Port of src/world/engine.ts. The world is a Dictionary in the exact shape of the save JSON,
## and every function returns a new world instead of changing the one it's given.

const WORLD_VERSION := 4
const INVENTORY_SIZE := 30
const HOTBAR_SIZE := 10
const MAX_ENERGY := 100
const ORGANIC_BONUS := 1.25

const DIRS := {"up": [0, -1], "down": [0, 1], "left": [-1, 0], "right": [1, 0]}
const ENERGY := {"hoe": 2, "can": 1, "scythe": 1, "axe": 2, "pickaxe": 3, "shovel": 2, "ring": 1}
const DRY := {"sunny": 1.2, "cloudy": 0.6, "fog": 0.4, "heat": 2.4, "frost": 0.5, "snow": 0.2, "rain": 0.0, "storm": 0.0}

static func _clamp(v: float) -> float:
	return Js.clamp100(v)


# ───────────────────────── setup ─────────────────────────

static func new_world(seed: int, settings: Variant = null) -> Dictionary:
	var cfg := Settings.normalize(settings)
	var m := WorldMap.create_map(seed)
	var inventory := []
	inventory.resize(INVENTORY_SIZE)
	var start := [
		["hoe", 1], ["can", 1], ["scythe", 1], ["axe", 1], ["pickaxe", 1], ["shovel", 1], ["ring", 1],
		["seed_carrot", 6], ["seed_clover", 6], ["labKit", 3],
	]
	for i in start.size():
		inventory[i] = {"item": start[i][0], "qty": start[i][1]}
	return {
		"version": WORLD_VERSION,
		"seed": seed,
		"minute": Clock.start_of_day(1),
		"coins": 300,
		"organic": true,
		"energy": MAX_ENERGY,
		"maxEnergy": MAX_ENERGY,
		"water": 20,
		"canSize": 20,
		"player": {"x": 10, "y": 10, "facing": "down"},
		"inventory": inventory,
		"selected": 0,
		"tiles": m.tiles,
		"buildings": m.buildings,
		"shipping": [],
		"critters": [],
		"journal": [],
		"harvests": 0,
		"weather": {"1": Weather.weather_for(seed, 1, cfg), "2": Weather.weather_for(seed, 2, cfg)},
		"log": null,
		"messages": [],
		"introSeen": false,
		"settings": cfg,
	}


# ───────────────────────── helpers ─────────────────────────

static func day(state: Dictionary) -> int:
	return Clock.day_of(state.minute)


## The weather (sky, high, low) for a day.
static func weather_on(state: Dictionary, d: int) -> Dictionary:
	var w = state.weather.get(str(d))
	return w if w is Dictionary else Weather.weather_for(int(state.seed), d, state.settings)


static func today_climate(state: Dictionary) -> Dictionary:
	return weather_on(state, day(state))


static func tomorrow_climate(state: Dictionary) -> Dictionary:
	return weather_on(state, day(state) + 1)


static func today_weather(state: Dictionary) -> String:
	return today_climate(state).kind


static func tomorrow_weather(state: Dictionary) -> String:
	return tomorrow_climate(state).kind


## Today's season (always a mild growing season when seasons are off).
static func season_now(state: Dictionary) -> String:
	return Clock.season_of(day(state), state.settings)


## Today's average temperature, °F. Greenhouses trap the sun's heat and stay much warmer.
static func mean_temp_f(state: Dictionary, greenhouse := false) -> float:
	var w := today_climate(state)
	return (w.high + w.low) / 2.0 + (18 if greenhouse else 0)


static func tile_at(state: Dictionary, x: int, y: int) -> Variant:
	return state.tiles[WorldMap.idx(x, y)] if WorldMap.in_bounds(x, y) else null


static func building_at(state: Dictionary, x: int, y: int) -> Variant:
	for b in state.buildings:
		var sz := WorldMap.size_of(b.kind)
		if x >= b.x and x < b.x + sz[0] and y >= b.y and y < b.y + sz[1]:
			return b
	return null


## Can the player stand on this tile?
static func is_walkable(state: Dictionary, x: int, y: int) -> bool:
	var t = tile_at(state, x, y)
	if t == null or t.ground == "water":
		return false
	if t.obstacle:
		return false
	var b = building_at(state, x, y)
	if b == null:
		return true
	if b.kind in WorldMap.WALKABLE_BUILDINGS:
		return true
	if b.kind == "greenhouse":
		var door: Dictionary = WorldMap.door_of(b)
		if x == door.x and y == door.y:
			return true
		return WorldMap.greenhouse_interior(b).any(func(p): return p.x == x and p.y == y)
	return false


static func player_tile(state: Dictionary) -> Dictionary:
	return {"x": int(Js.round(state.player.x)), "y": int(Js.round(state.player.y))}


static func facing_tile(state: Dictionary) -> Dictionary:
	var p := player_tile(state)
	var d: Array = DIRS[state.player.facing]
	return {"x": p.x + d[0], "y": p.y + d[1]}


static func say(state: Dictionary, text: String) -> Dictionary:
	var messages: Array = state.messages.duplicate()
	messages.append({"text": text, "at": state.minute})
	return Js.with(state, {"messages": messages.slice(-6)})


static func _matches(s: Variant, id: String, grade: Variant) -> bool:
	return s != null and s.item == id and (grade == null or s.get("grade") == grade)


## How many of an item you have (all grades, unless a grade is given).
static func count_item(state: Dictionary, id: String, grade: Variant = null) -> int:
	var n := 0
	for s in state.inventory:
		if _matches(s, id, grade):
			n += int(s.qty)
	return n


## Add items to the bag. Produce of different grades goes in separate stacks. Null if it won't fit.
static func add_item(state: Dictionary, id: String, qty: int, grade: Variant = null) -> Variant:
	if grade == "":
		grade = null
	var inv: Array = state.inventory.duplicate()
	var def = Data.items().get(id)
	var stackable: bool = def == null or def.kind != "tool"
	var left := qty
	if stackable:
		for i in inv.size():
			if left <= 0:
				break
			var s = inv[i]
			if s != null and s.item == id and s.get("grade") == grade:
				inv[i] = Js.with(s, {"qty": s.qty + left})
				left = 0
	for i in inv.size():
		if left <= 0:
			break
		if inv[i] == null:
			var n := left if stackable else 1
			inv[i] = {"item": id, "qty": n, "grade": grade} if grade else {"item": id, "qty": n}
			left -= n
	if left > 0:
		return null
	return Js.with(state, {"inventory": inv})


static func remove_item(state: Dictionary, id: String, qty: int, grade: Variant = null) -> Variant:
	if count_item(state, id, grade) < qty:
		return null
	var inv: Array = state.inventory.duplicate()
	var left := qty
	for i in inv.size():
		if left <= 0:
			break
		var s = inv[i]
		if _matches(s, id, grade):
			var take := mini(int(s.qty), left)
			inv[i] = Js.with(s, {"qty": s.qty - take}) if s.qty - take > 0 else null
			left -= take
	return Js.with(state, {"inventory": inv})


static func _set_tile(state: Dictionary, x: int, y: int, fn: Callable) -> Dictionary:
	var tiles: Array = state.tiles.duplicate()
	var i := WorldMap.idx(x, y)
	tiles[i] = fn.call(tiles[i])
	return Js.with(state, {"tiles": tiles})


static func _spend(state: Dictionary, energy: int) -> Variant:
	if not Settings.on(state, "energy"):
		return state
	if state.energy < energy:
		return null
	return Js.with(state, {"energy": state.energy - energy})


## Which soil numbers the player can see on a tile. With "Hidden soil" off, everything is visible.
static func known_soil(state: Dictionary, t: Dictionary) -> Dictionary:
	return t.known if Settings.on(state, "soilTesting") else {"lab": true, "shovel": true, "water": true}


static func soil_quality(t: Dictionary) -> float:
	var s: Dictionary = t.soil
	return 0.35 * s.nutrients + 0.25 * s.water + 0.2 * s.structure + 0.2 * s.life


static func _near(state: Dictionary, x: int, y: int, kinds: Array, r: int) -> bool:
	for b in state.buildings:
		if b.kind in kinds and absf(b.x - x) <= r and absf(b.y - y) <= r:
			return true
	return false


static func _flowers_near(state: Dictionary, x: int, y: int, r: int) -> bool:
	if _near(state, x, y, ["flowerBed"], r):
		return true
	for yy in range(y - r, y + r + 1):
		for xx in range(x - r, x + r + 1):
			var t = tile_at(state, xx, yy)
			var c = t.crop if t else null
			if c and not c.dead and c.id in ["sunflower", "buckwheat", "clover"] and c.growth > 0.5:
				return true
	return false


# ───────────────────────── growth ─────────────────────────

## How fast a crop grows this hour, 0–1.5, and why.
static func growth_factor(state: Dictionary, x: int, y: int) -> Dictionary:
	var t: Dictionary = state.tiles[WorldMap.idx(x, y)]
	var c = t.crop
	if not c or c.dead:
		return {"factor": 0, "reasons": []}
	var wc := Items.world_crop(c.id)
	var name: String = Items.crop(c.id).name
	var reasons := []
	# Soil quality only counts the parts of the soil that are switched on.
	var f := 0.55 + soil_quality(t) / 110 if Settings.on(state, "nutrients") else 1.0
	var season := season_now(state)
	if Settings.on(state, "plantingSeasons") and state.settings.seasons and not t.greenhouse and not season in wc.seasons:
		return {"factor": 0, "reasons": ["Out of season: %s doesn't grow outdoors in %s." % [name, season]]}
	if Settings.on(state, "watering") and t.moisture < 15:
		f *= 0.15
		reasons.append("Thirsty! Dry soil nearly stops growth. Water it.")
	if Settings.on(state, "waterlogging") and t.moisture >= 90 and t.soil.structure < 40:
		f *= 0.5
		reasons.append("Waterlogged! Soggy, packed soil has no air for roots. Better structure (compost) helps it drain.")
	var ph_off := absf(t.soil.ph - 6.5)
	if Settings.on(state, "ph") and ph_off > 0.8:
		f *= maxf(0.5, 1 - 0.2 * ph_off)
		reasons.append("Soil is too acidic, so some nutrients are locked up." if t.soil.ph < 6.5 else "Soil is too alkaline, so some nutrients are locked up.")
	if Settings.on(state, "weeds") and t.weeds:
		f *= 0.5
		reasons.append("Weeds are stealing water and nutrients.")
	if Settings.on(state, "pests") and c.pests:
		f *= 0.6
		reasons.append("Pests are chewing the leaves.")
	if Settings.on(state, "temperature"):
		var temp := mean_temp_f(state, t.greenhouse)
		var tf := Items.temp_factor(wc.type, temp)
		if tf < 1:
			f *= tf
			var lower := name.to_lower()
			var units: String = state.settings.units
			if tf == 0:
				reasons.append("Too cold for %s-season %s to grow at all (about %s today)." % [wc.type, lower, Settings.format_temp(temp, units)])
			elif temp > 80:
				reasons.append("Heat stress: %s slows down in hot weather." % lower)
			else:
				reasons.append("Chilly: %s-season %s grows slowly at about %s." % [wc.type, lower, Settings.format_temp(temp, units)])
	if Settings.on(state, "pollinators") and _near(state, x, y, ["beehive"], 5):
		f *= 1.1
		reasons.append("Bees nearby help pollinate.")
	if Settings.on(state, "nutrients") and t.soil.nutrients < 20:
		reasons.append("Nutrients are low. Try compost or a legume like beans or clover.")
	return {"factor": minf(1.5, f), "reasons": reasons}


static func _hourly(state: Dictionary) -> Dictionary:
	var weather := today_weather(state)
	var wet := Weather.is_wet(weather)
	var dry: float = DRY[weather]
	var watering := Settings.on(state, "watering")
	var erosion := Settings.on(state, "erosion")
	var tiles: Array = state.tiles.duplicate()
	for i in tiles.size():
		var t: Dictionary = tiles[i]
		if t.ground != "farm" and not t.greenhouse:
			continue
		var outdoors: bool = not t.greenhouse
		var moisture: float = t.moisture
		if outdoors and wet:
			moisture = _clamp(moisture + (18 if weather == "storm" else 12))
		elif watering:
			moisture = _clamp(moisture - (dry if outdoors else 1.3) * (0.5 if t.mulch else 1.0) * (1.35 - t.soil.water / 100.0))
		var soil: Dictionary = t.soil
		var crop = t.crop
		var covered: bool = t.mulch or (crop != null and not crop.dead and Items.crop(crop.id).get("coversSoil", false))
		var changed: bool = moisture != t.moisture
		if erosion and outdoors and weather == "storm" and t.tilled and not covered:
			soil = Js.with(soil, {"structure": _clamp(soil.structure - 0.25), "om": _clamp(soil.om - 0.12), "nutrients": _clamp(soil.nutrients - 0.25)})
			changed = true
		if crop and not crop.dead and crop.growth < 1:
			var x := i % WorldMap.W
			var y := i / WorldMap.W
			var factor: float = growth_factor(state, x, y).factor
			var days := Items.crop_days(crop.id, state.settings.daysPerMonth, crop.harvests > 0)
			# Hard times while growing lower the crop's grade.
			var stressed: bool = (watering and moisture < 15) \
				or (Settings.on(state, "waterlogging") and moisture >= 90 and t.soil.structure < 40) \
				or (Settings.on(state, "weeds") and t.weeds) \
				or (Settings.on(state, "pests") and crop.pests)
			crop = Js.with(crop, {"growth": minf(1, crop.growth + factor / (days * 24)), "stress": crop.get("stress", 0) + (1 if stressed else 0)})
			changed = true
		if changed:
			tiles[i] = Js.with(t, {"moisture": Js.r1(moisture), "soil": soil, "crop": crop})
	return Js.with(state, {"tiles": tiles})


# ───────────────────────── days ─────────────────────────

static func _roll_for(state: Dictionary, salt: int) -> Rng.Stream:
	return Rng.stream(int(state.seed) ^ (day(state) * 7919) ^ salt)


## Everything that happens overnight, ending at 6 AM on `new_day`.
static func _start_day(prev: Dictionary, new_day: int) -> Dictionary:
	var state := Js.with(prev, {"minute": Clock.start_of_day(new_day)})
	var units: String = state.settings.units
	# Keep about a month of weather history so saves stay small.
	var keys: Array = state.weather.keys()
	keys.sort_custom(func(a, b): return int(a) < int(b))
	var weather := {}
	for k in keys:
		if int(k) >= new_day - 30:
			weather[k] = state.weather[k]
	weather[str(new_day)] = weather_on(state, new_day)
	weather[str(new_day + 1)] = weather_on(state, new_day + 1)
	state = Js.with(state, {"weather": weather})
	var climate: Dictionary = weather[str(new_day)]
	var today: String = climate.kind
	var season := Clock.season_of(new_day, state.settings)
	var new_season: bool = state.settings.seasons and Clock.season_of(new_day - 1, state.settings) != season
	var rand := _roll_for(state, 101)
	var notes := []

	# Shipping payout.
	var earned := 0.0
	for s in state.shipping:
		earned += Items.sell_price(Items.get_def(s.item), s.get("grade"), state.organic) * s.qty
	if earned > 0:
		notes.append("The shipping bin paid %s coins%s." % [Js.num(earned), " (organic bonus included)" if state.organic else ""])

	var killed_frost := 0
	var killed_season := 0
	var new_weeds := 0
	var new_pests := 0
	var soil_life := Settings.on(state, "soilLife")
	var tiles: Array = state.tiles.duplicate()
	for i in tiles.size():
		var t: Dictionary = tiles[i]
		var x := i % WorldMap.W
		var y := i / WorldMap.W
		var next := t
		if soil_life and (t.ground == "farm" or t.greenhouse):
			var soil: Dictionary = t.soil.duplicate()
			soil.life = _clamp(soil.life + (soil.om + 10 - soil.life) * 0.05)
			soil.structure = _clamp(soil.structure + (soil.life - soil.structure) * 0.03)
			if t.mulch:
				soil.om = _clamp(soil.om + 0.3)
			soil.life = Js.r1(soil.life)
			soil.structure = Js.r1(soil.structure)
			soil.om = Js.r1(soil.om)
			next = Js.with(t, {"soil": soil})
		var c = next.crop
		if c and not c.dead and not next.greenhouse:
			var wc := Items.world_crop(c.id)
			if Settings.on(state, "plantingSeasons") and new_season and not season in wc.seasons:
				next = Js.with(next, {"crop": Js.with(c, {"dead": true})})
				killed_season += 1
			elif Settings.on(state, "frost") and climate.low <= wc.killF:
				next = Js.with(next, {"crop": Js.with(c, {"dead": true})})
				killed_frost += 1
		# Weeds sprout on uncovered farm soil.
		if Settings.on(state, "weeds") and next.ground == "farm" and not next.greenhouse and not next.weeds and not next.obstacle and not next.mulch and building_at(state, x, y) == null:
			var nc = next.crop
			var covered: bool = nc != null and not nc.dead and Items.crop(nc.id).get("coversSoil", false)
			var chance := 0.01 if season == "Winter" else (0.0 if covered else (0.05 if nc else (0.08 if next.tilled else 0.12)))
			if rand.next() < chance:
				next = Js.with(next, {"weeds": true})
				new_weeds += 1
		# Pests find crops grown in the same family again and again.
		var cc = next.crop
		if Settings.on(state, "pests") and cc and not cc.dead and not cc.pests:
			var guarded := _near(state, x, y, ["bugHotel", "birdHouse"], 6)
			var repeat: bool = Settings.on(state, "rotation") and next.familyStreak >= 1
			var chance := (0.2 if repeat else 0.04) * (0.25 if guarded else 1.0)
			if rand.next() < chance:
				next = Js.with(next, {"crop": Js.with(cc, {"pests": true})})
				new_pests += 1
		tiles[i] = next

	# Buildings work overnight.
	var yesterday_wet := Weather.is_wet(Nature._weather_kind(state, new_day - 1))
	var buildings := []
	for b in state.buildings:
		var data: Dictionary = b.data
		if b.kind == "composter" and data.get("fiber", 0) >= 5 and data.get("startedDay") != null and new_day - data.startedDay >= 2:
			var fiber: int = int(data.get("fiber", 0))
			var made := fiber / 5
			notes.append("Decomposers in your compost bin turned plant fiber into %d compost." % made)
			var nd := Js.with(data, {"fiber": fiber % 5, "ready": data.get("ready", 0) + made, "startedDay": new_day})
			if fiber % 5 == 0:
				nd.erase("startedDay")
			buildings.append(Js.with(b, {"data": nd}))
			continue
		if b.kind == "rainBarrel" and yesterday_wet:
			buildings.append(Js.with(b, {"data": Js.with(data, {"water": minf(40, data.get("water", 0) + 20)})}))
			continue
		if b.kind == "beehive":
			var last: float = data.get("honeyDay", new_day)
			if not data.get("ready") and new_day - last >= 3 and _flowers_near(state, int(b.x), int(b.y), 5):
				notes.append("Your bees made honey from nearby flowers.")
				buildings.append(Js.with(b, {"data": Js.with(data, {"ready": 1, "honeyDay": new_day})}))
				continue
			if data.get("honeyDay") == null:
				buildings.append(Js.with(b, {"data": Js.with(data, {"honeyDay": new_day})}))
				continue
		buildings.append(b)

	if killed_frost:
		notes.append("It dropped to %s overnight, and the cold killed %d tender crop%s outside. A greenhouse protects plants from frost." % [Settings.format_temp(climate.low, units), killed_frost, "s" if killed_frost > 1 else ""])
	if killed_season:
		notes.append("%d crop%s died because %s arrived and they don't grow this season." % [killed_season, "s" if killed_season > 1 else "", season])
	if new_weeds:
		notes.append("%d new weed%s sprouted on uncovered soil. Mulch and cover crops keep weeds down." % [new_weeds, "s" if new_weeds > 1 else ""])
	if new_pests:
		notes.append("Pests found %d crop%s. Rotating plant families and a bug hotel or bird house help." % [new_pests, "s" if new_pests > 1 else ""])
	if new_season:
		notes.push_front("%s begins today!" % season)
	var tomorrow: Dictionary = weather[str(new_day + 1)]
	notes.append("Tomorrow's forecast: %s, high %s, low %s." % [Weather.info(tomorrow.kind).name, Settings.format_temp(tomorrow.high, units), Settings.format_temp(tomorrow.low, units)])

	state = Js.with(state, {
		"tiles": tiles,
		"buildings": buildings,
		"shipping": [],
		"coins": state.coins + earned,
		"log": {"day": new_day, "earned": earned, "notes": notes},
	})
	state = Nature.spawn_critters(state, new_day)
	# Weather you live through goes in the journal.
	var yesterday = state.weather.get(str(new_day - 1))
	if today == "sunny" and yesterday is Dictionary and Weather.is_wet(yesterday.kind):
		state = discover(state, "rainbow")
		var log := Js.with(state.log, {"notes": ["🌈 A rainbow arched over the farm this morning: sunlight behind you, the last raindrops in front."] + state.log.notes})
		state = Js.with(state, {"log": log})
	if today == "storm":
		state = discover(state, "thunderstorm")
	if today == "frost":
		state = discover(state, "frost")
	if today == "snow":
		state = discover(state, "snowflake")
	return state


## Advance the clock. Handles hourly growth, and fainting at 2 AM.
static func tick(state: Dictionary, minutes: int) -> Dictionary:
	var s := state
	var left := minutes
	while left > 0:
		var tod := int(Clock.time_of_day(s.minute))
		var to_hour := 60 - tod % 60
		var step := mini(left, to_hour)
		s = Js.with(s, {"minute": s.minute + step})
		left -= step
		if step == to_hour:
			s = _hourly(s)
		if Clock.time_of_day(s.minute) >= Clock.DAY_END:
			# With "Bedtime" off, the clock waits at 2 AM until you go to bed.
			if Settings.on(s, "bedtime"):
				s = _faint(s)
			else:
				s = Js.with(s, {"minute": s.minute - (Clock.time_of_day(s.minute) - Clock.DAY_END) - 1})
			break
	return s


static func _run_night(state: Dictionary) -> Dictionary:
	var s := state
	var target := Clock.start_of_day(day(state) + 1)
	while s.minute < target:
		var tod := int(Clock.time_of_day(s.minute))
		var step := mini(60 - tod % 60, target - int(s.minute))
		s = Js.with(s, {"minute": s.minute + step})
		if int(s.minute) % 60 == 0 or s.minute == target:
			s = _hourly(s)
	return s


static func sleep(state: Dictionary) -> Dictionary:
	var late := Clock.time_of_day(state.minute) >= 24 * 60
	var d := day(state) + 1
	var s := _start_day(_run_night(state), d)
	return Js.with(s, {
		"energy": Js.round(s.maxEnergy * 0.8) if late else s.maxEnergy,
		"player": {"x": 10, "y": 9, "facing": "down"},
	})


static func _faint(state: Dictionary) -> Dictionary:
	var lost := minf(100, Js.round(state.coins * 0.1))
	var d := day(Js.with(state, {"minute": state.minute - 1})) + 1
	var s := _start_day(Js.with(state, {"minute": Clock.start_of_day(d) - 1}), d)
	var notes: Array = ["You stayed up past 2 AM and fainted! A neighbor carried you home and charged %s coins." % Js.num(lost)] + s.log.notes
	return Js.with(s, {
		"coins": s.coins - lost,
		"energy": Js.round(s.maxEnergy * 0.5),
		"player": {"x": 10, "y": 9, "facing": "down"},
		"log": Js.with(s.log, {"notes": notes}),
	})


# ───────────────────────── tools ─────────────────────────

static func selected_item(state: Dictionary) -> Variant:
	return state.inventory[int(state.selected)]


static func _crit_at(state: Dictionary, x: int, y: int) -> Variant:
	for c in state.critters:
		if c.x == x and c.y == y:
			return c
	return null


## The main action button: observe critters, harvest ripe crops, or use the selected item.
static func act(state: Dictionary) -> Dictionary:
	var f := facing_tile(state)
	var t = tile_at(state, f.x, f.y)
	if t == null:
		return state
	if _crit_at(state, f.x, f.y) != null:
		return interact(state)
	var slot = selected_item(state)
	var def = Data.items()[slot.item] if slot else null
	var c = t.crop
	if c and not c.dead and c.growth >= 1 and (def == null or def.kind != "amendment"):
		return harvest(state, f.x, f.y)
	return apply_tool(state)


## Use the selected item on the tile in front of the player.
static func apply_tool(state: Dictionary) -> Dictionary:
	var slot = selected_item(state)
	if not slot:
		return interact(state)
	var def: Dictionary = Data.items()[slot.item]
	var f := facing_tile(state)
	var x: int = f.x
	var y: int = f.y
	var t = tile_at(state, x, y)
	if t == null:
		return state

	if def.kind == "kit":
		return place_building(state, int(state.selected), x, y)
	if def.kind == "seed":
		return plant(state, x, y, def.crop)
	if def.kind == "amendment":
		return apply_amendment(state, x, y, slot.item)
	if def.kind != "tool":
		return interact(state)

	var cost: int = ENERGY.get(slot.item, 1)
	var b = building_at(state, x, y)
	var paid = _spend(state, cost)
	if paid == null:
		return say(state, "You're too tired. Go home and sleep.")
	var tillage := Settings.on(state, "tillage")

	match slot.item:
		"hoe":
			if t.ground != "farm" and not t.greenhouse:
				return say(state, "You can only till the garden field or greenhouse beds.")
			if b and b.kind != "greenhouse":
				return say(state, "Something is built here.")
			if t.obstacle:
				return say(state, "Clear the %s first." % t.obstacle)
			if t.weeds:
				return say(state, "Cut the weeds with the scythe first.")
			if t.tilled:
				return say(state, "This soil is already tilled.")
			var tilled := _set_tile(paid, x, y, func(tt):
				var soil: Dictionary = tt.soil
				if tillage:
					soil = Js.with(soil, {"structure": _clamp(soil.structure - 2), "om": _clamp(soil.om - 0.5), "life": _clamp(soil.life - 1)})
				return Js.with(tt, {"tilled": true, "soil": soil}))
			return say(tilled, "Tilled! (Each tilling breaks soil crumbs a little, so only till where you'll plant.)" if tillage else "Tilled!")
		"can":
			if t.ground == "water":
				return say(Js.with(paid, {"water": state.canSize}), "Filled your watering can at the pond.")
			if b and b.kind == "rainBarrel":
				return _refill_from_barrel(paid, b)
			if state.water <= 0:
				return say(state, "Your watering can is empty. Refill it at the pond or a rain barrel.")
			if not t.tilled:
				return say(state, "Water tilled soil or crops.")
			# Each pour soaks the soil part way; keep pouring and it gets waterlogged.
			return _set_tile(Js.with(paid, {"water": state.water - 1}), x, y, func(tt): return Js.with(tt, {"moisture": _clamp(tt.moisture + 45)}))
		"scythe":
			if t.weeds:
				var got = add_item(_set_tile(paid, x, y, func(tt): return Js.with(tt, {"weeds": false})), "fiber", 1)
				return say(got, "Cut weeds (+1 fiber).") if got else say(state, "Your bag is full.")
			if t.crop and t.crop.dead:
				var got = add_item(_set_tile(paid, x, y, func(tt): return Js.with(tt, {"crop": null})), "fiber", 1)
				return say(got, "Cleared a dead plant (+1 fiber).") if got else state
			return state
		"axe":
			if t.obstacle != "stick" and t.obstacle != "stump" and t.obstacle != "log":
				return state
			var n := 1 if t.obstacle == "stick" else 4
			var got = add_item(_set_tile(paid, x, y, func(tt): return Js.with(tt, {"obstacle": null})), "wood", n)
			return say(got, "+%d wood." % n) if got else say(state, "Your bag is full.")
		"pickaxe":
			if t.obstacle == "stone":
				var got = add_item(_set_tile(paid, x, y, func(tt): return Js.with(tt, {"obstacle": null})), "stone", 1)
				return say(got, "+1 stone.") if got else say(state, "Your bag is full.")
			if t.tilled and not t.crop:
				return _set_tile(paid, x, y, func(tt): return Js.with(tt, {"tilled": false}))
			return state
		"shovel":
			if t.ground != "farm" and not t.greenhouse:
				return say(state, "Dig a test hole in the garden.")
			if t.obstacle or t.crop:
				return say(state, "Find an open spot to dig.")
			var worms := int(Js.round(t.soil.life / 10))
			var s := _set_tile(paid, x, y, func(tt): return Js.with(tt, {"known": Js.with(tt.known, {"shovel": true})}))
			s = say(s, "Shovel test: you counted %d earthworm%s. Soil life %s, structure %s." % [worms, "" if worms == 1 else "s", Js.num(Js.round(t.soil.life)), Js.num(Js.round(t.soil.structure))])
			s = _discover_if(s, worms >= 3, "earthworm")
			return _discover_if(s, t.soil.life >= 45, "mycorrhizae")
		"ring":
			if t.ground != "farm" and not t.greenhouse:
				return say(state, "Test the garden soil.")
			var mins := maxf(1, Js.round(30 - t.soil.water / 4))
			var s := _set_tile(paid, x, y, func(tt): return Js.with(tt, {"known": Js.with(tt.known, {"water": true})}))
			return say(s, "Infiltration test: an inch of water soaked in after %s minutes. Water holding: %s." % [Js.num(mins), Js.num(Js.round(t.soil.water))])
	return state


static func _refill_from_barrel(state: Dictionary, b: Dictionary) -> Dictionary:
	var have: float = b.data.get("water", 0)
	if have <= 0:
		return say(state, "The rain barrel is empty. It fills when it rains.")
	var need: float = state.canSize - state.water
	var take := minf(need, have)
	var buildings: Array = state.buildings.map(func(o): return Js.with(o, {"data": Js.with(o.data, {"water": have - take})}) if o.id == b.id else o)
	return say(Js.with(state, {"water": state.water + take, "buildings": buildings}), "Refilled from the rain barrel (%s left). Rainwater saves well water!" % Js.num(have - take))


## Why a crop can't be planted here, or "" if it can.
static func can_plant_here(state: Dictionary, x: int, y: int, crop: String) -> String:
	var t = tile_at(state, x, y)
	if t == null:
		return "Nothing here."
	if not t.tilled:
		return "Till the soil with the hoe first."
	if t.crop:
		return "Something is already planted here."
	if t.weeds:
		return "Cut the weeds first."
	var season := season_now(state)
	var wc := Items.world_crop(crop)
	if Settings.on(state, "plantingSeasons") and state.settings.seasons and not t.greenhouse and not season in wc.seasons:
		return "%s won't grow outdoors in %s. Try the greenhouse, or plant in %s." % [Items.crop(crop).name, season, " or ".join(wc.seasons)]
	return ""


static func plant(state: Dictionary, x: int, y: int, crop: String) -> Dictionary:
	var reason := can_plant_here(state, x, y, crop)
	if reason:
		return say(state, reason)
	var s = remove_item(state, "seed_" + crop, 1)
	if s == null:
		return state
	var t: Dictionary = state.tiles[WorldMap.idx(x, y)]
	var info := Items.crop(crop)
	var same: bool = t.lastFamily == info.family
	var out := _set_tile(s, x, y, func(tt): return Js.with(tt, {
		"crop": {"id": crop, "growth": 0, "harvests": 0, "dead": false, "pests": false},
		"familyStreak": tt.familyStreak + 1 if same else 0,
		"soil": tt.soil if same else Js.with(tt.soil, {"life": _clamp(tt.soil.life + 2)}),
	}))
	var rotation := Settings.on(state, "rotation")
	if same and rotation:
		return say(out, "Planted %s. ⚠️ Same plant family as last time here: pests love that." % info.name)
	return say(out, "Planted %s.%s" % [info.name, " Good rotation!" if t.lastFamily and rotation else ""])


static func apply_amendment(state: Dictionary, x: int, y: int, id: String) -> Dictionary:
	var t = tile_at(state, x, y)
	if t == null or (t.ground != "farm" and not t.greenhouse):
		return say(state, "Use this on garden soil.")
	if id == "labKit":
		if t.known.lab:
			return say(state, "You already have lab results for this spot.")
		var tested := _set_tile(remove_item(state, id, 1), x, y, func(tt): return Js.with(tt, {"known": Js.with(tt.known, {"lab": true})}))
		return say(tested, "Lab results: organic matter %s%%, nutrients %s, pH %s." % [Js.to_fixed(t.soil.om * 0.08, 1), Js.num(Js.round(t.soil.nutrients)), Js.to_fixed(t.soil.ph, 1)])
	if t.obstacle:
		return say(state, "Clear the %s first." % t.obstacle)
	var s = remove_item(state, id, 1)
	if s == null:
		return state
	var msg := ""
	var tile: Dictionary = s.tiles[WorldMap.idx(x, y)]
	var soil: Dictionary = tile.soil.duplicate()
	var next := tile
	match id:
		"compost":
			soil.om = _clamp(soil.om + 6)
			soil.life = _clamp(soil.life + 6)
			soil.nutrients = _clamp(soil.nutrients + 6)
			soil.ph = Js.r1(soil.ph + (6.8 - soil.ph) * 0.25)
			msg = "Spread compost: more organic matter, soil life, and nutrients."
			next = Js.with(tile, {"soil": soil})
		"mulch":
			msg = "Mulched: holds moisture, blocks weeds, and protects soil from storms."
			next = Js.with(tile, {"mulch": true, "weeds": false})
		"lime":
			soil.ph = Js.r1(minf(7.6, soil.ph + 0.6))
			msg = "Added lime: limestone neutralizes acid and raises pH."
			next = Js.with(tile, {"soil": soil})
		"biochar":
			soil.water = _clamp(soil.water + 8)
			soil.om = _clamp(soil.om + 3)
			msg = "Mixed in biochar: its tiny pores hold water and nutrients for a very long time."
			next = Js.with(tile, {"soil": soil})
		"synthFert":
			soil.nutrients = _clamp(soil.nutrients + 20)
			soil.life = _clamp(soil.life - 4)
			soil.ph = Js.r1(soil.ph - 0.2)
			msg = "Synthetic fertilizer: quick nutrients, but soil life dropped and the garden is no longer certified organic."
			next = Js.with(tile, {"soil": soil})
	s = _set_tile(s, x, y, func(_tt): return next)
	if Items.get_def(id).get("notOrganic", false):
		s = Js.with(s, {"organic": false})
	# Amendments also raise the grade of the next harvest from this spot.
	var points := Grades.amendment_points(id, t)
	var before: float = t.get("boost", 0)
	var after := minf(Grades.MAX_BOOST, before + points)
	if after > before:
		s = _set_tile(s, x, y, func(tt): return Js.with(tt, {"boost": after}))
		msg += " Crop grade bonus +%s." % Js.num(after - before)
	return say(s, msg)


# ───────────────────────── interact ─────────────────────────

## Which menu the facing tile opens, if any: house, store, shipping, board, or "".
static func interact_target(state: Dictionary) -> String:
	var f := facing_tile(state)
	var b = building_at(state, f.x, f.y)
	if b == null:
		return ""
	match b.kind:
		"house":
			return "house"
		"store":
			return "store"
		"shippingBin":
			return "shipping"
		"noticeBoard":
			return "board"
	return ""


static func interact(state: Dictionary) -> Dictionary:
	var f := facing_tile(state)
	var x: int = f.x
	var y: int = f.y
	var t = tile_at(state, x, y)
	if t == null:
		return state
	var critter = _crit_at(state, x, y)
	if critter != null:
		return discover(Js.with(state, {"critters": state.critters.filter(func(c): return c.id != critter.id)}), critter.kind)
	var b = building_at(state, x, y)
	if b != null:
		return _operate_building(state, b)
	if t.ground == "water":
		return discover(say(Js.with(state, {"water": state.canSize}), "Filled your watering can at the pond."), "pond-life")
	var c = t.crop
	if c and c.dead:
		var got = add_item(_set_tile(state, x, y, func(tt): return Js.with(tt, {"crop": null})), "fiber", 1)
		return say(got, "Cleared a dead plant (+1 fiber).") if got else state
	if c and c.growth >= 1:
		return harvest(state, x, y)
	if c:
		var pct := Js.round(c.growth * 100)
		return say(state, "%s: %s%% grown.%s" % [Items.crop(c.id).name, Js.num(pct), " Pests are on it!" if c.pests else ""])
	return state


static func harvest(state: Dictionary, x: int, y: int) -> Dictionary:
	var i := WorldMap.idx(x, y)
	var t: Dictionary = state.tiles[i]
	var c: Dictionary = t.crop
	var info := Items.crop(c.id)
	var wc := Items.world_crop(c.id)
	var gives: Dictionary = info.gives
	var nutrients_on := Settings.on(state, "nutrients")
	var rotation_penalty := 2 if Settings.on(state, "rotation") and t.familyStreak >= 1 else 0
	var apply_gives := func(soil: Dictionary) -> Dictionary:
		return Js.with(soil, {
			"nutrients": _clamp(soil.nutrients - info.nutrientUse * 1.2 - rotation_penalty + gives.get("nutrients", 0)) if nutrients_on else soil.nutrients,
			"om": _clamp(soil.om + gives.get("om", 0)),
			"structure": _clamp(soil.structure + gives.get("structure", 0)),
			"life": _clamp(soil.life + gives.get("life", 0)),
		})
	if wc.get("cover", false):
		var s := _set_tile(state, x, y, func(tt): return Js.with(tt, {"crop": null, "lastFamily": info.family, "soil": apply_gives.call(tt.soil)}))
		return discover(say(s, "Dug the clover into the soil as green manure: more nitrogen and organic matter!"), "nitrogen-fixation")
	var grade: String = Grades.expected_grade(state, t).grade
	var qty := Grades.harvest_amount(state, i, c.id, grade)
	var got = add_item(state, "crop_" + c.id, qty, grade)
	if got == null:
		return say(state, "Your bag is full.")
	var regrows: bool = wc.get("regrowDays") and c.harvests < 3
	var s := _set_tile(got, x, y, func(tt): return Js.with(tt, {
		"crop": Js.with(c, {"growth": 0, "harvests": c.harvests + 1, "stress": 0}) if regrows else null,
		"lastFamily": info.family,
		"soil": apply_gives.call(tt.soil),
		# Amendments are used up by the harvest; a crop that keeps producing keeps half.
		"boost": floorf(tt.get("boost", 0) / 2.0) if regrows else 0,
	}))
	var done := say(Js.with(s, {"harvests": s.harvests + 1}), "Harvested %d %s · Grade %s!%s" % [qty, info.name, grade, " It will grow more." if regrows else ""])
	return discover(done, "nitrogen-fixation") if info.family == "legume" else done


static func _operate_building(state: Dictionary, b: Dictionary) -> Dictionary:
	var update := func(data: Dictionary) -> Dictionary:
		return Js.with(state, {"buildings": state.buildings.map(func(o): return Js.with(o, {"data": data}) if o.id == b.id else o)})
	var data: Dictionary = b.data
	match b.kind:
		"composter":
			if data.get("ready", 0) > 0:
				var got = add_item(update.call(Js.with(data, {"ready": 0})), "compost", int(data.ready))
				return say(got, "Collected %s compost!" % Js.num(data.ready)) if got else say(state, "Your bag is full.")
			var fiber := count_item(state, "fiber")
			if fiber == 0:
				return say(state, "Compost bin: %s fiber inside. Add plant fiber from weeds." % Js.num(data.get("fiber", 0)))
			var add := mini(fiber, 20 - int(data.get("fiber", 0)))
			if add <= 0:
				return say(state, "The bin is full. Wait for the decomposers.")
			var started = data.get("startedDay")
			var s = remove_item(update.call(Js.with(data, {"fiber": data.get("fiber", 0) + add, "startedDay": started if started != null else day(state)})), "fiber", add)
			return discover(say(s, "Added %d fiber. Bacteria and fungi will break it down (every 5 fiber makes 1 compost in 2 days)." % add), "decomposers")
		"rainBarrel":
			return _refill_from_barrel(state, b)
		"extension":
			return say(state, "The County Extension Office: free soil advice and testing. Dr. Okafor is usually out front.")
		"cottage":
			var note := "A jar-shaped sign reads: \"Honey for sale. Ask June.\"" if data.get("owner") == "june" else "Nobody answers. They must be out working."
			return say(state, "You knock on the door. " + note)
		"fountain":
			return say(state, "The fountain is cool and clear. A frog blinks at you from the edge.")
		"beehive":
			if data.get("owner"):
				return discover(say(state, "This is June's hive. The bees pollinate the whole community garden."), "honeybee")
			if data.get("ready"):
				var got = add_item(update.call(Js.with(data, {"ready": 0})), "honey", 1)
				return discover(say(got, "Collected honey! 🍯"), "honeybee") if got else state
			return discover(say(state, "The bees are busy. Plant flowers like sunflowers, buckwheat, or clover within 5 steps for honey."), "honeybee")
	return state


# ───────────────────────── shop ─────────────────────────

static func buy(state: Dictionary, id: String, qty := 1) -> Dictionary:
	var price = Data.upgrades().bigCan.price if id == "bigCan" else Items.get_def(id).get("price")
	if price == null:
		return say(state, "The store doesn't sell that.")
	var total: float = price * qty
	if state.coins < total:
		return say(state, "Not enough coins.")
	if id == "bigCan":
		if state.canSize >= 40:
			return say(state, "You already have the bigger can.")
		return say(Js.with(state, {"coins": state.coins - total, "canSize": 40, "water": 40}), "Upgraded to the copper watering can!")
	var got = add_item(state, id, qty)
	if got == null:
		return say(state, "Your bag is full.")
	return say(Js.with(got, {"coins": state.coins - total}), "Bought %d %s." % [qty, Items.get_def(id).name])


static func sell_now(state: Dictionary, slot_index: int, qty: int) -> Dictionary:
	var s = state.inventory[slot_index]
	if s == null:
		return state
	var def := Items.get_def(s.item)
	if not def.get("sell"):
		return say(state, "The store won't buy that.")
	var n := mini(qty, int(s.qty))
	var inv: Array = state.inventory.duplicate()
	inv[slot_index] = Js.with(s, {"qty": s.qty - n}) if s.qty - n > 0 else null
	var coins := Items.sell_price(def, s.get("grade"), state.organic) * n
	var grade = s.get("grade")
	return say(Js.with(state, {"inventory": inv, "coins": state.coins + coins}), "Sold %d %s%s for %s coins." % [n, def.name, " (grade %s)" % grade if grade else "", Js.num(coins)])


static func ship(state: Dictionary, slot_index: int) -> Dictionary:
	var s = state.inventory[slot_index]
	if s == null:
		return state
	var def := Items.get_def(s.item)
	if not def.get("sell"):
		return say(state, "That can't be shipped.")
	var inv: Array = state.inventory.duplicate()
	inv[slot_index] = null
	var same := func(o): return o.item == s.item and o.get("grade") == s.get("grade")
	var shipping: Array
	if state.shipping.any(same):
		shipping = state.shipping.map(func(o): return Js.with(o, {"qty": o.qty + s.qty}) if same.call(o) else o)
	else:
		shipping = state.shipping + [s.duplicate()]
	return say(Js.with(state, {"inventory": inv, "shipping": shipping}), "Put %s %s in the shipping bin. You'll be paid overnight." % [Js.num(s.qty), def.name])


# ───────────────────────── building ─────────────────────────

## Why a building can't go here, or "" if it can.
static func can_place(state: Dictionary, kind: String, x: int, y: int) -> String:
	var sz := WorldMap.size_of(kind)
	var p := player_tile(state)
	for yy in range(y, y + sz[1]):
		for xx in range(x, x + sz[0]):
			var t = tile_at(state, xx, yy)
			if t == null:
				return "Too close to the edge."
			if xx >= WorldMap.FARM_W:
				return "Build on your own farm, not in town."
			if t.ground == "water" or t.ground == "forest":
				return "Can't build on water or in the forest."
			if t.obstacle:
				return "Clear the %s first." % t.obstacle
			if t.crop:
				return "Something is planted there."
			if building_at(state, xx, yy) != null:
				return "Something is already built there."
			if p.x == xx and p.y == yy:
				return "You're standing there."
	return ""


## Top-left corner for a building placed on the facing tile, so big buildings sit in front of the player.
static func placement_for(state: Dictionary, kind: String, x: int, y: int) -> Dictionary:
	var sz := WorldMap.size_of(kind)
	var w: int = sz[0]
	var h: int = sz[1]
	var f: String = state.player.facing
	var ox := x - (w - 1) if f == "left" else (x if f == "right" else x - (w - 1) / 2)
	var oy := y - (h - 1) if f == "up" else (y if f == "down" else y - (h - 1) / 2)
	return {"x": ox, "y": oy}


static func place_building(state: Dictionary, slot_index: int, x: int, y: int) -> Dictionary:
	var s = state.inventory[slot_index]
	if s == null:
		return state
	var def := Items.get_def(s.item)
	if not def.get("building"):
		return state
	var kind: String = def.building
	var o := placement_for(state, kind, x, y)
	var reason := can_place(state, kind, o.x, o.y)
	if reason:
		return say(state, reason)
	var next: Dictionary = remove_item(state, s.item, 1)
	var b := {"id": "%s-%s-%d-%d" % [kind, Js.num(state.minute), o.x, o.y], "kind": kind, "x": o.x, "y": o.y, "data": {"water": 0} if kind == "rainBarrel" else {}}
	next = Js.with(next, {"buildings": next.buildings + [b]})
	if kind == "greenhouse":
		for p in WorldMap.greenhouse_interior(b):
			next = _set_tile(next, p.x, p.y, func(t): return Js.with(t, {"greenhouse": true, "ground": "farm", "weeds": false, "obstacle": null}))
	next = say(next, "Built a %s!" % def.name)
	return discover(next, "greenhouse-effect") if kind == "greenhouse" else next


static func pick_up_building(state: Dictionary, id: String) -> Dictionary:
	var b = null
	for o in state.buildings:
		if o.id == id:
			b = o
			break
	if b == null or b.kind in WorldMap.TOWN_KINDS or b.data.get("owner"):
		return state
	if b.kind == "greenhouse" and WorldMap.greenhouse_interior(b).any(func(p): return state.tiles[WorldMap.idx(p.x, p.y)].crop != null):
		return say(state, "Harvest or clear the greenhouse beds first.")
	var kit: String = "kit_" + b.kind
	var got = add_item(state, kit, 1)
	if got == null:
		return say(state, "Your bag is full.")
	var next := Js.with(got, {"buildings": got.buildings.filter(func(o): return o.id != id)})
	if b.kind == "greenhouse":
		for p in WorldMap.greenhouse_interior(b):
			next = _set_tile(next, p.x, p.y, func(t): return Js.with(t, {"greenhouse": false}))
	return say(next, "Picked up the %s." % Items.get_def(kit).name)


# ───────────────────────── journal ─────────────────────────

static func journal_entry(id: String) -> Variant:
	for e in Data.journal().entries:
		if e.id == id:
			return e
	return null


static func discover(state: Dictionary, id: String) -> Dictionary:
	if id in state.journal:
		return state
	var e = journal_entry(id)
	return say(Js.with(state, {"journal": state.journal + [id]}), "📓 New Nature Journal page: %s!" % (e.name if e else id))


static func _discover_if(state: Dictionary, cond: bool, id: String) -> Dictionary:
	return discover(state, id) if cond else state


# ───────────────────────── movement ─────────────────────────

const R := 0.3


## Move the player by (dx, dy) tiles, sliding along walls. Returns the new player.
static func move_player(state: Dictionary, dx: float, dy: float) -> Dictionary:
	var p: Dictionary = state.player
	var free := func(x: float, y: float) -> bool:
		for o in [[-R, -R], [R, -R], [-R, R], [R, R]]:
			if not is_walkable(state, int(Js.round(x + o[0])), int(Js.round(y + o[1]))):
				return false
		return true
	var x: float = p.x
	var y: float = p.y
	if dx and free.call(x + dx, y):
		x += dx
	if dy and free.call(x, y + dy):
		y += dy
	var facing: String = p.facing
	if absf(dx) > absf(dy):
		facing = "right" if dx > 0 else "left"
	elif dy != 0:
		facing = "down" if dy > 0 else "up"
	return {"x": x, "y": y, "facing": facing}


static func swap_slots(state: Dictionary, a: int, b: int) -> Dictionary:
	var inv: Array = state.inventory.duplicate()
	var tmp = inv[a]
	inv[a] = inv[b]
	inv[b] = tmp
	return Js.with(state, {"inventory": inv})


# ───────────────────────── saves ─────────────────────────

## Saves from before the town: keep the farm, rebuild the map at the new size, and add the town.
static func _add_town(old: Dictionary) -> Dictionary:
	var old_w: int = old.tiles.size() / WorldMap.H
	var fresh := WorldMap.create_map(int(old.seed))
	var tiles := []
	for i in WorldMap.W * WorldMap.H:
		var x := i % WorldMap.W
		var y := i / WorldMap.W
		tiles.append(old.tiles[y * old_w + x] if x < WorldMap.FARM_W and x < old_w else fresh.tiles[i])
	# The store moved into town; the farm keeps everything you built.
	var farm: Array = old.buildings.filter(func(b): return b.kind != "store" and b.x < WorldMap.FARM_W)
	var town: Array = fresh.buildings.filter(func(b): return not farm.any(func(f): return f.id == b.id))
	return Js.with(old, {"version": WORLD_VERSION, "tiles": tiles, "buildings": farm + town})


## Version 1 saves had no settings and stored weather as a plain label.
static func _migrate_v1(old: Dictionary) -> Dictionary:
	var settings := Settings.normalize(null)
	var d := Clock.day_of(old.minute)
	var seed := int(old.seed)
	return Js.with(old, {
		"version": 2,
		"settings": settings,
		"weather": {str(d): Weather.weather_for(seed, d, settings), str(d + 1): Weather.weather_for(seed, d + 1, settings)},
	})


static func save_world(state: Dictionary) -> String:
	return Js.stringify(state)


## Parse a save (any version), upgrading old ones. Null if it can't be read.
static func load_world(raw: String) -> Variant:
	if raw == "":
		return null
	var json := JSON.new()
	if json.parse(raw) != OK:
		return null
	var s = json.data
	if not s is Dictionary or not s.get("tiles") is Array:
		return null
	var version = s.get("version")
	if not (typeof(version) == TYPE_FLOAT or typeof(version) == TYPE_INT) or version < 1 or version > WORLD_VERSION:
		return null
	var up: Dictionary = _migrate_v1(s) if version == 1 else s
	# Version 4 grew the map east to add the town.
	if up.version < 4:
		up = _add_town(up)
	if up.tiles.size() != WorldMap.W * WorldMap.H:
		return null
	# Version 3 added crop grades: older tiles have no amendment points, crops no stress.
	if up.version != WORLD_VERSION:
		return null
	up = Js.with(up, {"settings": Settings.normalize(up.get("settings"))})
	_normalize_numbers(up)
	return up


## JSON numbers arrive as floats; the engine uses ints for these.
static func _normalize_numbers(s: Dictionary) -> void:
	s.seed = int(s.seed)
	s.minute = int(s.minute)
	s.selected = int(s.selected)
