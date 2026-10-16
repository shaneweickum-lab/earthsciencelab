extends TestCase


func test_matches_the_typescript_mulberry32() -> void:
	var fixture: Dictionary = golden("rng")
	for key in fixture:
		var s := int(key)
		var i := 0
		for want in fixture[key]:
			var r := Rng.next_random(s)
			expect_eq(int(r[0] * 4294967296.0), int(want), "seed %s value %d" % [key, i])
			s = r[1]
			i += 1


func test_imul_matches_javascript() -> void:
	var fixture: Array = golden("imul")
	for row in fixture:
		expect_eq(U32.imul(int(row[0]), int(row[1])), int(row[2]), "imul(%s, %s)" % [row[0], row[1]])
