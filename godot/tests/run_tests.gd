extends SceneTree
## Headless test runner: godot --headless --path godot -s res://tests/run_tests.gd
## Runs every test_* method in tests/t_*.gd and exits non-zero if any fail.


func _initialize() -> void:
	# Compile every script first, so a parse error anywhere fails the run.
	for dir in ["res://autoload", "res://engine", "res://scene", "res://ui"]:
		for f in DirAccess.get_files_at(dir):
			if f.ends_with(".gd"):
				load(dir + "/" + f)
	var passed := 0
	var failed := 0
	var files := Array(DirAccess.get_files_at("res://tests")).filter(func(f): return f.begins_with("t_") and f.ends_with(".gd"))
	files.sort()
	for file in files:
		var script: GDScript = load("res://tests/" + file)
		for m in script.get_script_method_list():
			if not m.name.begins_with("test_"):
				continue
			var t: TestCase = script.new()
			var started := Time.get_ticks_msec()
			t.call(m.name)
			var ms := Time.get_ticks_msec() - started
			if t.failures.is_empty():
				passed += 1
				print("  ok  %s › %s%s" % [file.trim_suffix(".gd"), m.name, " (%d ms)" % ms if ms > 200 else ""])
			else:
				failed += 1
				print("FAIL  %s › %s" % [file.trim_suffix(".gd"), m.name])
				for f in t.failures:
					print("        " + f)
	print("\n%d passed, %d failed" % [passed, failed])
	quit(1 if failed > 0 else 0)
