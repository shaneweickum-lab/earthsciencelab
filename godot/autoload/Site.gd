extends Node
## The bridge to the Earth Science Lab website that embeds the web build.
##
## Protocol (the page is app/soil/game/godot/page.tsx):
## - The page loads /godot/index.html?grade=elementary|middle|high.
## - It posts {type: "grade", level} when the reader changes their grade level.
## - Godot posts {type: "soil:ready"} once it starts, {type: "soil:recordFarm", ...} for badges,
##   and {type: "soil:setGrade", level} when the player changes the level in the game.
##   Godot never writes the site's progress key itself.
## Outside a browser (the editor, tests, desktop), the grade level is "middle".

signal grade_changed(level: String)

const LEVELS := ["elementary", "middle", "high"]
const PROGRESS_KEY := "earthsciencelab-progress"

var grade_level := "middle"
## Debug switches from ?debug=a,b (web only), for measuring performance.
var debug := PackedStringArray()
var _on_message: JavaScriptObject  # kept alive so the browser callback isn't freed


func _ready() -> void:
	if not is_web():
		return
	debug = _query_param("debug").split(",", false)
	var from_url := _query_param("grade")
	grade_level = from_url if from_url in LEVELS else _saved_grade()
	_on_message = JavaScriptBridge.create_callback(_message)
	JavaScriptBridge.get_interface("window").addEventListener("message", _on_message)
	post({"type": "soil:ready"})


static func is_web() -> bool:
	return OS.has_feature("web")


## Change the grade level from inside the game; the site remembers it.
func set_grade(level: String) -> void:
	if not level in LEVELS:
		return
	grade_level = level
	grade_changed.emit(level)
	post({"type": "soil:setGrade", "level": level})


## Send a message to the page that embeds the game.
func post(data: Dictionary) -> void:
	if not is_web():
		return
	JavaScriptBridge.eval("window.parent.postMessage(%s, location.origin)" % JSON.stringify(data), true)


func _message(args: Array) -> void:
	var data = _event_data(args[0]) if not args.is_empty() else null
	if data is Dictionary and data.get("type") == "grade" and data.get("level") in LEVELS:
		grade_level = data.level
		grade_changed.emit(grade_level)


func _event_data(event: JavaScriptObject) -> Variant:
	if str(event.origin) != str(JavaScriptBridge.eval("location.origin", true)):
		return null
	return JSON.parse_string(str(JavaScriptBridge.get_interface("JSON").stringify(event.data)))


func _query_param(name: String) -> String:
	var v = JavaScriptBridge.eval("new URLSearchParams(location.search).get(%s) ?? ''" % JSON.stringify(name), true)
	return str(v) if v != null else ""


## The level saved by the site (zustand persist: {state: {gradeLevel}}).
func _saved_grade() -> String:
	var raw = JavaScriptBridge.eval("localStorage.getItem(%s)" % JSON.stringify(PROGRESS_KEY), true)
	var parsed = JSON.parse_string(str(raw)) if raw != null else null
	if parsed is Dictionary and parsed.get("state") is Dictionary and parsed.state.get("gradeLevel") in LEVELS:
		return parsed.state.gradeLevel
	return "middle"
