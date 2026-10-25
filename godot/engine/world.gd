class_name World
## Port of src/world/engine.ts. The world is a Dictionary in the exact shape of the save JSON,
## and every function returns a new world instead of changing the one it's given.

const WORLD_VERSION := 11
const INVENTORY_SIZE := 30
const HOTBAR_SIZE := 10
const MAX_ENERGY := 100
const ORGANIC_BONUS := 1.25

const DIRS := {"up": [0, -1], "down": [0, 1], "left": [-1, 0], "right": [1, 0]}
const ENERGY := {"hoe": 2, "can": 1, "scythe": 1, "axe": 2, "pickaxe": 2, "shovel": 2, "ring": 1, "rod": 3}
## How many swings' worth of power it takes to clear each obstacle (a basic tool does 1 a swing).
const OBSTACLE_HP := {
	"stick": 1, "sapling": 1, "stone": 2, "log": 4, "stump": 5, "tree": 8,
	"copperOre": 3, "tinOre": 3, "ironOre": 5, "goldOre": 6, "mithrilOre": 9,
}
## Rocks you break with a pickaxe (the rest are wood, for the axe).
const ROCKS := ["stone", "copperOre", "tinOre", "ironOre", "goldOre", "mithrilOre"]
## Wood from chopping each one.
const WOOD := {"stick": 1, "sapling": 1, "log": 4, "stump": 3, "tree": 6}
## Days for a felled tree's stump to sprout, and for the sapling to grow back into a tree.
const REGROW_DAYS := 7
const DRY := {"sunny": 1.2, "cloudy": 0.6, "fog": 0.4, "heat": 2.4, "frost": 0.5, "snow": 0.2, "rain": 0.0, "storm": 0.0}

static func _clamp(v: float) -> float:
	return Js.clamp100(v)


# ───────────────────────── setup ─────────────────────────

## Grandma Rosa's lessons, the tutorial (see quests.gd). A new farm starts on the first.
const LESSONS := ["lesson-1", "lesson-2", "lesson-3", "lesson-4", "lesson-5", "lesson-6", "lesson-7", "lesson-8", "lesson-9", "lesson-10"]


## Count something the player did, for lessons that ask you to do it a few times.
static func tally(state: Dictionary, key: String, n := 1) -> Dictionary:
	var t: Dictionary = state.get("tally", {}).duplicate() if state.get("tally") is Dictionary else {}
	t[key] = t.get(key, 0) + n
	return Js.with(state, {"tally": t})


static func new_world(seed: int, settings: Variant = null) -> Dictionary:
	var cfg := Settings.normalize(settings)
	var m := WorldMap.create_map(seed)
	# You start empty-handed: Grandma Rosa's tools wait in the chest by the house.
	var inventory := []
	inventory.resize(INVENTORY_SIZE)
	var start := Data.starter_chest()
	for b in m.buildings:
		if b.kind == "chest":
			for i in start.size():
				b.data.items[i] = {"item": start[i].item, "qty": int(start[i].qty)}
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
		"plots": [0],
		"quests": {"active": [{"id": LESSONS[0], "accepted": Clock.day_of(Clock.start_of_day(1)), "step": 0}], "done": []},
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
	var m = state.get("mine")
	if m != null:
		return m.tiles[y * WorldMap.MINE_W + x] if x >= 0 and y >= 0 and x < WorldMap.MINE_W and y < WorldMap.MINE_H else null
	return state.tiles[WorldMap.idx(x, y)] if WorldMap.in_bounds(x, y) else null


## The buildings where the player is: the farm and town, or the ladders on a mine floor.
static func buildings_here(state: Dictionary) -> Array:
	var m = state.get("mine")
	return m.buildings if m != null else state.buildings


static func building_at(state: Dictionary, x: int, y: int) -> Variant:
	for b in buildings_here(state):
		var sz := WorldMap.size_of(b.kind)
		if x >= b.x and x < b.x + sz[0] and y >= b.y and y < b.y + sz[1]:
			return b
	return null


## Ponds, the river, and the sea.
static func is_water(g: String) -> bool:
	return g == "water" or g == "river" or g == "sea"


## Can the player stand on this tile?
static func is_walkable(state: Dictionary, x: int, y: int) -> bool:
	var t = tile_at(state, x, y)
	if t == null or is_water(t.ground) or t.ground == "caveWall":
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


## Can you step from one tile to the next? Only on the level, or up or down one terrace by a
## trail ramp: the mountain's cliffs are too steep to climb.
static func can_step(state: Dictionary, ax: int, ay: int, bx: int, by: int) -> bool:
	var a = tile_at(state, ax, ay)
	var b = tile_at(state, bx, by)
	if a == null or b == null:
		return false
	var ea := int(a.get("elev", 0))
	var eb := int(b.get("elev", 0))
	if ea == eb:
		return true
	if absi(ea - eb) != 1:
		return false
	return bool((a if ea > eb else b).get("ramp", false))


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


## In a recipe, "anyFish" takes whichever fish you have.
static func _matches(s: Variant, id: String, grade: Variant) -> bool:
	if s == null:
		return false
	var hit: bool
	if id == "anyFish":
		var def = Data.items().get(s.item)
		hit = def != null and def.kind == "fish"
	else:
		hit = s.item == id
	return hit and (grade == null or s.get("grade") == grade)


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
	var m = state.get("mine")
	if m != null:
		var mt: Array = m.tiles.duplicate()
		var k := y * WorldMap.MINE_W + x
		mt[k] = fn.call(mt[k])
		return Js.with(state, {"mine": Js.with(m, {"tiles": mt})})
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
	return _stall_sales(Js.with(state, {"tiles": tiles}))


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
		# Felled trees sprout from their stumps, then grow back.
		if next.get("regrow") != null and new_day >= next.regrow:
			var was = next.obstacle
			next = next.duplicate()
			next.erase("regrow")
			next.erase("hits")
			if was == "stump":
				next.obstacle = "sapling"
				next.regrow = new_day + REGROW_DAYS
			elif was == "sapling":
				next.obstacle = "tree"
		# Weeds sprout on bare farm soil; where something is planted, they can't take hold.
		if Settings.on(state, "weeds") and next.ground == "farm" and not next.greenhouse and not next.weeds and not next.obstacle and not next.mulch and building_at(state, x, y) == null:
			var chance := 0.0 if next.crop else (0.01 if season == "Winter" else (0.08 if next.tilled else 0.12))
			if rand.next() < chance:
				next = Js.with(next, {"weeds": true})
				new_weeds += 1
		# Pests find crops grown in the same family again and again.
		var cc = next.crop
		if Settings.on(state, "pests") and cc and not cc.dead and not cc.pests:
			# Ladybugs, birds, and hens all eat pests.
			var guarded := _near(state, x, y, ["bugHotel", "birdHouse", "chickenCoop"], 6)
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
		if b.kind == "chickenCoop":
			# Two eggs a morning (the nest box holds six), and every 3 days the manure has composted.
			var last_manure: float = data.get("manureDay", new_day)
			var composted := new_day - last_manure >= 3
			buildings.append(Js.with(b, {"data": Js.with(data, {
				"eggs": minf(6, data.get("eggs", 0) + 2),
				"ready": minf(5, data.get("ready", 0) + (1 if composted else 0)),
				"manureDay": new_day if composted else last_manure,
			})}))
			continue
		if b.kind == "smallBarn":
			buildings.append(Js.with(b, {"data": Js.with(data, {"ready": minf(3, data.get("ready", 0) + 1)})}))
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
		notes.append("%d new weed%s sprouted on bare soil. Plant it, mulch it, or sow a cover crop to keep weeds out." % [new_weeds, "s" if new_weeds > 1 else ""])
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
	var s := _surface(_start_day(_run_night(tally(state, "slept")), d))
	return Js.with(s, {
		"energy": Js.round(s.maxEnergy * 0.8) if late else s.maxEnergy,
		"player": {"x": 10, "y": 9, "facing": "down"},
	})


