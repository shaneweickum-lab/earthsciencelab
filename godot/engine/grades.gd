class_name Grades
## Port of src/world/grades.ts.

const GRADES := ["E", "D", "C", "B", "A", "S"]
## Score cut-offs (0–100) for D, C, B, A, and S when grades come from soil health.
const CUTOFFS := [20, 35, 50, 65, 80]
const MAX_BOOST := 10


static func info(grade: String) -> Dictionary:
	return Data.grade_info()[grade]


## Points each amendment adds toward the next harvest's grade.
static func amendment_points(id: String, tile: Dictionary) -> int:
	match id:
		"compost", "biochar", "synthFert":
			return 2
		"mulch":
			return 1
		"lime":
			return 2 if tile.soil.ph < 6 else 1
	return 0


## Overall soil health, 0–100.
static func soil_health(t: Dictionary) -> float:
	var s: Dictionary = t.soil
	var ph := maxf(0, minf(100, 100 - 30 * absf(s.ph - 6.5)))
	return Js.round((0.25 * s.om + 0.2 * s.life + 0.2 * s.structure + 0.15 * s.water + 0.1 * s.nutrients + 0.1 * ph) * 10) / 10


## The grade a crop on this tile would get if harvested now, and why.
static func expected_grade(state: Dictionary, t: Dictionary) -> Dictionary:
	var boost: float = t.get("boost", 0)
	if not Settings.on(state, "cropGrades"):
		var grade: String = GRADES[mini(5, int(boost))]
		var why := "Amendments +%s grade%s" % [Js.num(boost), "s" if boost > 1 else ""] if boost else "Add compost or other amendments to raise the grade"
		return {"grade": grade, "score": boost, "parts": [why]}
	var parts := []
	var soil := Js.round(soil_health(t))
	parts.append("Soil health %s" % Js.num(soil))
	var score := soil
	var c = t.crop
	if c and c.get("stress"):
		var hours := Items.crop_days(c.id, state.settings.daysPerMonth, c.harvests > 0) * 24
		var penalty := Js.round(minf(40, (40 * c.stress) / hours))
		if penalty > 0:
			score -= penalty
			parts.append("Stressed while growing −%s" % Js.num(penalty))
	if boost:
		score += boost * 4
		parts.append("Amendments +%s" % Js.num(boost * 4))
	var idx := 0
	for cut in CUTOFFS:
		if score >= cut:
			idx += 1
	return {"grade": GRADES[idx], "score": Js.round(score), "parts": parts}


## How many to harvest: a seeded roll in the crop's per-tile range, scaled by grade.
static func harvest_amount(state: Dictionary, tile_index: int, crop_id: String, grade: String) -> int:
	var yr: Array = Items.world_crop(crop_id).yield
	var lo := int(yr[0])
	var hi := int(yr[1])
	var roll := Rng.stream(int(state.seed) ^ U32.imul(int(state.minute) + 1, 2654435761) ^ U32.imul(tile_index + 7, 40503))
	var base := lo + int(floorf(roll.next() * (hi - lo + 1)))
	var g := info(grade)
	var mult: float = g.yieldLo + roll.next() * (g.yieldHi - g.yieldLo)
	return maxi(1, int(Js.round(base * mult)))
