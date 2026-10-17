class_name TestCase
extends RefCounted
## Base for the GDScript tests. Each test_* method is one test; tests/run_tests.gd runs them.

var failures: Array[String] = []


func expect_eq(actual: Variant, expected: Variant, what := "") -> void:
	if typeof(actual) != typeof(expected) and not (_num(actual) and _num(expected)):
		_fail("%s: expected %s (%s), got %s (%s)" % [what, expected, type_string(typeof(expected)), actual, type_string(typeof(actual))])
	elif actual != expected:
		_fail("%s: expected %s, got %s" % [what, expected, actual])


func expect_true(cond: bool, what := "") -> void:
	if not cond:
		_fail("%s: expected true" % what)


## Deep comparison of JSON-shaped data. Numbers match within 1e-9 (Godot's JSON parser can be
## off by an ulp), and a missing key counts as null, since JSON.stringify drops undefined.
func expect_same(actual: Variant, expected: Variant, what := "") -> bool:
	var diff := Compare.diff(actual, expected, what)
	if diff != "":
		_fail(diff)
		return false
	return true


## Loads a fixture written by the TS side (src/world/godot-golden.test.ts).
func golden(name: String) -> Variant:
	var text := FileAccess.get_file_as_string("res://tests/golden/%s.json" % name)
	if text == "":
		_fail("missing golden fixture %s (run npm test)" % name)
		return null
	return JSON.parse_string(text)


func _num(v: Variant) -> bool:
	return typeof(v) == TYPE_INT or typeof(v) == TYPE_FLOAT


func _fail(msg: String) -> void:
	if failures.size() < 20:
		failures.append(msg)