static func _faint(state: Dictionary) -> Dictionary:
	var lost := minf(100, Js.round(state.coins * 0.1))
	var d := day(Js.with(state, {"minute": state.minute - 1})) + 1
	var s := _surface(_start_day(Js.with(state, {"minute": Clock.start_of_day(d) - 1}), d))
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


## Critters live up on the farm; there are none underground.
static func _crit_at(state: Dictionary, x: int, y: int) -> Variant:
	if state.get("mine") != null:
		return null
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
	# Ladders, the mine entrance, and Grandma's barn work with whatever you're holding.
	var lb = building_at(state, f.x, f.y)
	if lb != null and (lb.kind in ["ladderUp", "ladderDown", "mineEntrance"] or (lb.kind == "barn" and not lb.data.get("owner"))):
		return interact(state)
	var slot = selected_item(state)
	var def = Data.items()[slot.item] if slot else null
	var c = t.crop
	if c and not c.dead and c.growth >= 1 and (def == null or def.kind != "amendment"):
		return harvest(state, f.x, f.y)
	return apply_tool(state)


## Use the selected item on the tile in front of the player.
## A tool's uses left (full when the slot doesn't say), or null for things that don't wear.
static func durability(slot: Dictionary) -> Variant:
	var def = Data.items().get(slot.item)
	if def == null or not def.get("tool"):
		return null
	var mx := int(def.tool.durability)
	return {"left": int(slot.get("dur", mx)), "max": mx}


## Use up one use of the selected tool; it breaks when it runs out.
static func _wear(state: Dictionary, i: int) -> Dictionary:
	var slot = state.inventory[i]
	if slot == null:
		return state
	var d = durability(slot)
	if d == null:
		return state
	var inv: Array = state.inventory.duplicate()
	if d.left > 1:
		inv[i] = Js.with(slot, {"dur": d.left - 1})
		return Js.with(state, {"inventory": inv})
	inv[i] = null
	return say(Js.with(state, {"inventory": inv}), "Your %s wore out! Buy or craft a new one." % Items.get_def(slot.item).name.to_lower())


## Without the hits and regrow marks: a tile whose obstacle is gone.
static func _cleared(t: Dictionary) -> Dictionary:
	var out := Js.with(t, {"obstacle": null})
	out.erase("hits")
	out.erase("regrow")
	return out


## "stone", "log", or "copper ore rock".
static func obstacle_name(o: String) -> String:
	return "%s rock" % Items.get_def(o).name.to_lower() if o.ends_with("Ore") else o


## A rock breaks: stone or ore, and maybe the ladder down that was hiding under it.
static func _break_rock(state: Dictionary, x: int, y: int, o: String) -> Dictionary:
	var qty := 1 if o == "stone" or o == "mithrilOre" else 1 + (x + y) % 2
	var got = add_item(_set_tile(state, x, y, _cleared), o, qty)
	if got == null:
		return say(state, "Your bag is full.")
	var s := say(got, "+%d %s." % [qty, Items.get_def(o).name.to_lower()])
	if o != "stone":
		s = discover(s, o)
	var m = s.get("mine")
	if m != null and int(m.ladderAt) == y * WorldMap.MINE_W + x:
		s = Js.with(s, {"mine": Js.with(m, {"buildings": m.buildings + [{"id": "ladder-down", "kind": "ladderDown", "x": x, "y": y, "data": {}}]})})
		s = say(s, "You found a ladder going down!")
	return s


## One swing of an axe or pickaxe at the obstacle in front of you.
static func _hit_obstacle(state: Dictionary, x: int, y: int, power: int, verb: String) -> Dictionary:
	var t: Dictionary = tile_at(state, x, y)
	var o: String = t.obstacle
	var hits: int = int(t.get("hits", 0)) + power
	var hp: int = OBSTACLE_HP[o]
	if hits < hp:
		return say(_set_tile(state, x, y, func(tt): return Js.with(tt, {"hits": hits})), "%s! The %s is %s%% broken." % [verb, obstacle_name(o), Js.num(Js.round(float(hits) / hp * 100))])
	if o in ROCKS:
		return _break_rock(state, x, y, o)
	var wood: int = WOOD.get(o, 1)
	if o == "tree":
		# A felled tree leaves a stump that sprouts again, unless it's in the garden field.
		var f: Dictionary = WorldMap.FARM
		var in_field: bool = x >= f.x0 and x <= f.x1 and y >= f.y0 and y <= f.y1
		var regrow := day(state) + REGROW_DAYS
		var got = add_item(_set_tile(state, x, y, func(tt):
			var out := Js.with(tt, {"obstacle": "stump"})
			out.erase("hits")
			out.erase("regrow")
			if not in_field:
				out.regrow = regrow
			return out), "wood", wood)
		if got == null:
			return say(state, "Your bag is full.")
		return discover(say(got, "Timber! +%d wood.%s" % [wood, "" if in_field else " The stump will sprout again unless you chop it out."]), "forest-regrowth")
	var got = add_item(_set_tile(state, x, y, _cleared), "wood", wood)
	return say(got, "+%d wood." % wood) if got else say(state, "Your bag is full.")


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
	if def.kind == "food":
		return eat(state, int(state.selected))
	if plot_locked(state, x, y):
		return say(state, "This plot isn't yours yet. Press E to see its price.")

	if def.kind == "kit":
		return place_building(state, int(state.selected), x, y)
	if def.kind == "seed":
		return plant(state, x, y, def.crop)
	if def.kind == "amendment":
		return apply_amendment(state, x, y, slot.item)
	if def.kind != "tool":
		return interact(state)

	var use: String = def.tool.use
	var power: int = int(Data.tiers()[def.tool.tier].power)
	var b = building_at(state, x, y)
	var spent = _spend(state, ENERGY[use])
	if spent == null:
		return say(state, "You're too tired. Go home and sleep.")
	# Every use that does something wears the tool a little.
	var paid := _wear(spent, int(state.selected))
	var tillage := Settings.on(state, "tillage")

	match use:
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
			var tilled := _set_tile(tally(paid, "tilled"), x, y, func(tt):
				var soil: Dictionary = tt.soil
				if tillage:
					soil = Js.with(soil, {"structure": _clamp(soil.structure - 2), "om": _clamp(soil.om - 0.5), "life": _clamp(soil.life - 1)})
				return Js.with(tt, {"tilled": true, "soil": soil}))
			return say(tilled, "Tilled! (Each tilling breaks soil crumbs a little, so only till where you'll plant.)" if tillage else "Tilled!")
		"can":
			if t.ground == "sea":
				return say(state, "Sea water is salty: it would dry out your plants' roots. Fill up at the pond or the river.")
			if is_water(t.ground):
				return say(Js.with(paid, {"water": state.canSize}), "Filled your watering can at the %s." % ("river" if t.ground == "river" else "pond"))
			if b and b.kind == "rainBarrel":
				return _refill_from_barrel(paid, b)
			if b and b.kind == "well":
				return _from_well(paid)
			if state.water <= 0:
				return say(state, "Your watering can is empty. Refill it at the pond or a rain barrel.")
			if not t.tilled:
				return say(state, "Water tilled soil or crops.")
			# Each pour soaks the soil part way; keep pouring and it gets waterlogged.
			return _set_tile(Js.with(paid, {"water": state.water - 1}), x, y, func(tt): return Js.with(tt, {"moisture": _clamp(tt.moisture + 45)}))
		"scythe":
			if t.weeds:
				var got = add_item(_set_tile(tally(paid, "weeds"), x, y, func(tt): return Js.with(tt, {"weeds": false})), "fiber", 1)
				return say(got, "Cut weeds (+1 fiber).") if got else say(state, "Your bag is full.")
			if t.crop and t.crop.dead:
				var got = add_item(_set_tile(paid, x, y, func(tt): return Js.with(tt, {"crop": null})), "fiber", 1)
				return say(got, "Cleared a dead plant (+1 fiber).") if got else state
			return state
		"axe":
			if not t.obstacle or t.obstacle in ROCKS:
				return state
			return _hit_obstacle(paid, x, y, power, "Chop")
		"pickaxe":
			if t.obstacle and t.obstacle in ROCKS:
				return _hit_obstacle(paid, x, y, power, "Crack")
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
		"rod":
			var water := water_at(t.ground)
			if water == "":
				return say(state, "Face the water to cast: the river, a pond, or the sea.")
			return _cast_line(paid, x, y, water)
	return state


