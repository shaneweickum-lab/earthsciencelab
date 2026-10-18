extends Node
## The game's state, shared by the 3D scene and the UI (the Godot version of useWorld.ts).
##
## `world` is the engine's world Dictionary. Change it only through update() so listeners
## hear about it. `runtime` holds per-frame values that would be wasteful to keep in the
## world: the player's exact position while walking, and the fraction of the current minute.

signal world_changed
signal menu_changed
signal screen_changed
signal message(text: String)

var world: Dictionary = {}
## "menu" (the main menu), "setup" (new game), or "playing".
var screen := "menu"
## The open menu or dialog ("" when playing): intro, house, tv, store, shipping, bag, journal,
## summary, pause, npc, board, quests.
var menu := ""
## The saved farm, for the main menu's Continue button (null when there isn't one).
var saved_world: Variant = null
## Which townsperson you're talking to, and what they said when you started.
var talking_to := ""
## The chest that's open.
var chest_id := ""
var npc_line := ""

var runtime := {
	"player": {"x": 10.0, "y": 10.0, "facing": "down"},
	"moving": false,
	"minute_frac": 0.0,
	## Movement from on-screen buttons (touch): up, down, left, right.
	"touch": {},
}


func _ready() -> void:
	saved_world = World.load_world(SaveIO.read())


func has_world() -> bool:
	return not world.is_empty() and screen == "playing"


## True when there's a saved farm (for the smoke test and the site).
var saved: bool:
	get: return saved_world != null


func _begin(w: Dictionary) -> void:
	world = w
	runtime.player = w.player.duplicate()
	screen = "playing"
	menu = "" if w.get("introSeen", false) else "intro"
	save()
	screen_changed.emit()
	world_changed.emit()
	menu_changed.emit()


## Start: a new farm with the recommended settings.
func start_quick() -> void:
	_begin(World.new_world(_new_seed(), Settings.defaults()))


## New Game: a new farm with the settings picked on the setup screen.
func start_new(settings: Dictionary, avatar: String) -> void:
	_begin(Js.with(World.new_world(_new_seed(), settings), {"avatar": avatar}))


func continue_game() -> void:
	var w = World.load_world(SaveIO.read())
	if w != null:
		_begin(w)


func open_setup() -> void:
	screen = "setup"
	screen_changed.emit()


func back_to_menu() -> void:
	screen = "menu"
	screen_changed.emit()


## Save, then return to the main menu.
func quit_to_menu() -> void:
	save()
	saved_world = World.load_world(SaveIO.read())
	world = {}
	menu = ""
	screen = "menu"
	screen_changed.emit()
	menu_changed.emit()


func update_settings(settings: Dictionary) -> void:
	update(func(w): return Js.with(w, {"settings": settings}))


func _new_seed() -> int:
	return int(Time.get_unix_time_from_system() * 1000) % 2147483647


## Replace the world with fn(world). Messages it adds are announced.
func update(fn: Callable) -> void:
	if world.is_empty():
		return
	var before := world
	world = fn.call(Js.with(world, {"player": runtime.player}))
	runtime.player = world.player.duplicate()
	var msgs: Array = world.messages
	if msgs.size() and (before.messages.is_empty() or not is_same(msgs[-1], before.messages[-1])):
		message.emit(msgs[-1].text)
	world_changed.emit()


func open(name: String) -> void:
	# Each morning, notice-board requests past their date come down.
	if name == "summary" and not world.is_empty():
		world = Quests.expire_board(world)
		world_changed.emit()
	menu = name
	menu_changed.emit()


func close() -> void:
	open("")


func talk_to(id: String) -> void:
	var r := Town.talk(Js.with(world, {"player": runtime.player}), id)
	world = r.state
	talking_to = id
	npc_line = r.text
	world_changed.emit()
	open("npc")


## Pick up changes the website made to the save (My Homestead), keeping where you stand.
func reload_save() -> void:
	if world.is_empty():
		return
	var w = World.load_world(SaveIO.read())
	if w == null:
		return
	world = Js.with(w, {"player": runtime.player})
	saved_world = world
	world_changed.emit()


func save() -> void:
	if world.is_empty():
		return
	SaveIO.write(World.save_world(Js.with(world, {"player": runtime.player})))
	saved_world = world
	_sync_progress()


## Journal pages, harvests, and soil health count toward the site's XP and badges.
func _sync_progress() -> void:
	var best := 0.0
	for t in world.tiles:
		if t.ground == "farm" and t.known.lab and t.known.shovel and t.known.water:
			best = maxf(best, Grades.soil_health(t))
	Site.post({"type": "soil:recordFarm", "journal": world.journal, "harvests": world.harvests, "bestSoilHealth": best})


func _notification(what: int) -> void:
	# Save when the tab or window closes.
	if what == NOTIFICATION_WM_CLOSE_REQUEST or what == NOTIFICATION_APPLICATION_PAUSED or what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		save()
