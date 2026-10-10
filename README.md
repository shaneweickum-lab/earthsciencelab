# Earth Science Lab

A gamified science learning platform for middle schoolers (ages 11–14). The first lab is **Soil Science**. Earth science, environmental science, biology, and chemistry show as "coming soon" on the hub.

## Soil Science lab

| Area | Route | What it does |
| --- | --- | --- |
| Learn: Soil Health & Quality | `/soil/learn` | Six lessons, each with an interactive (texture triangle, 3D soil profile, erosion sim, and more) and a quiz worth XP. |
| Regenerate the Field | `/soil/game` | A 12-season turn-based game. Restore a degraded 3×3 farm with cover crops, compost, no-till, grazing, hedgerows, and biochar, or try the conventional shortcuts and see what happens. |
| Soil Globe | `/soil/globe` | A 3D globe with 50 regions colored by USDA soil order or by texture class, region cards with a texture-triangle plot, and a "Guess the Soil" quiz. |

## Periodic Table (every page)

A 3D periodic table that opens on top of any page, so students keep their place. Open it with the ⚛️ **Elements** button in the header or the **E** key, and close it with **Esc**. It also has its own page at `/elements`, and `/elements?z=26` links straight to an element. Element names in lesson text (nitrogen, phosphorus, iron, and more) link into it.

- All 118 elements, colored by category, with search and category filters. The 3D view can raise the tiles into bars by atomic mass or by abundance in Earth's crust. A flat grid view is the default on phones.
- Picking an element shows its facts, where it's found (universe, Earth, living things, everyday uses), and a 3D atom: a proton and neutron nucleus with electrons in orbiting shells, or a fuzzy electron cloud view.
- **Soil Builders:** the 26 elements found naturally in soil carry a small soil mark on their tiles. The 🪱 Soil Builders lens stands them on a 3D soil slab and fades the rest. It groups them by job (mineral framework, organic matter & life, macronutrients, micronutrients, and harmful pollutants) and shows a "what soil is made of" bar. An "In soil" height mode raises each tile by its share of soil. Each soil element's panel gets an "In soil" card explaining its job.
- Exploring elements earns XP and 4 badges.

Progress (XP, levels, 17 badges, lesson scores, visited regions, best game) is saved in the browser's localStorage. There are no accounts. An in-progress game also resumes after a refresh.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- Three.js via `@react-three/fiber` and `@react-three/drei` (globe, soil profile, game board)
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
npm test           # texture classifier, game balance, progress rules, data consistency
npm run build
npm start &        # then:
npm run smoke      # loads every page in Chromium, plays a few turns, fails on console errors
```

## Project layout

```
app/                       routes (hub, /soil, /soil/learn/[slug], /soil/game, /soil/globe)
src/content/soil/          lesson text and quizzes
src/data/                  soil orders, globe regions, and the 118 elements
src/lib/soil/              USDA texture-triangle classifier
src/game/                  pure, seeded game engine, practices, and test strategies
src/store/                 progress rules (pure) and the zustand store
src/components/            UI, split into learn/, game/, globe/, elements/
```

The game engine (`src/game/engine.ts`) is pure: `state + action → state`, with a seeded RNG. Balance tests in `engine.test.ts` check that a regenerative strategy wins across several seeds, while plow-and-fertilize and do-nothing strategies degrade the soil. Rerun them after changing any numbers.

Adding a new lab means adding routes under `app/<lab>/`, content under `src/content/<lab>/`, and enabling its tile in `app/page.tsx`.

See [CONTENT_SOURCES.md](CONTENT_SOURCES.md) for where the science content comes from and which facts to double-check.