# ───────────────────────── fishing ─────────────────────────

## Which kind of water a tile is, for fishing ("river", "sea", "pond", or "").
static func water_at(g: String) -> String:
	return "river" if g == "river" else ("sea" if g == "sea" else ("pond" if g == "water" else ""))


static func _hour_now(state: Dictionary) -> int:
	return int(floorf(Clock.time_of_day(state.minute) / 60.0)) % 24


static func _in_hours(h: int, hours: Array) -> bool:
	var from := int(hours[0])
	var to := int(hours[1])
	return (h >= from and h < to) if from <= to else (h >= from or h < to)


## What could bite here, now: the catches of this water that like the season and the hour.
static func biting_now(state: Dictionary, water: String) -> Array:
	var season := season_now(state)
	var hour := _hour_now(state)
	var out := []
	for c in Data.catches():
		if c.water != water:
			continue
		if c.get("seasons") != null and state.settings.seasons and not season in c.seasons:
			continue
		if c.get("hours") != null and not _in_hours(hour, c.hours):
			continue
		out.append(c)
	return out


## The chance of a bite: fish feed in the rain, hide from storms, and sulk in the midday heat.
static func bite_chance(state: Dictionary) -> float:
	var w := today_weather(state)
	var hour := _hour_now(state)
	if w == "storm":
		return 0.2
	if w == "rain" or w == "cloudy" or w == "fog":
		return 0.6
	if (w == "heat" or w == "sunny") and hour >= 11 and hour < 15:
		return 0.3
	return 0.45


## One cast: a seeded roll on the spot, the minute, and how many casts you've made.
static func _cast_line(state: Dictionary, x: int, y: int, water: String) -> Dictionary:
	var casts := 0
	if state.get("tally") is Dictionary:
		casts = int(state.tally.get("casts", 0))
	var roll := Rng.stream(int(state.seed) ^ U32.imul(int(state.minute) + 1, 0x2c1b3c6d) ^ U32.imul(y * WorldMap.W + x + 1, 0x297a2d39) ^ U32.imul(casts + 1, 0x9e3779b1))
	var s := tally(state, "casts")
	var pool := biting_now(state, water)
	if pool.is_empty() or roll.next() >= bite_chance(state):
		return say(s, "Nothing's biting. Try another spot, another time of day, or another season.")
	var total := 0.0
	for c in pool:
		total += c.weight
	var r := roll.next() * total
	var caught: Dictionary = pool[pool.size() - 1]
	for c in pool:
		r -= c.weight
		if r < 0:
			caught = c
			break
	var got = add_item(s, caught.id, 1)
	if got == null:
		return say(s, "A fish bit, but your bag is full!")
	var landed := tally(got, "fished")
	return discover(say(landed, "You caught a %s!" % Items.get_def(caught.id).name), caught.id)


static func _from_well(state: Dictionary) -> Dictionary:
	return discover(say(Js.with(state, {"water": state.canSize}), "Filled your watering can from the well: groundwater, soaked up from rain over many years."), "groundwater")


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
		return "plot" if plot_locked(state, f.x, f.y) else ""
	match b.kind:
		"house":
			return "house"
		"store":
			return "store"
		"shippingBin":
			return "shipping"
		"noticeBoard":
			return "board"
		"chest":
			return "chest"
		"gardenGate":
			return "gate"
		"marketStall":
			return "stall"
		"signpost":
			return "travel"
		"fishingHut":
			return "hut"
		"mineEntrance":
			# Once you've been deep enough, the mine cart at the entrance can take you down.
			if mine_open(state) and int(state.get("deepest", 0)) >= 5:
				return "mine"
	if STATIONS.has(b.kind):
		return "craft"
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
	if t.ground == "sea":
		return say(state, "The waves roll in, cold and salty. Sea water is no good for the garden.")
	if t.ground == "river":
		return say(Js.with(state, {"water": state.canSize}), "Filled your watering can at the river.")
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
		"well":
			return _from_well(state)
		"chickenCoop":
			var eggs := int(data.get("eggs", 0))
			var manure := int(data.get("ready", 0))
			if not eggs and not manure:
				return discover(say(state, "The hens are scratching for bugs. Come back in the morning for eggs."), "hen")
			var got = update.call(Js.with(data, {"eggs": 0, "ready": 0}))
			if eggs:
				got = add_item(got, "egg", eggs) if got != null else null
			if manure:
				got = add_item(got, "compost", manure) if got != null else null
			if got == null:
				return say(state, "Your bag is full.")
			var parts := []
			if eggs:
				parts.append("%d egg%s" % [eggs, "s" if eggs > 1 else ""])
			if manure:
				parts.append("%d compost from composted manure" % manure)
			return discover(say(got, "Collected %s." % " and ".join(parts)), "hen")
		"smallBarn":
			var hay := int(data.get("ready", 0))
			if not hay:
				return say(state, "The barn is stacked with hay. Old hay turns into straw mulch each morning.")
			var got = add_item(update.call(Js.with(data, {"ready": 0})), "mulch", hay)
			return say(got, "Collected %d straw mulch from the barn." % hay) if got != null else say(state, "Your bag is full.")
		"barn":
			if data.get("owner"):
				return say(state, "The Ortegas' barn smells like hay and corn.")
			if state.get("foundWorkbench"):
				return say(state, "Grandma Rosa's old barn. Swallows nest in the rafters.")
			# Under a dusty tarp in the barn: Grandma's workbench.
			var wb = add_item(state, "kit_workbench", 1)
			if wb == null:
				return say(state, "Something big is under a tarp in the barn. Make room in your bag to carry it.")
			return say(Js.with(wb, {"foundWorkbench": true}), "Under a dusty tarp in the barn you find Grandma Rosa's old workbench! Set it up on the farm to start crafting.")
		"chest":
			return say(state, "Grandma Rosa's old chest. Open it to store things or take them out.")
		"mineEntrance":
			if not mine_open(state):
				return say(state, "Old boards cover the mine entrance. Luis might know something about it.")
			return enter_mine(state, 1)
		"ladderDown":
			return enter_mine(state, int(state.mine.floor) + 1)
		"ladderUp":
			return leave_mine(state)
		"silo":
			return say(state, "A tall silo for storing grain through the winter.")
		"windmill":
			return say(state, "The windmill creaks as it turns. Wind power once pumped water for the whole valley.")
		"waterTower":
			return say(state, "The town water tower. Gravity pushes the water down through the pipes to every house.")
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
	if locked_in_shop(state, id):
		return say(state, "That's not in stock yet.")
	if id != "bigCan" and Items.get_def(id).kind == "tool":
		if owns(state, id):
			return say(state, "You already have a %s." % Items.get_def(id).name.to_lower())
		qty = 1
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


