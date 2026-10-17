class_name Preview
## Port of src/world/preview.ts: tells the player what pressing Space will do on the tile in
## front of them, before they do it. Returns {label, text, ok}.


static func _r(label: String, text: String, ok: bool) -> Dictionary:
	return {"label": label, "text": text, "ok": ok}


## How many more swings an obstacle needs with this tool.
static func _swings(t: Dictionary, def: Dictionary, verb: String) -> String:
	var hp: int = World.OBSTACLE_HP[t.obstacle] - int(t.get("hits", 0))
	var n := int(ceil(float(hp) / Data.tiers()[def.tool.tier].power))
	var tree := " Trees shelter wildlife; a felled one sprouts again from its stump." if t.obstacle == "tree" else ""
	return "%s the %s: %d more swing%s.%s" % [verb, t.obstacle, n, "" if n == 1 else "s", tree]


static func preview_action(state: Dictionary) -> Dictionary:
	var slot = World.selected_item(state)
	var f := World.facing_tile(state)
	var x: int = f.x
	var y: int = f.y
	var t = World.tile_at(state, x, y)
	if t == null:
		return _r("", "", false)
	var b = World.building_at(state, x, y)
	if b != null and b.kind == "chest":
		return _r("Open", "Open the chest to take things out or put them away.", true)
	if World._crit_at(state, x, y) != null:
		return _r("Observe", "Look closely and add it to your Nature Journal.", true)
	var c = t.crop

	if not slot:
		if c and c.growth >= 1:
			return _r("Harvest", "Pick the %s." % Items.crop(c.id).name.to_lower(), true)
		return _r("Hands", "Nothing to pick up here.", false)
	var def: Dictionary = Data.items()[slot.item]

	if c and c.growth >= 1 and not c.dead and def.kind != "amendment":
		if Items.world_crop(c.id).get("cover", false):
			return _r("Harvest", "Dig the clover into the soil as green manure.", true)
		return _r("Harvest", "Pick the %s." % Items.crop(c.id).name.to_lower(), true)

	var is_garden: bool = t.ground == "farm" or t.greenhouse
	match def.kind:
		"seed":
			var why := World.can_plant_here(state, x, y, def.crop)
			if why:
				return _r("Plant", why, false)
			var info := Items.crop(def.crop)
			return _r("Plant", "Plant %s. %s" % [info.name, info.givesText], true)
		"amendment":
			if not is_garden:
				return _r("Apply", "Use this on garden soil.", false)
			if slot.item == "labKit" and not Settings.on(state, "soilTesting"):
				return _r("Test", "Soil numbers are already visible (Hidden soil is off).", false)
			if slot.item == "labKit":
				if t.known.lab:
					return _r("Test", "You already have lab results here.", false)
				return _r("Test", "Reveals organic matter, nutrients, and pH for this spot.", true)
			var pts := Grades.amendment_points(slot.item, t)
			var room := maxf(0, Grades.MAX_BOOST - t.get("boost", 0))
			var bonus := " Raises the next crop's grade (+%s)." % Js.num(minf(pts, room)) if pts and room else ""
			return _r("Apply", def.desc + bonus, not t.obstacle)
		"kit":
			return _r("Build", "Place a %s. %s" % [def.name, def.desc], true)
		"tool":
			pass
		_:
			return _r("", "", false)

	match def.tool.use:
		"hoe":
			if not is_garden:
				return _r("Till", "Only the garden field can be tilled.", false)
			if t.obstacle:
				return _r("Till", "Clear the %s first." % t.obstacle, false)
			if t.weeds:
				return _r("Till", "Cut the weeds with the scythe first.", false)
			if t.tilled:
				return _r("Till", "Already tilled.", false)
			if Settings.on(state, "tillage"):
				return _r("Till", "Loosen the soil for seeds. Tilling breaks soil crumbs a little (structure −2).", true)
			return _r("Till", "Loosen the soil for seeds.", true)
		"can":
			if t.ground == "water":
				return _r("Refill", "Fill your watering can.", true)
			if b and b.kind == "rainBarrel":
				return _r("Refill", "Refill with rainwater.", true)
			if b and b.kind == "well":
				return _r("Refill", "Fill your can with groundwater from the well.", true)
			if state.water <= 0:
				return _r("Water", "Your can is empty. Refill at the pond.", false)
			if not t.tilled:
				return _r("Water", "Water tilled soil or crops.", false)
			if Settings.on(state, "waterlogging") and t.moisture >= 70:
				return _r("Water", "Careful: the soil is already wet (%s). Too much water can drown roots." % Js.num(Js.round(t.moisture)), true)
			return _r("Water", "Soak the soil (moisture %s → %s)." % [Js.num(Js.round(t.moisture)), Js.num(minf(100, Js.round(t.moisture + 45)))], true)
		"scythe":
			if t.weeds:
				return _r("Cut", "Cut the weeds and get plant fiber for compost.", true)
			if c and c.dead:
				return _r("Clear", "Clear the dead plant.", true)
			return _r("Cut", "Nothing to cut.", false)
		"axe":
			if t.obstacle and t.obstacle != "stone":
				return _r("Chop", _swings(t, def, "Chop"), true)
			return _r("Chop", "Nothing to chop.", false)
		"pickaxe":
			if t.obstacle == "stone":
				return _r("Break", _swings(t, def, "Break"), true)
			if t.tilled and not c:
				return _r("Un-till", "Flatten this tilled spot.", true)
			return _r("Break", "Nothing to break.", false)
		"shovel":
			if not is_garden:
				return _r("Dig", "Dig a test hole in the garden.", false)
			if t.obstacle or c:
				return _r("Dig", "Find an open spot to dig.", false)
			return _r("Dig", "Shovel test: count earthworms and check soil crumbs (life + structure).", true)
		"ring":
			if not is_garden:
				return _r("Test", "Test the garden soil.", false)
			return _r("Test", "Infiltration test: time how fast water soaks in (water holding).", true)
	return _r("", "", false)
