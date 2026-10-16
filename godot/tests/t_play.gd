extends TestCase
## Seeded playthroughs from the TS engine, replayed step by step. Each step's summary must
## match; the first mismatch is reported with the ops that led to it.


func _replay(name: String) -> void:
	var g: Dictionary = golden("play-" + name)
	var s := World.new_world(int(g.seed), g.settings)
	var expected := {}
	for i in g.ops.size():
		var op: Dictionary = g.ops[i]
		var r := Play.apply(s, op)
		s = r.state
		expected.merge(g.results[i], true)
		var got := Play.summary(s, r.get("text"))
		if not expect_same(got, expected, "%s step %d (%s)" % [name, i, JSON.stringify(op)]):
			var from := maxi(0, i - 4)
			for k in range(from, i + 1):
				failures.append("    op %d: %s" % [k, JSON.stringify(g.ops[k])])
			return
	expect_same(Play.final_state(s), g.final, name + " final state")
	# For the TS round-trip test (src/world/godot-roundtrip.test.ts): a save written by Godot.
	DirAccess.make_dir_recursive_absolute("res://tests/out")
	FileAccess.open("res://tests/out/save-%s.json" % name, FileAccess.WRITE).store_string(World.save_world(s))


func test_classic() -> void:
	_replay("classic")


func test_science() -> void:
	_replay("science")


func test_sandbox() -> void:
	_replay("sandbox")


func test_winter() -> void:
	_replay("winter")