## True until the quest that introduces this item is done.
static func locked_in_shop(state: Dictionary, id: String) -> bool:
	var quest = Data.shop_unlocks().get(id)
	return quest != null and not quest in Quests.quest_state(state).done


## Whether you have this item in your bag or in a chest.
static func owns(state: Dictionary, id: String) -> bool:
	if count_item(state, id) > 0:
		return true
	for b in state.buildings:
		for x in b.data.get("items", []):
			if x != null and x.item == id:
				return true
	return false


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
	return say(Js.with(tally(state, "sold"), {"inventory": inv, "coins": state.coins + coins}), "Sold %d %s%s for %s coins." % [n, def.name, " (grade %s)" % grade if grade else "", Js.num(coins)])


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
	return say(Js.with(tally(state, "sold"), {"inventory": inv, "shipping": shipping}), "Put %s %s in the shipping bin. You'll be paid overnight." % [Js.num(s.qty), def.name])


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
			if plot_locked(state, xx, yy):
				return "That plot isn't yours yet."
			if is_water(t.ground) or t.ground == "forest":
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
	if state.get("mine") != null:
		return say(state, "Build up on your farm, not in the mine.")
	var def := Items.get_def(s.item)
	if not def.get("building"):
		return state
	var kind: String = def.building
	var o := placement_for(state, kind, x, y)
	var reason := can_place(state, kind, o.x, o.y)
	if reason:
		return say(state, reason)
	var next: Dictionary = remove_item(state, s.item, 1)
	var rot: int = int(state.get("placeRot", 0)) % 4 if rotatable(kind) else 0
	var b := {"id": "%s-%s-%d-%d" % [kind, Js.num(state.minute), o.x, o.y], "kind": kind, "x": o.x, "y": o.y}
	if rot:
		b.rot = rot
	b.data = {"water": 0} if kind == "rainBarrel" else {}
	next = Js.with(next, {"buildings": next.buildings + [b]})
	if kind == "greenhouse":
		for p in WorldMap.greenhouse_interior(b):
			next = _set_tile(next, p.x, p.y, func(t): return Js.with(t, {"greenhouse": true, "ground": "farm", "weeds": false, "obstacle": null}))
	next = say(next, "Built %s %s!" % ["an" if def.name.substr(0, 1) in ["A", "E", "I", "O", "U"] else "a", def.name])
	return discover(next, "greenhouse-effect") if kind == "greenhouse" else next


## Things you build can be turned to face any way, except the greenhouse (its door faces the path).
static func rotatable(kind: String) -> bool:
	return kind != "greenhouse"


## Turn the next thing you build a quarter turn.
static func turn_placing(state: Dictionary) -> Dictionary:
	return Js.with(state, {"placeRot": (int(state.get("placeRot", 0)) + 1) % 4})


## Turn something you built (the one in front of you) a quarter turn.
static func rotate_building(state: Dictionary) -> Dictionary:
	if state.get("mine") != null:
		return state
	var f := facing_tile(state)
	var b = building_at(state, f.x, f.y)
	if b == null or not can_pick_up(b):
		return state
	if not rotatable(b.kind):
		return say(state, "The greenhouse door has to face the path.")
	var rot := (int(b.get("rot", 0)) + 1) % 4
	var buildings := []
	for o in state.buildings:
		buildings.append(Js.with(o, {"rot": rot}) if o.id == b.id else o)
	return Js.with(state, {"buildings": buildings})


## Things you built yourself can be picked back up (Grandma's chest stays by the house).
static func can_pick_up(b: Dictionary) -> bool:
	return not b.kind in WorldMap.TOWN_KINDS and not b.data.get("owner") and b.id != "chest"


static func pick_up_building(state: Dictionary, id: String) -> Dictionary:
	var b = null
	for o in state.buildings:
		if o.id == id:
			b = o
			break
	if b == null or not can_pick_up(b):
		return state
	if b.kind == "chest" and b.data.get("items", []).any(func(x): return x != null):
		return say(state, "Empty the chest first.")
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
	var from := player_tile(state)
	var free := func(x: float, y: float) -> bool:
		for o in [[-R, -R], [R, -R], [-R, R], [R, R]]:
			var tx := int(Js.round(x + o[0]))
			var ty := int(Js.round(y + o[1]))
			if not is_walkable(state, tx, ty) or not can_step(state, from.x, from.y, tx, ty):
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


# ───────────────────────── farm plots ─────────────────────────

static func owned_plots(state: Dictionary) -> Array:
	var p = state.get("plots")
	return p if p is Array else [0]


## True on farmland in a plot you don't own yet (the mine and town are never locked).
static func plot_locked(state: Dictionary, x: int, y: int) -> bool:
	if state.get("mine") != null:
		return false
	var p := WorldMap.plot_at(x, y)
	return p >= 0 and not Js.includes(owned_plots(state), p)


## What the next plot of your farm costs (allotments in the park rent for a flat price).
static func next_plot_price(state: Dictionary) -> int:
	return WorldMap.plot_price(owned_plots(state).filter(func(p): return not WorldMap.is_allotment(int(p))).size())


static func price_of_plot(state: Dictionary, id: int) -> int:
	return WorldMap.ALLOTMENT_RENT if WorldMap.is_allotment(id) else next_plot_price(state)


