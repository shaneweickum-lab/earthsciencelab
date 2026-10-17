class_name Settings
## Port of src/world/settings.ts. The feature list, presets, and defaults come from
## data/settings.json.
##
## Every mechanic that adds scientific realism is listed there and checked with
## Settings.on(state, "id") in the engine, so players can switch each one on or off by itself.
## tests/t_settings.gd fails if a feature is registered but never checked, or the reverse.

const SPEED_MIN := 1
const SPEED_MAX := 60
const SPEED_PRESETS := [1, 5, 10, 30, 60]
const MONTH_MIN := 5
const MONTH_MAX := 30


static func features() -> Array:
	return Data.settings().features


static func feature_ids() -> Array:
	return features().map(func(f): return f.id)


static func presets() -> Dictionary:
	return Data.settings().presets


static func defaults() -> Dictionary:
	return Data.settings().defaults


static func preset_of(science: Dictionary) -> String:
	for id in presets():
		var p: Dictionary = presets()[id].science
		if feature_ids().all(func(f): return p[f] == science.get(f)):
			return id
	return "custom"


static func _clamp_int(v: Variant, lo: int, hi: int, fallback: int) -> int:
	if (typeof(v) == TYPE_INT or typeof(v) == TYPE_FLOAT) and is_finite(float(v)):
		return clampi(int(Js.round(float(v))), lo, hi)
	return fallback


## Fill in missing or out-of-range values (old saves, hand-edited storage).
static func normalize(s: Variant) -> Dictionary:
	var src: Dictionary = s if s is Dictionary else {}
	var d := defaults()
	var science: Dictionary = d.science.duplicate()
	var given = src.get("science")
	for id in feature_ids():
		if given is Dictionary and typeof(given.get(id)) == TYPE_BOOL:
			science[id] = given[id]
	return {
		"science": science,
		"speed": _clamp_int(src.get("speed"), SPEED_MIN, SPEED_MAX, int(d.speed)),
		"seasons": src.seasons if typeof(src.get("seasons")) == TYPE_BOOL else d.seasons,
		"daysPerMonth": _clamp_int(src.get("daysPerMonth"), MONTH_MIN, MONTH_MAX, int(d.daysPerMonth)),
		"units": "C" if src.get("units") == "C" else "F",
	}


## Is this science feature switched on?
static func on(state: Dictionary, id: String) -> bool:
	return bool(state.settings.science[id])


static func speed_label(speed: float) -> String:
	if speed == 1:
		return "Real time: 1 game minute = 1 real minute"
	if speed == 60:
		return "1 game hour = 1 real minute"
	var per_hour := 60.0 / speed
	return "1 game hour = %s real minutes" % (Js.to_fixed(per_hour, 1) if fmod(per_hour, 1.0) != 0 else Js.num(per_hour))


static func format_temp(f: float, units: String) -> String:
	if units == "F":
		return "%s°F" % Js.num(Js.round(f))
	return "%s°C" % Js.num(Js.round(((f - 32) * 5) / 9))
