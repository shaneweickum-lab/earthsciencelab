class_name SkyView
extends Node3D
## Daylight, sky color, fog, and rain or snow around the player. Port of Sky and
## Precipitation in WorldScene.tsx.

const DAY_SKY := Color("#bfe3f2")
const DUSK_SKY := Color("#f2b48a")
const NIGHT_SKY := Color("#0f1a2e")
const GRAY_SKY := Color("#a9b5bf")

var env := Environment.new()
var sun := DirectionalLight3D.new()
var _rain: CPUParticles3D
var _snow: CPUParticles3D
var _weather := ""


func _init() -> void:
	env.background_mode = Environment.BG_COLOR
	env.ambient_light_source = Environment.AMBIENT_SOURCE_COLOR
	env.fog_enabled = true
	env.fog_mode = Environment.FOG_MODE_DEPTH
	env.fog_depth_begin = 30
	env.fog_depth_end = 60
	var we := WorldEnvironment.new()
	we.environment = env
	add_child(we)
	sun.shadow_enabled = true
	sun.directional_shadow_mode = DirectionalLight3D.SHADOW_ORTHOGONAL
	sun.directional_shadow_max_distance = 40
	add_child(sun)
	_rain = _particles(Color("#a9c9e6"), Vector3(0.02, 0.35, 0.02), 900, 14.0)
	_snow = _particles(Color.WHITE, Vector3(0.1, 0.1, 0.1), 900, 1.6)


func _particles(color: Color, size: Vector3, amount: int, speed: float) -> CPUParticles3D:
	var p := CPUParticles3D.new()
	var mesh := BoxMesh.new()
	mesh.size = size
	var m := StandardMaterial3D.new()
	m.albedo_color = Color(color, 0.8)
	m.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	m.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mesh.material = m
	p.mesh = mesh
	p.amount = amount
	p.lifetime = 12.0 / speed
	p.emission_shape = CPUParticles3D.EMISSION_SHAPE_BOX
	p.emission_box_extents = Vector3(15, 0.5, 13)
	p.position.y = 12
	p.direction = Vector3.DOWN
	p.spread = 3 if speed > 5 else 25
	p.gravity = Vector3.ZERO
	p.initial_velocity_min = speed
	p.initial_velocity_max = speed
	p.preprocess = p.lifetime
	p.emitting = false
	p.local_coords = false
	add_child(p)
	return p


func update(world: Dictionary, player: Dictionary) -> void:
	var minute: float = world.minute
	var d := Clock.daylight(minute)
	var h := fmod(Clock.time_of_day(minute), 1440.0) / 60.0
	var weather := World.today_weather(world)
	var gloomy := weather in ["rain", "storm", "fog", "snow", "cloudy"]
	var dusk := 0.0
	if h > 17 and h < 21:
		dusk = 1 - absf(h - 19) / 2
	elif h > 5 and h < 8:
		dusk = 1 - absf(h - 6.5) / 1.5
	var sky := NIGHT_SKY.lerp(GRAY_SKY if gloomy else DAY_SKY, d)
	if not gloomy:
		sky = sky.lerp(DUSK_SKY, maxf(0, dusk) * 0.6)
	env.background_color = sky
	env.fog_light_color = sky
	if weather == "fog":
		env.fog_depth_begin = 6
		env.fog_depth_end = 22
	else:
		env.fog_depth_begin = 30
		env.fog_depth_end = 60
	env.ambient_light_color = Color("#7b8fd1") if d < 0.3 else Color.WHITE
	# Matched by eye to the web game (three.js lights are in different units).
	env.ambient_light_energy = 0.18 + d * 0.22
	sun.light_energy = 0.1 + d * (0.3 if gloomy else 0.55)
	sun.light_color = Color("#ffd2a0") if dusk > 0.3 else Color("#fff6e5")
	var angle := ((h - 6) / 14) * PI
	var target := Vector3(player.x, 0, player.y)
	var from := target + Vector3(cos(angle) * 14, 6 + sin(maxf(0.2, angle)) * 14, 6)
	sun.look_at_from_position(from, target)
	if weather != _weather:
		_weather = weather
		_rain.emitting = weather == "rain" or weather == "storm"
		_rain.amount = 1400 if weather == "storm" else 900
		_snow.emitting = weather == "snow"
	_rain.position = Vector3(player.x, 12, player.y)
	_snow.position = Vector3(player.x, 12, player.y)
