extends TestCase
## The engine modules against fixtures from the TS engine (src/world/godot-golden.test.ts).


func test_clock() -> void:
	var g: Dictionary = golden("clock")
	for row in g.minutes:
		expect_same(Clock.time_of_day(row[0]), row[1], "timeOfDay(%s)" % row[0])
		expect_eq(Clock.format_time(row[0]), row[2], "formatTime(%s)" % row[0])
	for c in g.calendars:
		for row in c.days:
			var d := int(row[0])
			var what := "day %d of %s" % [d, JSON.stringify(c.cal)]
			expect_same(Clock.date_of(d, c.cal), row[1], what + " dateOf")
			expect_eq(Clock.season_of(d, c.cal), row[2], what + " seasonOf")
			expect_same(Clock.day_of_season(d, c.cal), row[3], what + " dayOfSeason")
			expect_eq(Clock.format_date(d, c.cal), row[4], what + " formatDate")
			expect_eq(Clock.format_date(d, c.cal, true), row[5], what + " formatDate short")
			expect_same(Clock.year_fraction(d, c.cal), row[6], what + " yearFraction")


func test_weather() -> void:
	var g: Dictionary = golden("weather")
	for c in g.calendars:
		for s in c.seeds:
			for i in s.days.size():
				if not expect_same(Weather.weather_for(int(s.seed), i + 1, c.cal), s.days[i], "weatherFor(%s, %d, %s)" % [s.seed, i + 1, JSON.stringify(c.cal)]):
					return
	for row in g.mean:
		expect_same(Weather.seasonal_mean_f(row[0]), row[1], "seasonalMeanF(%s)" % row[0])
	for row in g.tempAt:
		expect_same(Weather.temp_at({"kind": "sunny", "high": 81, "low": 47}, row[0]), row[1], "tempAt(%s)" % row[0])


func test_formulas() -> void:
	var g: Dictionary = golden("formulas")
	for row in g.temps:
		expect_eq(Settings.format_temp(row[0], row[1]), row[2], "formatTemp(%s, %s)" % [row[0], row[1]])
	for row in g.speeds:
		expect_eq(Settings.speed_label(row[0]), row[1], "speedLabel(%s)" % row[0])
	for row in g.cropDays:
		expect_same(Items.crop_days(row[0], row[1], row[2]), row[3], "cropDays(%s, %s, %s)" % [row[0], row[1], row[2]])
	for row in g.tempFactor:
		expect_same(Items.temp_factor(row[0], row[1]), row[2], "tempFactor(%s, %s)" % [row[0], row[1]])
	for row in g.sellPrice:
		expect_same(Items.sell_price(Items.get_def(row[0]), row[1], row[2]), row[3], "sellPrice(%s, %s, %s)" % [row[0], row[1], row[2]])


func test_maps() -> void:
	const G := ["grass", "farm", "path", "water", "sand", "forest"]
	const O := [null, "stone", "stick", "stump", "tree", "log"]
	for m in golden("maps"):
		var s := World.new_world(int(m.seed))
		var tiles := []
		for t in s.tiles:
			var so: Dictionary = t.soil
			tiles.append([G.find(t.ground), O.find(t.obstacle), 1 if t.weeds else 0, so.om, so.life, so.structure, so.water, so.nutrients, so.ph])
		expect_same(tiles, m.tiles, "newWorld(%s).tiles" % m.seed)
		expect_same(s.buildings, m.buildings, "newWorld(%s).buildings" % m.seed)
		expect_same(s.weather, m.weather, "newWorld(%s).weather" % m.seed)


func test_grades() -> void:
	var base := World.new_world(11)
	for row in golden("grades"):
		var settings: Dictionary = base.settings.duplicate(true)
		settings.daysPerMonth = row.daysPerMonth
		settings.science.cropGrades = row.cropGrades
		var w := Js.with(base, {"minute": row.minute, "settings": settings})
		var what := "grades case %s" % row.i
		expect_same(Grades.soil_health(row.tile), row.health, what + " soilHealth")
		var g := Grades.expected_grade(w, row.tile)
		expect_same(g, row.grade, what + " expectedGrade")
		expect_same(Grades.harvest_amount(w, int(row.i) * 13, row.tile.crop.id, row.grade.grade), row.amount, what + " harvestAmount")


func test_nature() -> void:
	var s := World.new_world(8)
	for row in golden("nature"):
		s = World.sleep(s)
		if not expect_same(s.critters, row.critters, "critters on day %s" % row.day):
			return
		expect_same(s.weather[str(int(row.day))], row.weather, "weather on day %s" % row.day)


func test_town() -> void:
	var g: Dictionary = golden("town")
	var s := World.new_world(3)
	for r in g.routes:
		expect_same(Town.route(s, [int(r.from[0]), int(r.from[1])], [int(r.to[0]), int(r.to[1])]), r.path, "route %s → %s" % [r.from, r.to])
	for n in g.poses:
		var npc: Dictionary = Town.npc(n.id)
		for row in n.poses:
			if not expect_same(Town.npc_pose(s, npc, row[0]), row[1], "%s at minute %s" % [n.id, row[0]]):
				break
	for b in g.boards:
		var w := World.new_world(int(b.seed), {"seasons": b.seasons})
		for d in b.days.size():
			expect_same(Quests.board_requests(Js.with(w, {"minute": Clock.start_of_day(d + 1)})), b.days[d], "board day %d seed %s" % [d + 1, b.seed])
	for row in g.texts.rewards:
		expect_eq(Quests.reward_text(row[0]), row[1], "rewardText(%s)" % JSON.stringify(row[0]))
	for row in g.texts.labels:
		expect_eq(Quests.goal_label(row[0]), row[1], "goalLabel(%s)" % JSON.stringify(row[0]))


func test_old_saves() -> void:
	# The same old saves the TS fixture loads: a version 3 save from before the town, and the
	# same farm as a version 1 save (no settings, weather as a plain label).
	var s := World.sleep(World.new_world(5))
	var old_w := 40
	var tiles := []
	for i in old_w * WorldMap.H:
		var x := i % old_w
		var y := i / old_w
		tiles.append(Js.with(s.tiles[y * WorldMap.W + x], {"mulch": x == 20 and y == 20}))
	var farm: Array = s.buildings.filter(func(b): return b.x < 38)
	var v3 := Js.with(s, {"version": 3, "tiles": tiles, "buildings": farm + [{"id": "store", "kind": "store", "x": 30, "y": 5, "data": {}}]})
	var v1 := Js.with(v3, {"version": 1, "weather": "sunny"})
	v1.erase("settings")
	var expected: Array = golden("migrations")
	var olds := [v3, v1]
	for i in olds.size():
		var up = World.load_world(Js.stringify(olds[i]))
		expect_true(up != null, "old save %d loads" % i)
		if up != null:
			expect_same(Play.final_state(up), expected[i], "old save %d" % i)
	expect_true(World.load_world("{\"version\": 0, \"tiles\": []}") == null, "version 0 is rejected")
	expect_true(World.load_world("not json") == null, "garbage is rejected")
