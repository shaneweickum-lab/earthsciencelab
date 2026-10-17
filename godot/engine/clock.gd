class_name Clock
## Port of src/world/clock.ts. A calendar is any Dictionary with seasons and daysPerMonth
## (the settings work as one).

const DAY_START := 6 * 60
## You faint if still awake at 2 AM.
const DAY_END := 26 * 60
const SEASONS := ["Spring", "Summer", "Fall", "Winter"]
const MONTHS := ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


## Real milliseconds per game minute at a speed of `speed` game minutes per real minute.
static func ms_per_game_minute(speed: float) -> float:
	return 60000.0 / speed


## Day number (1-based). The day rolls over at 6 AM, so 1 AM still belongs to the previous day.
static func day_of(minute: float) -> int:
	return int(floorf((minute - DAY_START) / 1440.0)) + 1


## Minutes since midnight of the current game day, from 360 (6 AM) to 1559 (1:59 AM next day).
static func time_of_day(minute: float) -> float:
	return fposmod(minute - DAY_START, 1440.0) + DAY_START


## Seasons start on the 21st of March, June, September, and December, scaled for shorter months.
static func season_start_day(days_per_month: float) -> int:
	return maxi(1, int(floorf((21.0 * days_per_month) / 30.0)))


static func days_per_year(cal: Dictionary) -> int:
	return 12 * int(cal.daysPerMonth)


static func days_per_season(cal: Dictionary) -> int:
	return 3 * int(cal.daysPerMonth)


static func _first_day_offset(cal: Dictionary) -> int:
	return 2 * int(cal.daysPerMonth) + season_start_day(cal.daysPerMonth) - 1


static func date_of(day: int, cal: Dictionary) -> Dictionary:
	var n := _first_day_offset(cal) + day - 1
	var dpy := days_per_year(cal)
	var in_year := n % dpy
	return {"year": n / dpy + 1, "month": in_year / int(cal.daysPerMonth), "dayOfMonth": in_year % int(cal.daysPerMonth) + 1}


static func _days_since_spring(day: int, cal: Dictionary) -> int:
	return posmod(day - 1, days_per_year(cal))


## Fraction of the year since the first day of spring, 0–1.
static func year_fraction(day: int, cal: Dictionary) -> float:
	return float(_days_since_spring(day, cal)) / days_per_year(cal)


## The season for growing and visuals. With seasons off it's always a mild growing season.
static func season_of(day: int, cal: Dictionary) -> String:
	if not cal.seasons:
		return "Summer"
	return SEASONS[_days_since_spring(day, cal) / days_per_season(cal)]


static func season_label(day: int, cal: Dictionary) -> String:
	return season_of(day, cal) if cal.seasons else "Growing season"


static func day_of_season(day: int, cal: Dictionary) -> int:
	return _days_since_spring(day, cal) % days_per_season(cal) + 1


static func year_of(day: int, cal: Dictionary) -> int:
	return date_of(day, cal).year


## "March 21"
static func format_date(day: int, cal: Dictionary, short := false) -> String:
	var d := date_of(day, cal)
	var m: String = MONTHS[d.month]
	return "%s %d" % [m.substr(0, 3) if short else m, d.dayOfMonth]


static func format_time(minute: float) -> String:
	var t := fmod(time_of_day(minute), 1440.0)
	var h := int(floorf(t / 60.0))
	var m := int(floorf(fmod(t, 60.0)))
	var h12 := 12 if h % 12 == 0 else h % 12
	return "%d:%02d %s" % [h12, m, "AM" if h < 12 else "PM"]


## First minute of a given day (6 AM).
static func start_of_day(day: int) -> int:
	return (day - 1) * 1440 + DAY_START


## 0 at night, 1 at midday, smooth sunrise around 5–8 AM and sunset around 6–9 PM.
static func daylight(minute: float) -> float:
	var h := fmod(time_of_day(minute), 1440.0) / 60.0
	if h < 5 or h >= 21:
		return 0.0
	if h < 8:
		return (h - 5) / 3.0
	if h > 18:
		return (21 - h) / 3.0
	return 1.0
