class_name Compare
## The first difference between two JSON-shaped values, or "" when they match.


static func _num(v: Variant) -> bool:
	return typeof(v) == TYPE_INT or typeof(v) == TYPE_FLOAT


static func diff(a: Variant, b: Variant, path := "") -> String:
	if _num(a) and _num(b):
		var fa := float(a)
		var fb := float(b)
		if absf(fa - fb) <= 1e-9 * maxf(1.0, absf(fb)):
			return ""
		return "%s: got %s, expected %s" % [path, var_to_str(fa), var_to_str(fb)]
	if a is Dictionary and b is Dictionary:
		var keys := {}
		for k in a:
			keys[str(k)] = true
		for k in b:
			keys[str(k)] = true
		for k in keys:
			var d := diff(a.get(k), b.get(k), "%s.%s" % [path, k])
			if d != "":
				return d
		return ""
	if a is Array and b is Array:
		if a.size() != b.size():
			return "%s: got %d items, expected %d (%s vs %s)" % [path, a.size(), b.size(), _short(a), _short(b)]
		for i in a.size():
			var d := diff(a[i], b[i], "%s[%d]" % [path, i])
			if d != "":
				return d
		return ""
	if typeof(a) == typeof(b) and a == b:
		return ""
	return "%s: got %s, expected %s" % [path, _short(a), _short(b)]


static func _short(v: Variant) -> String:
	var s := JSON.stringify(v)
	return s if s.length() < 300 else s.substr(0, 300) + "…"
