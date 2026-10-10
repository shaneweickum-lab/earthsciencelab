# Earth Science Lab

A gamified science learning platform for middle schoolers (ages 11–14). The first lab is **Soil Science**. Earth science, environmental science, biology, and chemistry show as "coming soon" on the hub.

## Soil Science lab

| Area | Route | What it does |
| --- | --- | --- |
| Learn: Soil Health & Quality | `/soil/learn` | Six lessons, each with an interactive (texture triangle, 3D soil profile, erosion sim, and more) and a quiz worth XP. |
| Regenerate the Field | `/soil/game` | A 12-season turn-based game. Restore a degraded 3×3 farm with cover crops, compost, no-till, grazing, hedgerows, and biochar, or try the conventional shortcuts and see what happens. |
| Soil Globe | `/soil/globe` | A 3D globe with 50 regions colored by USDA soil order or by texture class, region cards with a texture-triangle plot, and a "Guess the Soil" quiz. |

Progress (XP, levels, 13 badges, lesson scores, visited regions, best game) is saved in the browser's localStorage. There are no accounts. An in-progress game also resumes after a refresh.

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
src/data/                  soil orders and globe regions
src/lib/soil/              USDA texture-triangle classifier
src/game/                  pure, seeded game engine, practices, and test strategies
src/store/                 progress rules (pure) and the zustand store
src/components/            UI, split into learn/, game/, globe/
```

The game engine (`src/game/engine.ts`) is pure: `state + action → state`, with a seeded RNG. Balance tests in `engine.test.ts` check that a regenerative strategy wins across several seeds, while plow-and-fertilize and do-nothing strategies degrade the soil. Rerun them after changing any numbers.

Adding a new lab means adding routes under `app/<lab>/`, content under `src/content/<lab>/`, and enabling its tile in `app/page.tsx`.

See [CONTENT_SOURCES.md](CONTENT_SOURCES.md) for where the science content comes from and which facts to double-check.
