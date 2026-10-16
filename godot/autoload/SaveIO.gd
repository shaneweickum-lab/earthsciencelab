extends Node
## Reads and writes the farm save.
##
## The save is the same JSON the React game writes (engine.ts saveWorld), so farms carry
## over in both directions. On the web it lives in the site's localStorage under the same
## key; on desktop it's a file in user://. Before Godot first overwrites a save, it keeps
## a backup copy.

const KEY := "earthsciencelab-world"
const BACKUP_KEY := "earthsciencelab-world.bak"
const FILE := "user://earthsciencelab-world.json"

var _backed_up := false


## The raw save text, or "" when there isn't one.
func read() -> String:
	if Site.is_web():
		var v = JavaScriptBridge.eval("localStorage.getItem(%s)" % JSON.stringify(KEY), true)
		return str(v) if v != null else ""
	if not FileAccess.file_exists(FILE):
		return ""
	return FileAccess.get_file_as_string(FILE)


func write(text: String) -> void:
	if not _backed_up:
		_backed_up = true
		var old := read()
		if old != "" and old != text:
			_store(BACKUP_KEY, "user://earthsciencelab-world.bak.json", old)
	_store(KEY, FILE, text)


func _store(key: String, path: String, text: String) -> void:
	if Site.is_web():
		JavaScriptBridge.eval("localStorage.setItem(%s, %s)" % [JSON.stringify(key), JSON.stringify(text)], true)
		return
	var f := FileAccess.open(path, FileAccess.WRITE)
	f.store_string(text)
