# Earth Science Lab

A gamified science learning platform for middle schoolers (ages 11–14). The first lab is **Soil Science**. Earth science, environmental science, biology, and chemistry show as "coming soon" on the hub.

## Soil Science lab

| Area | Route | What it does |
| --- | --- | --- |
| Learn: Soil Science Curriculum | `/soil/learn` | A K-12 curriculum: 5 units and 16 lessons, each written at Elementary (K-5), Middle (6-8), and High School (9-12) depth. Every lesson has objectives, vocabulary, cited sections, an interactive (texture triangle, 3D profile, food web, nitrogen and carbon cycles, pH scale, and more), a hands-on activity, a quiz, sources, and NGSS standards. A grade-level dropdown in the header switches the depth everywhere. |
| Teacher Guide | `/soil/teach` | Printable unit plans by level: driving questions, objectives, vocabulary, activities, standards, and pacing. |
| Sources | `/soil/sources` | The bibliography every lesson draws on (USDA NRCS, Soil Science Society of America, FAO, Smithsonian, NOAA, Weil & Brady, Jenny). |
| Soil & Sprout | `/soil/game` | A cozy 3D farming game in the spirit of Stardew Valley. You inherit an overgrown organic garden: walk around, clear weeds, sticks, and stones, till, plant, water, and harvest. Crops grow over in-game days, and the clock only runs while you play. The soil under every tile stays hidden until you test it (lab kit, shovel test, infiltration ring). Seasons and daily weather matter: rain waters crops, storms wash away bare soil, heat waves dry it, and frost kills tender plants. Sell produce at Seed & Soil Co. or the shipping bin (organic sells for 25% more), then buy seeds, amendments, a bigger watering can, and buildings: a greenhouse for growing in any season, a compost bin, rain barrel, beehive, bird house, bug hotel, scarecrow, fences, flower beds, and paths. Bugs, fungi, birds, pond life, and weather go in a Nature Journal whose facts follow the grade level. |
| Soil Globe | `/soil/globe` | A 3D globe with 50 regions colored by USDA soil order or by texture class, region cards with a texture-triangle plot, and a "Guess the Soil" quiz. |

## Periodic Table (every page)

A 3D periodic table that opens on top of any page, so students keep their place. Open it with the ⚛️ **Elements** button in the header or the **E** key, and close it with **Esc**. It also has its own page at `/elements`, and `/elements?z=26` links straight to an element. Element names in lesson text (nitrogen, phosphorus, iron, and more) link into it.

- All 118 elements, colored by category, with search and category filters. The 3D view can raise the tiles into bars by atomic mass or by abundance in Earth's crust. A flat grid view is the default on phones.
- Picking an element shows its facts, where it's found (universe, Earth, living things, everyday uses), and a 3D atom: a proton and neutron nucleus with electrons in orbiting shells, or a fuzzy electron cloud view.
- **Soil Builders:** the 26 elements found naturally in soil carry a small soil mark on their tiles. The 🪱 Soil Builders lens stands them on a 3D soil slab and fades the rest. It groups them by job (mineral framework, organic matter & life, macronutrients, micronutrients, and harmful pollutants) and shows a "what soil is made of" bar. An "In soil" height mode raises each tile by its share of soil. Each soil element's panel gets an "In soil" card explaining its job.
- Exploring elements earns XP and 4 badges.

Progress (XP, levels, 18 badges, lesson scores, visited regions, journal pages) is saved in the browser's localStorage. There are no accounts. The farm saves itself every in-game hour, when you sleep, and when you leave the page.

### Soil & Sprout controls

| Key | Action |
| --- | --- |
| W A S D or arrows | Walk |
| Space | Use the item in your hand on the tile in front of you (harvests ripe crops, observes critters) |
| E | Interact whatever you're holding: talk to townsfolk, harvest, observe critters, open buildings and the notice board |
| Q | Quest log |
| 1–0 | Pick a hotbar slot |
| I | Bag (click two slots to swap) |
| J | Nature Journal |
| P | Pick up a building you placed |
| Esc | Pause menu: resume, change settings, or save and quit to the main menu |
| Mouse wheel | Zoom |

