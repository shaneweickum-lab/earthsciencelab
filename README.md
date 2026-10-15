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
| E | Talk, open buildings, and harvest |
| 1–0 | Pick a hotbar slot |
| I | Bag (click two slots to swap) |
| J | Nature Journal |
| P | Pick up a building you placed |
| Mouse wheel | Zoom |

On touch screens, an on-screen D-pad and action button appear.

### Game art

The farm's 3D models and item pictures are free CC0 packs by [Kenney](https://kenney.nl) (Nature Kit, Fantasy Town Kit, Survival Kit, Mini Characters), committed under `public/models` and `public/icons`. `npm run assets` re-downloads the packs, copies only the models the game uses, renders the item icons, and writes `public/models/CREDITS.md`. Each model has a hand-built fallback shape, so the game still works while models load.

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
