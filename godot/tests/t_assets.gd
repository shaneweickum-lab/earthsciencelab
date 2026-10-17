extends TestCase


## Godot's web build has no emoji font, so every emoji the game shows needs a picture.
## If this fails, run: node scripts/godot-assets.mjs
func test_every_emoji_has_a_picture() -> void:
	var missing := {}
	for dir in ["res://data", "res://ui", "res://scene", "res://engine"]:
		for f in DirAccess.get_files_at(dir):
			if not (f.ends_with(".json") or f.ends_with(".gd")):
				continue
			for part in Emoji.split(FileAccess.get_file_as_string(dir + "/" + f)):
				if part.has("emoji") and not ResourceLoader.exists(Emoji.path(part.emoji)):
					missing[part.emoji] = f
	expect_true(missing.is_empty(), "no picture for emoji %s (run node scripts/godot-assets.mjs)" % JSON.stringify(missing))


func test_the_font_and_item_pictures_are_there() -> void:
	expect_true(ResourceLoader.exists("res://assets/fonts/Nunito.ttf"), "Nunito font")
	for id in ["crop_carrot", "pickaxe"]:
		var def: Dictionary = Data.items()[id]
		expect_true(ResourceLoader.exists("res://assets/icons/" + def.image.get_file()), "%s picture (synced by npm run godot:export)" % id)