## Buy a plot of farmland, or rent an allotment in the park.
static func buy_plot(state: Dictionary, id: int) -> Dictionary:
	if id < 0 or id >= WorldMap.plots().size() or Js.includes(owned_plots(state), id):
		return state
	var price := price_of_plot(state, id)
	var allotment := WorldMap.is_allotment(id)
	if state.coins < price:
		return say(state, "This %s costs %d coins." % ["allotment" if allotment else "plot", price])
	var done := Js.with(state, {"coins": state.coins - price, "plots": owned_plots(state) + [id]})
	if allotment:
		return say(done, "You rented an allotment in the park for %d coins! It's yours to farm." % price)
	return say(done, "You bought a new plot for %d coins! Clear it and get planting." % price)


## Unlock the next plots of your farm for free (a quest reward), nearest the house first.
static func grant_plots(state: Dictionary, n: int) -> Dictionary:
	var owned := owned_plots(state)
	var add := []
	for p in WorldMap.plots():
		if add.size() < n and not Js.includes(owned, p.id) and not WorldMap.is_allotment(p.id):
			add.append(p.id)
	return Js.with(state, {"plots": owned + add}) if add.size() else state


# ───────────────────────── crafting ─────────────────────────

## What each crafting station is called.
const STATIONS := {
	"workbench": "Workbench", "grinder": "Grinder", "spinningWheel": "Spinning Wheel", "furnace": "Furnace", "stove": "Stove", "oven": "Oven",
}
## Kitchen stations count when they stand within this many steps of the one you're cooking at.
const KITCHEN_REACH := 3


static func recipe(id: String) -> Variant:
	for r in Data.recipes():
		if r.id == id:
			return r
	return null


## True for food: dishes made in a kitchen (or with only a knife, anywhere).
static func is_cooking(r: Dictionary) -> bool:
	return r.has("tools") or r.has("stations")


## The stoves and ovens that make up the kitchen around the station you're at.
static func kitchen_at(state: Dictionary, at: String) -> Array:
	var b = null
	for o in state.buildings:
		if o.id == at:
			b = o
			break
	if b == null or not b.kind in ["stove", "oven"]:
		return []
	var out := []
	for o in state.buildings:
		if o.kind in ["stove", "oven"] and absi(int(o.x) - int(b.x)) <= KITCHEN_REACH and absi(int(o.y) - int(b.y)) <= KITCHEN_REACH and not o.kind in out:
			out.append(o.kind)
	return out


## How many of a recipe's inputs you have, the utensils and stations it's missing, and whether
## you can make it: {inputs, missingTools, missingStations, ok}.
static func recipe_status(state: Dictionary, r: Dictionary, at := "") -> Dictionary:
	var inputs := []
	var ok := true
	for i in r.inputs:
		var have := count_item(state, i.item)
		inputs.append({"item": i.item, "qty": int(i.qty), "have": have})
		if have < i.qty:
			ok = false
	var missing_tools := []
	for t in r.get("tools", []):
		if count_item(state, t) == 0:
			missing_tools.append(t)
	var kitchen := kitchen_at(state, at)
	var missing_stations := []
	for st in r.get("stations", []):
		if not st in kitchen:
			missing_stations.append(st)
	return {"inputs": inputs, "missingTools": missing_tools, "missingStations": missing_stations, "ok": ok and missing_tools.is_empty() and missing_stations.is_empty()}


## Make one batch of a recipe: at a station, in a kitchen (`at` is the stove or oven you're
## using), or from your bag.
static func craft(state: Dictionary, id: String, at := "") -> Dictionary:
	var r = recipe(id)
	if r == null:
		return state
	var st := recipe_status(state, r, at)
	if not st.missingTools.is_empty():
		var names := []
		for t in st.missingTools:
			names.append(Items.get_def(t).name.to_lower())
		return say(state, "You need a %s in your bag." % " and a ".join(names))
	if not st.missingStations.is_empty():
		var names := []
		for x in st.missingStations:
			names.append(STATIONS[x].to_lower())
		return say(state, "Cook this at a %s%s." % [" with an ".join(names), " beside it" if names.size() > 1 else ""])
	if not st.ok:
		return say(state, "You don't have everything for that yet.")
	var s := state
	for i in r.inputs:
		s = remove_item(s, i.item, int(i.qty))
	var got = add_item(s, r.id, int(r.qty))
	if got == null:
		return say(state, "Your bag is full.")
	var cooking := is_cooking(r)
	var made := say(got, "%s %s%s!" % ["Cooked" if cooking else "Made", "%d " % r.qty if r.qty > 1 else "", Items.get_def(r.id).name])
	if cooking:
		return discover(tally(made, "cooked"), "sun-to-supper")
	if r.id == "bronzeBar":
		return discover(made, "alloy")
	if r.get("station") == "furnace":
		return discover(made, "smelting")
	return made


# ───────────────────────── food ─────────────────────────

## Eat food from your bag: it gives back energy.
static func eat(state: Dictionary, slot_index: int) -> Dictionary:
	if slot_index < 0 or slot_index >= state.inventory.size():
		return state
	var s = state.inventory[slot_index]
	if s == null:
		return state
	var def := Items.get_def(s.item)
	if not def.get("energy"):
		return state
	var energy_on := Settings.on(state, "energy")
	if energy_on and state.energy >= state.maxEnergy:
		return say(state, "You're full of energy. Save it for later.")
	var eaten = remove_item(state, s.item, 1)
	if eaten == null:
		return state
	var gain: int = mini(int(def.energy), int(state.maxEnergy - state.energy))
	var fed := tally(Js.with(eaten, {"energy": state.energy + gain}), "ate")
	if energy_on:
		return say(fed, "Ate %s. +%d energy." % [def.name, gain])
	return say(fed, "Ate %s. Yum! (Energy is turned off in this game.)" % def.name)


# ───────────────────────── signposts ─────────────────────────

## True when you're standing by a signpost (they show you around the valley).
static func near_signpost(state: Dictionary) -> bool:
	if state.get("mine") != null:
		return false
	var p := player_tile(state)
	for b in state.buildings:
		if b.kind == "signpost" and absi(int(b.x) - p.x) + absi(int(b.y) - p.y) <= 2:
			return true
	return false


## Game minutes the walk to a place takes: about one for every 3 tiles of road.
static func travel_minutes(steps: int) -> int:
	return maxi(5, int(Js.round(steps / 3.0)))


## Travel from a signpost: the walk passes in a few minutes, and you arrive.
static func travel(state: Dictionary, id: String, steps: int) -> Dictionary:
	var d = WorldMap.destination(id)
	if d == null or not near_signpost(state):
		return state
	var minutes := travel_minutes(steps)
	var after := tick(state, minutes)
	# Fainted on the way (it got too late): you're home in bed instead.
	if day(after) != day(state):
		return after
	return say(Js.with(after, {"player": {"x": d.x, "y": d.y, "facing": d.facing}}), "You walked to the %s (%d minutes)." % [d.name.to_lower(), minutes])


## The travel op (ops.ts): the walk's length is the route from where you stand to the destination.
static func travel_to(state: Dictionary, id: String) -> Dictionary:
	var d = WorldMap.destination(id)
	if d == null:
		return state
	var p := player_tile(state)
	return travel(state, id, Town.route(state, [p.x, p.y], [int(d.x), int(d.y)]).size())


