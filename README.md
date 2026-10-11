# Earth Science Lab

A gamified science learning platform for middle schoolers (ages 11–14). The first lab is **Soil Science**. Earth science, environmental science, biology, and chemistry show as "coming soon" on the hub.

## Soil Science lab

| Area | Route | What it does |
| --- | --- | --- |
| Learn: Soil Science Curriculum | `/soil/learn` | A K-12 curriculum: 5 units and 16 lessons, each written at Elementary (K-5), Middle (6-8), and High School (9-12) depth. Every lesson has objectives, vocabulary, cited sections, an interactive (texture triangle, 3D profile, food web, nitrogen and carbon cycles, pH scale, and more), a hands-on activity, a quiz, sources, and NGSS standards. A grade-level dropdown in the header switches the depth everywhere. |
| Teacher Guide | `/soil/teach` | Printable unit plans by level: driving questions, objectives, vocabulary, activities, standards, and pacing. |
| Sources | `/soil/sources` | The bibliography every lesson draws on (USDA NRCS, Soil Science Society of America, FAO, Smithsonian, NOAA, Weil & Brady, Jenny). |
| Regenerate the Field | `/soil/game` | A 12-season game. You inherit an overgrown organic garden: weed it, run soil tests (lab, shovel, infiltration) to uncover each plot's hidden soil, plant crops from a seed bag (each packet explains what the crop takes from the soil and what it gives back; rotate plant families to dodge pests), then restore it with cover crops, compost, no-till, grazing, hedgerows, and biochar. Take as many actions as you can afford. Every action shows a preview of exactly what it will do to the plot before you confirm it. Synthetic shortcuts cost you your organic certification. |
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
src/content/soil/          curriculum (units, leveled lessons, quizzes) and the source registry
src/data/                  soil orders, globe regions, and the 118 elements
src/lib/soil/              USDA texture-triangle classifier
src/game/                  pure, seeded game engine, practices, and test strategies
src/store/                 progress rules (pure) and the zustand store
src/components/            UI, split into learn/, game/, globe/, elements/
```

The game engine (`src/game/engine.ts`) is pure: `state + action → state`, with a seeded RNG. Balance tests in `engine.test.ts` check that a regenerative strategy wins across several seeds, while plow-and-fertilize and do-nothing strategies degrade the soil. Rerun them after changing any numbers.

Adding a new lab means adding routes under `app/<lab>/`, content under `src/content/<lab>/`, and enabling its tile in `app/page.tsx`.

See [CONTENT_SOURCES.md](CONTENT_SOURCES.md) for where the science content comes from and which facts to double-check.
