extends TestCase


## Every science feature must be switchable: registered in data/settings.json (from
## SCIENCE_FEATURES in TS) and checked with Settings.on(state, "id") in the engine, and nothing
## checked that isn't registered.
func test_every_feature_is_registered_and_checked() -> void:
	var used := {}
	var re := RegEx.create_from_string("Settings\\.on\\(\\s*\\w+\\s*,\\s*\"(\\w+)\"\\s*\\)")
	var comment := RegEx.create_from_string("#.*")
	for file in DirAccess.get_files_at("res://engine"):
		if not file.ends_with(".gd"):
			continue
		var code := comment.sub(FileAccess.get_file_as_string("res://engine/" + file), "", true)
		for m in re.search_all(code):
			used[m.get_string(1)] = true
	var registered := Settings.feature_ids()
	for id in registered:
		expect_true(used.has(id), "%s is registered but never checked with Settings.on()" % id)
	for id in used:
		expect_true(id in registered, "%s is checked but not registered" % id)
	expect_eq(registered.size(), 18, "feature count")


func test_presets_and_normalizing() -> void:
	expect_eq(Settings.preset_of(Settings.presets().classic.science), "classic")
	expect_eq(Settings.preset_of(Settings.presets().sandbox.science), "sandbox")
	var mixed: Dictionary = Settings.presets().classic.science.duplicate()
	mixed.weeds = not mixed.weeds
	expect_eq(Settings.preset_of(mixed), "custom")
	var n := Settings.normalize({"speed": 999, "daysPerMonth": 2.4, "units": "K", "science": {"weeds": false, "bogus": true}})
	expect_eq(n.speed, 60)
	expect_eq(n.daysPerMonth, 5)
	expect_eq(n.units, "F")
	expect_eq(n.science.weeds, false)
	expect_true(not n.science.has("bogus"), "unknown features are dropped")
	expect_same(Settings.normalize(null), Settings.normalize({}), "missing settings")