# ───────────────────────── Garden Lane ─────────────────────────

## Through a gate on Garden Lane. Yours (gate 0) leads home; the others are overgrown in a game of your own.
static func enter_gate(state: Dictionary, garden: int) -> Dictionary:
	if state.get("mine") != null:
		return state
	if garden != 0:
		return say(state, "Brambles grow over this gate. Nobody farms here. In a shared world, a friend's garden would be through here.")
	return say(Js.with(state, {"player": WorldMap.GARDEN_ENTRY.duplicate()}), "Home sweet home.")


## Out along your farm's road, back to your gate on Garden Lane.
static func leave_farm(state: Dictionary) -> Dictionary:
	if state.get("mine") != null or not WorldMap.at_garden_exit(state.player):
		return state
	return Js.with(state, {"player": {"x": WorldMap.LANE_X, "y": WorldMap.GATE_ROWS[0], "facing": "right"}})


# ───────────────────────── your market stall ─────────────────────────

## The listings on your stall.
static func stall_listings(state: Dictionary) -> Array:
	return state.get("stall") if state.get("stall") is Array else []


## Put some of a bag stack on your stall, at your price.
static func stock_stall(state: Dictionary, slot: int, qty: int, price: float) -> Dictionary:
	if slot < 0 or slot >= state.inventory.size() or state.inventory[slot] == null:
		return state
	var s: Dictionary = state.inventory[slot]
	var def := Items.get_def(s.item)
	if not def.get("sell") or def.get("tool") or def.kind == "utensil":
		return say(state, "You can't sell that at the market.")
	var n := maxi(1, mini(qty if qty > 0 else 1, int(s.qty)))
	var each := maxi(1, int(Js.round(price)) if Js.round(price) > 0 else 1)
	var list := stall_listings(state)
	var same := -1
	for i in list.size():
		if list[i].item == s.item and list[i].get("grade") == s.get("grade") and int(list[i].price) == each:
			same = i
			break
	if same < 0 and list.size() >= WorldMap.STALL_SIZE:
		return say(state, "Your stall holds %d kinds of things. Take something off first." % WorldMap.STALL_SIZE)
	var stall := []
	for i in list.size():
		stall.append(Js.with(list[i], {"qty": int(list[i].qty) + n}) if i == same else list[i])
	if same < 0:
		var listing := {"item": s.item, "qty": n}
		if s.get("grade") != null:
			listing.grade = s.grade
		listing.price = each
		stall.append(listing)
	var inventory: Array = state.inventory.duplicate()
	inventory[slot] = Js.with(s, {"qty": int(s.qty) - n}) if int(s.qty) - n > 0 else null
	return say(Js.with(state, {"inventory": inventory, "stall": stall}), "Put %d %s on your stall for %d coins each." % [n, def.name, each])


## Take a listing back off your stall.
static func unstock_stall(state: Dictionary, listing: int) -> Dictionary:
	var list := stall_listings(state)
	if listing < 0 or listing >= list.size():
		return state
	var l: Dictionary = list[listing]
	var back = add_item(state, l.item, int(l.qty), l.get("grade"))
	if back == null:
		return say(state, "Your bag is full.")
	var stall := []
	for i in list.size():
		if i != listing:
			stall.append(list[i])
	return Js.with(back, {"stall": stall})


## What a stall listing would fetch at the store: the fair price townsfolk expect.
static func fair_price(state: Dictionary, l: Dictionary) -> int:
	return maxi(1, int(Items.sell_price(Items.get_def(l.item), l.get("grade"), state.organic)))


## The chance a passer-by buys one of a listing this hour: about 1 in 3 at the store's price,
## less the more you ask, never above 3 times the store's price, and always when it's a bargain.
static func stall_chance(state: Dictionary, l: Dictionary) -> float:
	var ratio: float = float(l.price) / fair_price(state, l)
	if ratio <= 0.8:
		return 1.0
	if ratio >= 3:
		return 0.0
	return minf(1.0, (0.35 * (3 - ratio)) / 2)


## Who stops at your stall.
const SHOPPERS := ["Mei", "Dr. Okafor", "June", "Luis", "Pip", "A traveler", "A neighbor"]


## Townsfolk browse your stall during the day (8 AM to 8 PM): each listing may sell one an hour.
static func _stall_sales(state: Dictionary) -> Dictionary:
	var list := stall_listings(state)
	var hour := int(Clock.time_of_day(state.minute) / 60)
	if list.is_empty() or hour < 8 or hour >= 20:
		return state
	var r := Rng.stream(int(state.seed) ^ U32.imul(int(state.minute), 0x9e3779b1))
	var s := state
	var stall := []
	for l in list:
		var roll := r.next()
		var who: String = SHOPPERS[int(r.next() * SHOPPERS.size())]
		if roll >= stall_chance(state, l):
			stall.append(l)
			continue
		s = say(tally(Js.with(s, {"coins": s.coins + int(l.price)}), "sold"), "%s bought %s from your stall: +%d coins." % [who, Items.get_def(l.item).name, int(l.price)])
		if int(l.qty) > 1:
			stall.append(Js.with(l, {"qty": int(l.qty) - 1}))
	return Js.with(s, {"stall": stall})


# ───────────────────────── the mine ─────────────────────────

## Luis's quest unboards the old mine.
static func mine_open(state: Dictionary) -> bool:
	return "reopen-mine" in Quests.quest_state(state).done


## Floors the mine cart can take you to: the top, and every fifth floor you've reached.
static func cart_floors(state: Dictionary) -> Array:
	var out := [1]
	var f := 5
	while f <= int(state.get("deepest", 0)):
		out.append(f)
		f += 5
	return out


## Climb down to a floor: a fresh cave, with you standing by the ladder up.
static func enter_mine(state: Dictionary, level: int) -> Dictionary:
	if not mine_open(state):
		return state
	var mine := WorldMap.mine_floor(int(state.seed), level, day(state))
	var before := int(state.get("deepest", 0))
	var deepest := maxi(before, level)
	var s := Js.with(state, {"mine": mine, "deepest": deepest, "player": {"x": WorldMap.MINE_START.x, "y": WorldMap.MINE_START.y + 1, "facing": "down"}})
	var note := "The old mine. Break rocks with your pickaxe; a ladder down hides under one of them." if level == 1 else "Floor %d." % level
	if deepest > before and level % 5 == 0:
		note += " The mine cart can bring you back to this floor."
	return say(s, note)


## Without the mine: you're back up top.
static func _surface(state: Dictionary) -> Dictionary:
	var s := state.duplicate()
	s.erase("mine")
	return s


## Climb out of the mine to the entrance in town.
static func leave_mine(state: Dictionary) -> Dictionary:
	if state.get("mine") == null:
		return state
	var e: Dictionary = WorldMap.MINE_ENTRANCE
	return say(Js.with(_surface(state), {"player": {"x": e.x + 1, "y": e.y + 2, "facing": "down"}}), "You climb back out into the daylight.")


# ───────────────────────── chests ─────────────────────────