On touch screens, an on-screen D-pad and action button appear.

### Main menu and game settings

The game opens on a main menu. **Start** begins a new farm with the recommended (Classic) settings, **Continue** loads your saved farm, and **New Game** opens a setup screen (farmer, science features, time speed, calendar). There's one save per browser, kept in localStorage.

- **Science features** (`src/world/settings.ts`): 18 realism features that can each be switched on or off: hidden soil, crop grades from soil, pH, nutrients, tillage damage, living soil, erosion, thirsty plants, waterlogging, crop rotation, planting seasons, pollinators, weeds, pests, temperature, frost & snow, energy, and bedtime. Presets: Sandbox (all off), Classic (all but waterlogging and temperature), and Real Science (all on). They can be changed mid-game from the pause menu.
- **Time speed**: 1× (one game minute per real minute) up to 60× (one game hour per real minute).
- **Calendar**: 12 months of 5–30 days. Seasons start on the 21st of March, June, September, and December, scaled for shorter months (the 3rd for 5-day months). Seasons can be turned off for an endless mild growing season. Crop growing times are real seed-packet days at 30-day months and scale down with shorter months.
- **Temperature**: each day has a high and low from a temperate climate curve (cold Januaries, hot Julys). Rain near freezing falls as snow, and clear nights below freezing bring frost. Shown in °F or °C.

**Crop grades** (`src/world/grades.ts`): every harvest gets a grade from E (lowest) through D, C, B, A, to S (highest). Higher grades sell for more (E ×0.5 up to S ×2.2) and yield more. With the "Crop grades from soil" feature on, the grade comes from soil health, minus a penalty for hours the crop spent thirsty, waterlogged, weedy, or with pests, plus a bonus from amendments. With it off, only amendments raise the grade: compost, biochar, and fertilizer +2, mulch +1, lime +1 (+2 on acidic soil), so one compost gives C and three give S. Amendment bonuses are used up at harvest. Harvest amounts are a seeded roll in each crop's per-tile range (beans 2–5, tomatoes and potatoes 3–8, carrots 3–6, corn, wheat, and buckwheat 2–4, squash and sunflowers 1–3), scaled by grade: about half at E, normal at C, and up to triple at S. Graded produce stacks by grade. **Space** uses the item in your hand; **E** always harvests, observes, or opens.

**Adding a science feature:** add it to `SCIENCE_FEATURES`, wrap its code in `on(state, "yourId")`, and add a test in `src/world/settings.test.ts` showing it has no effect when off. A test fails if a feature is registered but never checked, or checked but not registered.

### The town

The map is two halves joined by a road through a forest strip: your farm on the west, and a town on the east (`src/world/map.ts`, `src/world/town.ts`). The town has Seed & Soil Co. (where you buy and sell), the County Extension Office, a square with a fountain and notice board, cottages, the Ortegas' cornfield, and an overgrown community garden. You can't build in town; buildings go on your own farm. Saves from before the town keep their farm and gain the town.

- **Townsfolk**: Mei Tanaka (shopkeeper), Dr. Amara Okafor (soil scientist at the Extension Office), June Hale (beekeeper and naturalist), and Luis and Pip Ortega (the neighbor farmer and his kid). Each follows a daily schedule, walking between stops and going indoors at night. Face someone and press **E** to talk.
- **Friendship**: one chat and one gift a day raise friendship, up to 10 hearts. Everyone has loved, liked, and disliked gifts. New heart levels unlock personal stories and new quests.
- **Quests** (`src/world/quests.ts`): story quests from each person (deliveries, science requests like testing soil spots or raising pH, finding critters), and a three-step community project to restore the garden. The notice board posts two delivery requests a day that pay well and come down after 3 days. Deliveries take your lowest qualifying grade first. **Q** opens the quest log.

### Godot port (in progress)

