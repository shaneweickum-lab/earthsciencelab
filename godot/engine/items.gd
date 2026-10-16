class_name Items
## Port of the logic in src/world/items.ts. The tables come from data/crops.json and data/items.json.

## Price multipliers by grade.
const GRADE_PRICE := {"E": 0.5, "D": 0.75, "C": 1.0, "B": 1.25, "A": 1.6, "S": 2.2}


static func get_def(id: String) -> Dictionary:
	var i = Data.items().get(id)
	assert(i != null, "Unknown item " + id)
	return i


static func world_crop(id: String) -> Dictionary:
	return Data.world_crops()[id]


static func crop(id: String) -> Dictionary:
	return Data.crops()[id]


## Game days to grow, scaled so crops fit the calendar: real days at 30-day months.
static func crop_days(id: String, days_per_month: float, regrow := false) -> float:
	var w := world_crop(id)
	var real: float = w.regrowDays if regrow and w.get("regrowDays") else w.realDays
	return maxf(1 if regrow else 2, Js.round((real * days_per_month) / 30))


## How well a crop grows at a daily average temperature (°F), 0–1.
static func temp_factor(type: String, mean_f: float) -> float:
	var r := [40.0, 55.0, 75.0, 90.0] if type == "cool" else [50.0, 70.0, 90.0, 100.0]
	var stop: float = r[0]
	var best_lo: float = r[1]
	var best_hi: float = r[2]
	var hot: float = r[3]
	if mean_f <= stop:
		return 0.0
	if mean_f < best_lo:
		return (mean_f - stop) / (best_lo - stop)
	if mean_f <= best_hi:
		return 1.0
	return maxf(0.3, 1 - ((mean_f - best_hi) / (hot - best_hi)) * 0.7)


## What the store or shipping bin pays for one item of a grade, with the organic bonus.
static func sell_price(def: Dictionary, grade: Variant, organic: bool) -> float:
	var g: float = GRADE_PRICE[grade] if def.kind == "produce" and grade else 1.0
	return Js.round(def.get("sell", 0) * g * (1.25 if organic and def.kind == "produce" else 1.0))