static func _set_chest(state: Dictionary, id: String, items: Array) -> Dictionary:
	return Js.with(state, {"buildings": state.buildings.map(func(b): return Js.with(b, {"data": Js.with(b.data, {"items": items})}) if b.id == id else b)})


static func _chest_items(state: Dictionary, id: String) -> Variant:
	for b in state.buildings:
		if b.id == id and b.kind == "chest":
			var items: Array = b.data.get("items", []).duplicate()
			while items.size() < WorldMap.CHEST_SIZE:
				items.append(null)
			return items
	return null


## Move a stack from a chest into your bag.
static func take_from_chest(state: Dictionary, id: String, slot: int) -> Dictionary:
	var items = _chest_items(state, id)
	if items == null or items[slot] == null:
		return state
	var s: Dictionary = items[slot]
	var got = _add_slot(state, s)
	if got == null:
		return say(state, "Your bag is full.")
	items[slot] = null
	return _set_chest(got, id, items)


## Put a whole stack in the bag, keeping a tool's wear.
static func _add_slot(state: Dictionary, s: Dictionary) -> Variant:
	if s.get("dur") == null:
		return add_item(state, s.item, int(s.qty), s.get("grade"))
	var i: int = state.inventory.find(null)
	if i < 0:
		return null
	var inv: Array = state.inventory.duplicate()
	inv[i] = s.duplicate()
	return Js.with(state, {"inventory": inv})


## Move everything that fits from a chest into your bag.
static func take_all_from_chest(state: Dictionary, id: String) -> Dictionary:
	var s := state
	for i in WorldMap.CHEST_SIZE:
		s = take_from_chest(s, id, i)
	return s


## Move a stack from your bag into a chest, stacking with the same item.
static func put_in_chest(state: Dictionary, id: String, inv_slot: int) -> Dictionary:
	var items = _chest_items(state, id)
	var s = state.inventory[inv_slot]
	if items == null or s == null:
		return state
	var same := -1
	var empty := -1
	for i in items.size():
		var x = items[i]
		if x == null:
			if empty < 0:
				empty = i
		elif same < 0 and x.item == s.item and x.get("grade") == s.get("grade") and Items.get_def(s.item).kind != "tool":
			same = i
	var at := same if same >= 0 else empty
	if at < 0:
		return say(state, "The chest is full.")
	items[at] = Js.with(items[at], {"qty": items[at].qty + s.qty}) if same >= 0 else s.duplicate()
	var inv: Array = state.inventory.duplicate()
	inv[inv_slot] = null
	return _set_chest(Js.with(state, {"inventory": inv}), id, items)


# ───────────────────────── saves ─────────────────────────

## Saves from before the town. The store moved into town (the valley is already laid out by
## _grow_valley); the farm keeps everything you built.
static func _add_town(old: Dictionary) -> Dictionary:
	return Js.with(old, {"version": 4, "buildings": old.buildings.filter(func(b): return not (b.kind == "store" and b.x < WorldMap.FARM_W))})


## Where the community garden was before the valley grew.
const OLD_GARDEN := {"x0": 63, "y0": 21, "x1": 69, "y1": 27}


## Version 11 grew the valley: a long country road to town, the market and park, the river,
## mountains, forest, and beach. Old maps (76 wide, or narrower, and 36 or 64 rows) keep their
## farm exactly as it was; everything east of the lane is the new valley, with the community
## garden's progress carried over to where the garden is now.
static func _grow_valley(old: Dictionary) -> Dictionary:
	# Already the size of the valley.
	if old.tiles.size() == WorldMap.W * WorldMap.H:
		return old
	var rows := WorldMap.OLD_ROWS if old.tiles.size() == WorldMap.OLD_W * WorldMap.OLD_ROWS else WorldMap.OLD_H
	var old_w: int = old.tiles.size() / rows
	var fresh := WorldMap.create_map(int(old.seed))
	var tiles: Array = fresh.tiles
	for y in rows:
		for x in mini(WorldMap.FARM_W, old_w):
			tiles[WorldMap.idx(x, y)] = old.tiles[y * old_w + x]
	if old_w >= WorldMap.OLD_W:
		var g: Dictionary = WorldMap.TOWN.garden
		for y in range(OLD_GARDEN.y0, OLD_GARDEN.y1 + 1):
			for x in range(OLD_GARDEN.x0, OLD_GARDEN.x1 + 1):
				tiles[WorldMap.idx(x + g.x0 - OLD_GARDEN.x0, y + g.y0 - OLD_GARDEN.y0)] = old.tiles[y * old_w + x]
	var buildings: Array = old.buildings.filter(func(b): return b.x < WorldMap.FARM_W) + fresh.buildings.filter(func(b): return b.x >= WorldMap.FARM_W)
	var critters: Array = old.get("critters", []).filter(func(c): return c.x < WorldMap.FARM_W)
	var s := Js.with(old, {"tiles": tiles, "buildings": buildings, "critters": critters})
	# Out in the old town: the same spot, now further east (or the square, if it's built over).
	var p: Dictionary = s.player
	if s.get("mine") == null and Js.round(p.x) >= WorldMap.LANE_X + 2:
		var moved := Js.with(p, {"x": p.x + WorldMap.TOWN_SHIFT})
		var ok := is_walkable(s, int(Js.round(moved.x)), int(Js.round(moved.y)))
		var sq: Dictionary = WorldMap.DESTINATIONS[1]
		s = Js.with(s, {"player": moved if ok else {"x": sq.x, "y": sq.y, "facing": sq.facing}})
	return s


# ───────────────────────── packed saves ─────────────────────────

static var _base_cache := {}


## The valley as it is on day one, for a seed (saves only store the tiles that have changed).
static func base_tiles(seed: int) -> Array:
	if not _base_cache.has(seed):
		if _base_cache.size() > 4:
			_base_cache.clear()
		_base_cache[seed] = WorldMap.create_map(seed).tiles
	return _base_cache[seed]


## Same value, whatever the key order (and whether a number is an int or a float).
static func same_value(a: Variant, b: Variant) -> bool:
	var an := typeof(a) == TYPE_INT or typeof(a) == TYPE_FLOAT
	var bn := typeof(b) == TYPE_INT or typeof(b) == TYPE_FLOAT
	if an or bn:
		return an and bn and float(a) == float(b)
	if a is Dictionary and b is Dictionary:
		if a.size() != b.size():
			return false
		for k in a:
			if not b.has(k) or not same_value(a[k], b[k]):
				return false
		return true
	if a is Array and b is Array:
		if a.size() != b.size():
			return false
		for i in a.size():
			if not same_value(a[i], b[i]):
				return false
		return true
	return typeof(a) == typeof(b) and a == b


## A tile that's still as it was on day one is saved as 0.
static func pack_tiles(tiles: Array, base: Array) -> Array:
	var out := []
	out.resize(tiles.size())
	for i in tiles.size():
		out[i] = 0 if i < base.size() and same_value(tiles[i], base[i]) else tiles[i]
	return out


static func unpack_tiles(tiles: Array, base: Array) -> Array:
	var out := []
	out.resize(tiles.size())
	for i in tiles.size():
		out[i] = tiles[i] if tiles[i] is Dictionary else base[i]
	return out