Soil & Sprout is being ported to [Godot 4](https://godotengine.org) (GDScript) so it can run on the web and, later, on desktop and Steam. The project lives in `godot/`. Its web build is embedded at `/soil/game/godot` and shares the farm save (the same localStorage key and JSON format) and the site's grade level with the current game, which stays at `/soil/game` until the port catches up.

| Command | What it does |
| --- | --- |
| `npm run godot:fetch` | Downloads the pinned Godot editor and the web export templates into `.godot-cache/` (about 70 MB; the templates are read straight out of the release archive) |
| `npm run godot:test` | Runs the GDScript tests in `godot/tests` headless |
| `npm run godot:export` | Copies `public/models` into the project, imports it, and exports the web build to `public/godot/` (gitignored) |

The TypeScript engine in `src/world` is the reference while the port is under way: `src/world/godot-golden.test.ts` writes fixtures to `godot/tests/golden/`, and the GDScript tests must reproduce them exactly. Regenerate them with `GOLDEN=1 npx vitest run godot-golden`; `npm test` fails if they're stale. Site ↔ game messages are documented in `godot/autoload/Site.gd`.

### Game art

The farm's 3D models and item pictures are free CC0 packs by [Kenney](https://kenney.nl) (Nature Kit, Fantasy Town Kit, Survival Kit, Food Kit, Mini Characters) and [Quaternius](https://quaternius.com) (Ultimate Crops: carrots, corn, pumpkins, tomatoes, wheat), committed under `public/models` and `public/icons`. Quaternius's OBJ source files live in `assets-src/quaternius-crops`; `npm run assets` converts the ones the game uses to compressed GLB (rebuilding any missing `.mtl` colors from the pack's shared palette) and keeps only the three animations the farmers use. `npm run assets` re-downloads the packs, copies only the models the game uses, renders the item icons, and writes `public/models/CREDITS.md`. Each model has a hand-built fallback shape, so the game still works while models load. Crops are composed from these parts at four growth stages (sprout, young, mature, ripe) in `src/components/world/scene/cropLooks.ts`, including real flower colors before fruit sets.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- Three.js via `@react-three/fiber` and `@react-three/drei` (globe, soil profile, farm game)
- `zustand` for progress, `d3-geo` + `world-atlas` for the globe texture (no external images)
- Vitest for logic tests, plus a Playwright smoke test

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Checks

```bash
npm run typecheck
npm run lint
npm test           # texture classifier, farm simulation, progress rules, data consistency
npm run build
npm start &        # then:
npm run smoke      # loads every page in Chromium, plays the farm game, fails on console errors
```

## Project layout

```
app/                       routes (hub, /soil, /soil/learn/[slug], /soil/game, /soil/globe)
src/content/soil/          curriculum (units, leveled lessons, quizzes) and the source registry
src/data/                  soil orders, globe regions, and the 118 elements
src/lib/soil/              USDA texture-triangle classifier
src/game/                  crop data (what each crop takes from and gives back to the soil) and the seeded RNG
src/world/                 the farm game's pure simulation: clock, weather, map, items, engine, nature, journal
src/store/                 progress rules (pure) and the zustand store
src/components/            UI, split into learn/, world/, globe/, elements/
public/models, public/icons Kenney CC0 game art (regenerate with npm run assets)
```

The farm simulation (`src/world/engine.ts`) is pure: `state + action → state`, with seeded weather, weeds, pests, and critters. `tick(state, minutes)` advances the clock; tools, planting, the shop, and building are plain functions. React (`src/components/world/`) only renders it: a zustand store runs the clock with `requestAnimationFrame`, pauses for menus and hidden tabs, and saves to localStorage. Tests in `src/world/engine.test.ts` cover growth, weather, frost, the greenhouse, money, composting, saving, and the journal.

Adding a new lab means adding routes under `app/<lab>/`, content under `src/content/<lab>/`, and enabling its tile in `app/page.tsx`.

See [CONTENT_SOURCES.md](CONTENT_SOURCES.md) for where the science content comes from and which facts to double-check.
