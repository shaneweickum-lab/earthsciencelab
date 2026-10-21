class_name Data
## The game's tables, exported from the TS sources by src/world/godot-golden.test.ts.

static var _cache := {}


static func load_json(name: String) -> Variant:
	if not _cache.has(name):
		var text := FileAccess.get_file_as_string("res://data/%s.json" % name)
		assert(text != "", "Missing data file res://data/%s.json" % name)
		_cache[name] = JSON.parse_string(text)
	return _cache[name]


static func crops() -> Dictionary:
	return load_json("crops").crops


static func crop_order() -> Array:
	return load_json("crops").order


static func world_crops() -> Dictionary:
	return load_json("crops").world


static func items() -> Dictionary:
	return load_json("items").items


## What you can catch, where, and when: [{id, water, seasons?, hours?, weight}].
static func catches() -> Array:
	return load_json("items").catches


static func upgrades() -> Dictionary:
	return load_json("items").upgrades


## Science tools the store only sells after the quest that introduces them.
static func shop_unlocks() -> Dictionary:
	return load_json("items").shopUnlocks


## What each crafting station makes: [{id, qty, station, inputs: [{item, qty}]}].
static func recipes() -> Array:
	return load_json("items").recipes


## Tool tiers: power per swing, durability, and color.
static func tiers() -> Dictionary:
	return load_json("items").tiers


## What's in the chest by the house on day one.
static func starter_chest() -> Array:
	return load_json("items").starterChest


static func grade_info() -> Dictionary:
	return load_json("items").gradeInfo


static func settings() -> Dictionary:
	return load_json("settings")


static func weather() -> Dictionary:
	return load_json("weather")


static func journal() -> Dictionary:
	return load_json("journal")


static func spawns() -> Array:
	return load_json("nature").spawns


static func npcs() -> Array:
	return load_json("town").npcs


static func quests() -> Array:
	return load_json("town").quests


## Grandma Rosa's lessons, the tutorial.
static func tutorial() -> Array:
	return load_json("town").tutorial


static func world() -> Dictionary:
	return load_json("world")