## Version 5 added landmarks (barns, silos, the windmill, the water tower). Older saves get each
## one whose ground is still free; one that would land on something the player built or planted
## is left out.
static func _add_landmarks(old: Dictionary, version := 5) -> Dictionary:
	var s := Js.with(old, {"version": version})
	for b in WorldMap.farm_buildings() + WorldMap.town_buildings():
		if s.buildings.any(func(x): return x.id == b.id):
			continue
		var sz := WorldMap.size_of(b.kind)
		var free := true
		for y in range(b.y, b.y + sz[1]):
			for x in range(b.x, b.x + sz[0]):
				if building_at(s, x, y) != null or s.tiles[WorldMap.idx(x, y)].crop != null:
					free = false
		if not free:
			continue
		var tiles: Array = s.tiles.duplicate()
		for y in range(b.y, b.y + sz[1]):
			for x in range(b.x, b.x + sz[0]):
				var t: Dictionary = tiles[WorldMap.idx(x, y)]
				tiles[WorldMap.idx(x, y)] = Js.with(t, {"obstacle": null, "weeds": false, "tilled": false, "ground": "grass" if t.ground == "forest" else t.ground})
		s = Js.with(s, {"tiles": tiles, "buildings": s.buildings + [b]})
	return s


## Version 6 moved the starting tools into a chest and locked the science tools behind quests.
## Older farms already have their tools, so they get an empty chest and the tools stay unlocked.
static func _add_chest(old: Dictionary) -> Dictionary:
	var s := _add_landmarks(old, 6)
	var qs := Quests.quest_state(s)
	var done: Array = qs.done.duplicate()
	# (Only the science tools: the kitchen came later, with its own quest.)
	var unlocks: Dictionary = Data.shop_unlocks()
	for id in unlocks:
		if not id.begins_with("kit_") and not unlocks[id] in done:
			done.append(unlocks[id])
	return Js.with(s, {"quests": Js.with(qs, {"done": done})})


## Version 8 split the farmland into plots and added the South Fields below the old map. Older
## farms keep the whole field they had, gain the new rows, and get a path cut through the forest.
## Version 9 added Grandma Rosa's lessons. Older farms already know the ropes, so they're done.
static func _finish_lessons(old: Dictionary) -> Dictionary:
	var qs: Dictionary = old.get("quests") if old.get("quests") is Dictionary else {"active": [], "done": []}
	var done: Array = qs.done.duplicate()
	for l in LESSONS:
		if not l in done:
			done.append(l)
	return Js.with(old, {"version": 9, "quests": Js.with(qs, {"done": done})})


static func _add_south_fields(old: Dictionary) -> Dictionary:
	var field := []
	for p in WorldMap.plots():
		if p.y1 < WorldMap.OLD_H:
			field.append(p.id)
	var s := Js.with(old, {"version": 8, "plots": field})
	for p in WorldMap.south_path():
		if building_at(s, p[0], p[1]) != null or s.tiles[WorldMap.idx(p[0], p[1])].crop != null:
			continue
		s = _set_tile(s, p[0], p[1], func(t):
			var out := Js.with(t, {"ground": "path", "obstacle": null, "weeds": false})
			out.erase("hits")
			out.erase("regrow")
			return out)
	return s


## Version 10 put Garden Lane between the farm and town (your farm is reached through its gate),
## set up your market stall, and locked the field plots that version 8 handed out free and that
## still stand empty, so they can be bought or earned like on a new farm.
static func _add_garden_lane_v10(old: Dictionary) -> Dictionary:
	var tiles: Array = old.tiles.duplicate()
	WorldMap.add_garden_lane(tiles)
	var s := Js.with(old, {"version": 10, "tiles": tiles})
	for b in WorldMap.lane_buildings():
		if s.buildings.any(func(o): return o.id == b.id):
			continue
		s = _set_tile(s, b.x, b.y, func(t):
			var out := Js.with(t, {"obstacle": null, "weeds": false, "ground": "grass" if t.ground == "forest" else t.ground})
			out.erase("hits")
			out.erase("regrow")
			return out)
		s = Js.with(s, {"buildings": s.buildings + [b]})
	var px := Js.round(s.player.x)
	if s.get("mine") == null and px >= WorldMap.FARM_W and px <= WorldMap.LANE_X + 1:
		s = Js.with(s, {"player": {"x": WorldMap.LANE_X + 1, "y": WorldMap.GARDEN_ENTRY.y, "facing": "right"}})
	return Js.with(s, {"plots": _relocked_plots(s)})


## The field plots version 8 gave old farms, minus the ones still empty (plot 0 always stays yours).
static func _relocked_plots(s: Dictionary) -> Array:
	var owned := owned_plots(s)
	var field := []
	for p in WorldMap.plots():
		if p.y1 < WorldMap.OLD_H:
			field.append(p.id)
	# Only farms that got the whole field from version 8 (it handed them out in order).
	for i in field.size():
		if i >= owned.size() or int(owned[i]) != field[i]:
			return owned
	var out := []
	for id in owned:
		if int(id) == 0 or not int(id) in field or _plot_used(s, int(id)):
			out.append(id)
	return out


static func _plot_used(s: Dictionary, id: int) -> bool:
	var p: Dictionary = WorldMap.plots()[id]
	for y in range(p.y0, p.y1 + 1):
		for x in range(p.x0, p.x1 + 1):
			var t: Dictionary = s.tiles[WorldMap.idx(x, y)]
			if t.tilled or t.crop != null or t.mulch or t.greenhouse or building_at(s, x, y) != null:
				return true
	return false


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
	return Js.stringify(Js.with(state, {"tiles": pack_tiles(state.tiles, base_tiles(int(state.seed)))}))


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
	# Saves store only the tiles that have changed since day one.
	if version >= 11:
		s.tiles = unpack_tiles(s.tiles, base_tiles(int(s.seed)))
	var up: Dictionary = _migrate_v1(s) if version == 1 else s
	# Version 11 grew the valley: lay the old farm onto the new map first.
	if up.version < 11:
		up = _grow_valley(up)
	# Version 4 grew the map east to add the town.
	if up.version < 4:
		up = _add_town(up)
	if up.tiles.size() != WorldMap.W * WorldMap.H:
		return null
	if up.version < 5:
		up = _add_landmarks(up)
	if up.version < 6:
		up = _add_chest(up)
	# Version 7 added the mine entrance past the town.
	if up.version < 7:
		up = _add_landmarks(up, 7)
	if up.version < 8:
		up = _add_south_fields(up)
	if up.version < 9:
		up = _finish_lessons(up)
	if up.version < 10:
		up = _add_garden_lane_v10(up)
	if up.version < 11:
		up = Js.with(up, {"version": 11})
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
	if s.get("deepest") != null:
		s.deepest = int(s.deepest)
	if s.get("placeRot") != null:
		s.placeRot = int(s.placeRot)
	if s.get("mine") != null:
		s.mine.floor = int(s.mine.floor)
		s.mine.ladderAt = int(s.mine.ladderAt)
