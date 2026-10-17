extends Node
## The game's state, shared by the 3D scene and the UI (the Godot version of useWorld.ts).
##
## `world` is the engine's world Dictionary. Change it only through update() so listeners
## hear about it. `runtime` holds per-frame values that would be wasteful to keep in the
## world: the player's exact position while walking, and the fraction of the current minute.

signal world_changed
signal menu_changed
signal message(text: String)

var world: Dictionary = {}
## The open menu or dialog ("" when playing): house, store, shipping, board, bag, journal, summary…
var menu := ""

var runtime := {
	"player": {"x": 10.0, "y": 10.0, "facing": "down"},
	"moving": false,
	"action_at": 0,
	"minute_frac": 0.0,
}


func has_world() -> bool:
	return not world.is_empty()


func set_world(w: Dictionary) -> void:
	world = w
	runtime.player = w.player.duplicate()
	world_changed.emit()


## Replace the world with fn(world). Messages it adds are announced.
func update(fn: Callable) -> void:
	var before := world
	world = fn.call(world)
	# is_same, not ==: == compares dictionaries deeply (every tile), which is far too slow.
	if is_same(world, before):
		return
	if not is_same(world.player, before.player):
		runtime.player = world.player.duplicate()
	var old_n: int = before.messages.size() if before.has("messages") else 0
	var new_msgs: Array = world.messages
	if new_msgs.size() and (old_n == 0 or not is_same(new_msgs[-1], before.messages[-1])):
		message.emit(new_msgs[-1].text)
	world_changed.emit()


func open(name: String) -> void:
	menu = name
	menu_changed.emit()


func close() -> void:
	open("")


var saved := false


func save() -> void:
	if has_world():
		SaveIO.write(World.save_world(Js.with(world, {"player": runtime.player})))
		saved = true


## Continue the saved farm, or start a new one.
func load_or_new() -> void:
	var w = World.load_world(SaveIO.read())
	saved = w != null
	if w == null:
		w = World.new_world(randi() % 2147483647)
	set_world(w)


func _notification(what: int) -> void:
	# Save when the tab or window closes.
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_APPLICATION_PAUSED:
		save()
