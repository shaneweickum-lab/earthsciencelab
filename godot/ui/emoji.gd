class_name Emoji
## Emoji as pictures (Godot's web build has no emoji font). The PNGs in res://assets/emoji
## come from scripts/godot-assets.mjs, which uses the same rules to find emoji in text.

static var _cache := {}


static func _start(cp: int) -> bool:
	return (cp >= 0x1F000 and cp <= 0x1FAFF) or (cp >= 0x2600 and cp <= 0x27BF) or (cp >= 0x23E9 and cp <= 0x23FF) \
		or cp == 0x2B50 or cp == 0x2B1C or cp == 0x2B1B or cp == 0x25B6 or cp == 0x25C0


## Splits text into plain runs and emoji: [{text}, {emoji: key}, …]
static func split(text: String) -> Array:
	var out := []
	var plain := ""
	var i := 0
	var n := text.length()
	while i < n:
		var cp := text.unicode_at(i)
		if not _start(cp):
			plain += text[i]
			i += 1
			continue
		var seq := [cp]
		i += 1
		while i < n:
			var c := text.unicode_at(i)
			if c == 0xFE0F or (c >= 0x1F3FB and c <= 0x1F3FF):
				seq.append(c)
				i += 1
			elif c == 0x200D and i + 1 < n:
				seq.append(c)
				seq.append(text.unicode_at(i + 1))
				i += 2
			else:
				break
		if plain != "":
			out.append({"text": plain})
			plain = ""
		out.append({"emoji": key(seq)})
	if plain != "":
		out.append({"text": plain})
	return out


static func key(seq: Array) -> String:
	var parts := PackedStringArray()
	for c in seq:
		if c != 0xFE0F:
			parts.append("%x" % c)
	return "-".join(parts)


static func path(k: String) -> String:
	return "res://assets/emoji/%s.png" % k


## The picture for an emoji string (or its key), or null.
static func texture(e: String) -> Texture2D:
	var k := e
	if not e.is_valid_hex_number() and not "-" in e:
		var parts := split(e)
		if parts.is_empty() or not parts[0].has("emoji"):
			return null
		k = parts[0].emoji
	if not _cache.has(k):
		_cache[k] = load(path(k)) if ResourceLoader.exists(path(k)) else null
	return _cache[k]


## The picture scaled to px × px (Button icons size themselves to their texture).
static func sized(e: String, px: int) -> Texture2D:
	var tex := texture(e)
	if tex == null:
		return null
	var k := "%s@%d" % [tex.resource_path, px]
	if not _cache.has(k):
		var img := tex.get_image()
		img.resize(px, px, Image.INTERPOLATE_LANCZOS)
		_cache[k] = ImageTexture.create_from_image(img)
	return _cache[k]


## BBCode for a RichTextLabel, with emoji as inline images. The text may use BBCode itself.
static func bb(text: String, size := 18) -> String:
	var out := ""
	for part in split(text):
		if part.has("text"):
			out += part.text
		elif ResourceLoader.exists(path(part.emoji)):
			out += "[img=%dx%d]%s[/img]" % [size, size, path(part.emoji)]
	return out


## Text without emoji, for plain labels.
static func strip(text: String) -> String:
	var out := ""
	for part in split(text):
		if part.has("text"):
			out += part.text
	return out.strip_edges()
