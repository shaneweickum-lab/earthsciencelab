class_name Weather
## Port of src/world/weather.ts. Names, icons, and TV text come from data/weather.json.

const WEIGHTS := {
	"Spring": [["sunny", 4], ["cloudy", 2], ["rain", 3], ["storm", 1], ["fog", 1]],
	"Summer": [["sunny", 6], ["cloudy", 1], ["rain", 2], ["storm", 2]],
	"Fall": [["sunny", 3], ["cloudy", 3], ["rain", 3], ["fog", 2]],
	"Winter": [["sunny", 3], ["cloudy", 3], ["rain", 3], ["fog", 1]],
}

## The year-round mix when seasons are off.
const MILD := [["sunny", 5], ["cloudy", 2], ["rain", 3], ["storm", 1], ["fog", 1]]

## How far the high and low swing from the day's average.
const RANGE := {"sunny": 11, "cloudy": 7, "rain": 6, "storm": 8, "fog": 5}


static func info(kind: String) -> Dictionary:
	return Data.weather()[kind]


## Average temperature (°F) through the year: coldest in mid-January, warmest in late July.
## `f` is the fraction of the year since the first day of spring.
static func seasonal_mean_f(f: float) -> float:
	return 54 + 24 * sin(2 * PI * f - 0.52)


## Deterministic weather for a day. Day 1 is always mild and sunny.
static func weather_for(seed: int, day: int, cal: Dictionary) -> Dictionary:
	if day == 1:
		return {"kind": "sunny", "high": 64 if cal.seasons else 74, "low": 42 if cal.seasons else 58}
	var r := Rng.stream(seed ^ U32.imul(day, 2654435761) ^ 0x5ea)
	var weights: Array = WEIGHTS[Clock.season_of(day, cal)] if cal.seasons else MILD
	var total := 0
	for w in weights:
		total += w[1]
	var pick: float = r.next() * total
	var sky: String = weights[0][0]
	for w in weights:
		pick -= w[1]
		if pick < 0:
			sky = w[0]
			break
	var noise: float = (r.next() - 0.5) * 16
	var mean := seasonal_mean_f(Clock.year_fraction(day, cal)) + noise if cal.seasons else 70 + noise * 0.5
	var rng: float = RANGE[sky] if cal.seasons else mini(RANGE[sky], 8)
	var high := Js.round(mean + rng)
	var low := Js.round(mean - rng)
	var kind := sky
	if (sky == "rain" or sky == "storm") and high <= 34:
		kind = "snow"
	elif sky != "rain" and sky != "storm" and low <= 32:
		kind = "frost"
	elif sky == "sunny" and high >= 92:
		kind = "heat"
	return {"kind": kind, "high": high, "low": low}


## Temperature at a time of day: coolest around 6 AM, warmest around 3 PM.
static func temp_at(w: Dictionary, minute_of_day: float) -> float:
	var h := fmod(minute_of_day, 1440.0) / 60.0
	var t: float
	if h >= 6 and h <= 15:
		t = (h - 6) / 9
	elif h > 15:
		t = 1 - (h - 15) / 15
	else:
		t = 1 - (h + 9) / 15
	var smooth := (1 - cos(PI * maxf(0, minf(1, t)))) / 2
	return w.low + (w.high - w.low) * smooth


static func is_wet(kind: String) -> bool:
	return kind == "rain" or kind == "storm"
