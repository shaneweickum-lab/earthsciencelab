class_name Js
## JavaScript semantics the TS engine relies on, so the GDScript port computes the same
## numbers and strings: rounding, number formatting, and copying plain JSON-shaped data.


## Math.round: halves round up (toward +infinity), unlike Godot's round().
static func round(x: float) -> float:
	return floorf(x + 0.5)


## Math.round(x * 10) / 10
static func r1(x: float) -> float:
	return floorf(x * 10.0 + 0.5) / 10.0


static func clamp100(v: float, lo := 0.0, hi := 100.0) -> float:
	return maxf(lo, minf(hi, v))


## A number the way JS prints it in a template string: "5", not "5.0".
static func num(v: Variant) -> String:
	if v is int:
		return str(v)
	var f := float(v)
	if f == floorf(f) and absf(f) < 1e15:
		return str(int(f))
	var s := String.num(f, 10)
	return s


## Number.prototype.toFixed(digits) for the small, positive values the game shows.
static func to_fixed(v: float, digits: int) -> String:
	var m := pow(10.0, digits)
	var n := floorf(absf(v) * m + 0.5)
	var whole := int(n / m)
	var frac := int(n - whole * m)
	var out := str(whole)
	if digits > 0:
		out += "." + str(frac).pad_zeros(digits)
	return ("-" if v < 0 and n != 0 else "") + out


## { ...d, ...patch }
static func with(d: Dictionary, patch: Dictionary) -> Dictionary:
	var out := d.duplicate()
	out.merge(patch, true)
	return out


## array.includes(v), comparing numbers by value (JSON numbers arrive as floats).
static func includes(arr: Array, v: Variant) -> bool:
	for x in arr:
		if _eq(x, v):
			return true
	return false


static func index_of(arr: Array, v: Variant) -> int:
	for i in arr.size():
		if _eq(arr[i], v):
			return i
	return -1


static func _eq(a: Variant, b: Variant) -> bool:
	var an := typeof(a) == TYPE_INT or typeof(a) == TYPE_FLOAT
	var bn := typeof(b) == TYPE_INT or typeof(b) == TYPE_FLOAT
	if an and bn:
		return float(a) == float(b)
	return typeof(a) == typeof(b) and a == b


## A stable sort (Array.sort in JS is stable; Godot's sort_custom isn't).
static func stable_sort(arr: Array, key: Callable) -> Array:
	var out := arr.duplicate()
	for i in range(1, out.size()):
		var item = out[i]
		var k = key.call(item)
		var j := i - 1
		while j >= 0 and key.call(out[j]) > k:
			out[j + 1] = out[j]
			j -= 1
		out[j + 1] = item
	return out


## JSON.stringify for saves: full precision so numbers round-trip exactly.
static func stringify(v: Variant) -> String:
	return JSON.stringify(v, "", false, true)
