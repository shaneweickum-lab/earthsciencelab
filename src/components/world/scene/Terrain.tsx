"use client";

import { useGLTF } from "@react-three/drei";
import { Suspense, useMemo } from "react";
import { H, W } from "@/world/map";
import type { Building, Season, Tile } from "@/world/types";
import { BUILDING_SIZE } from "@/world/map";
import { isWater } from "@/world/engine";
import { tileTop } from "./height";
import { hash, Instanced, type Inst } from "./Instanced";
import { groupBy, model, ModelGroups } from "./models";

const GRASS: Record<Season, string[]> = {
  Spring: ["#86b85f", "#7fb069", "#8cbf66"],
  Summer: ["#76a94f", "#6fa04a", "#7cae55"],
  Fall: ["#a9a552", "#b49a4a", "#9fa04e"],
  Winter: ["#dfe6e8", "#d6dfe2", "#e6ecee"],
};

function groundColor(t: Tile, i: number, season: Season): string {
  switch (t.ground) {
    case "grass": return GRASS[season][Math.floor(hash(i) * 3)];
    case "forest": return season === "Winter" ? "#cfd8d6" : ["#4f7a3a", "#557f3e", "#4a7336"][Math.floor(hash(i) * 3)];
    case "path": return hash(i) > 0.5 ? "#d9c49a" : "#d2bc90";
    case "sand": return "#e6d3a3";
    case "water": return "#3f7fae";
    case "cave": return "#5a4e44";
    case "caveWall": return "#3b342e";
    case "farm":
      if (t.tilled) return t.moisture > 45 ? "#4a2f1c" : "#7a5233";
      return t.greenhouse ? "#8a6a45" : season === "Winter" ? "#c9c3b4" : "#9c8458";
    case "river": return "#356f9a";
    case "sea": return "#244f78";
    case "rock": return season === "Winter" && (t.elev ?? 0) >= 2 ? "#e8eef0" : ["#8f8a80", "#97928a", "#888378"][Math.floor(hash(i) * 3)];
    case "dock": return (i % W) % 2 ? "#9a7048" : "#a57a50";
  }
}

const WATER_TOP: Record<string, string> = { water: "#5fa3cf", river: "#6fb4dc", sea: "#4f8fc4" };

/** The ground: one flat block per tile, colored by what's on it. */
export function Terrain({ tiles, season }: { tiles: Tile[]; season: Season }) {
  const ground = useMemo<Inst[]>(
    () => tiles.map((t, i) => {
      const base = { x: i % W, z: Math.floor(i / W), color: groundColor(t, i, season) };
      // Mountain terraces: a taller block, so the cliff sides show.
      const top = tileTop(t);
      if (top > 0) return { ...base, y: (top - 0.2) / 2, s: [1, (top + 0.2) / 0.2, 1] as [number, number, number] };
      return { ...base, y: isWater(t.ground) ? -0.25 : t.tilled ? -0.08 : -0.1 };
    }),
    [tiles, season],
  );
  const furrows = useMemo<Inst[]>(() => {
    const out: Inst[] = [];
    tiles.forEach((t, i) => {
      if (!t.tilled) return;
      const x = i % W, z = Math.floor(i / W);
      const wet = t.moisture > 45;
      for (const dx of [-0.3, 0, 0.3]) out.push({ x: x + dx, y: 0.03, z, color: wet ? "#3a2415" : "#6a4529" });
    });
    return out;
  }, [tiles]);
  const mulch = useMemo<Inst[]>(
    () => tiles.flatMap((t, i) => (t.mulch ? [{ x: i % W, y: 0.04, z: Math.floor(i / W), ry: hash(i) * 3 }] : [])),
    [tiles],
  );
  return (
    <group>
      <Instanced items={ground}>
        <boxGeometry args={[1, 0.2, 1]} />
        <meshStandardMaterial roughness={1} />
      </Instanced>
      <Instanced items={furrows}>
        <boxGeometry args={[0.16, 0.08, 0.92]} />
        <meshStandardMaterial roughness={1} />
      </Instanced>
      <Instanced items={mulch}>
        <boxGeometry args={[0.92, 0.05, 0.92]} />
        <meshStandardMaterial color="#d8b75a" roughness={1} />
      </Instanced>
      {/* Land beyond the map edge. */}
      <mesh position={[W / 2 - 0.5, -0.21, H / 2 - 0.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W + 60, H + 60]} />
        <meshStandardMaterial color={season === "Winter" ? "#cfd8d6" : "#466e34"} roughness={1} />
      </mesh>
    </group>
  );
}

/** Water surface over ponds, the river, and the sea, with surf where the sea meets the sand. */
export function Pond({ tiles }: { tiles: Tile[] }) {
  const { water, foam } = useMemo(() => {
    const water: Inst[] = [], foam: Inst[] = [];
    tiles.forEach((t, i) => {
      if (!isWater(t.ground)) return;
      const x = i % W, z = Math.floor(i / W);
      water.push({ x, y: -0.06, z, color: WATER_TOP[t.ground] });
      if (t.ground === "sea" && tiles[i - W]?.ground === "sand") foam.push({ x, y: -0.04, z: z - 0.35, s: [1, 1, 0.3] });
    });
    return { water, foam };
  }, [tiles]);
  return (
    <>
      <Instanced items={water}>
        <boxGeometry args={[1, 0.02, 1]} />
        <meshStandardMaterial transparent opacity={0.78} roughness={0.15} metalness={0.1} />
      </Instanced>
      <Instanced items={foam}>
        <boxGeometry args={[1, 0.03, 1]} />
        <meshStandardMaterial color="#f4f8fa" transparent opacity={0.85} roughness={0.6} />
      </Instanced>
    </>
  );
}

/** Simple shapes, shown while the models load (or if they fail). */
function ProceduralObstacles({ tiles, season }: { tiles: Tile[]; season: Season }) {
  const groups = useMemo(() => {
    const trunks: Inst[] = [], canopy: Inst[] = [], canopyTop: Inst[] = [], stones: Inst[] = [], sticks: Inst[] = [];
    const stumps: Inst[] = [], logs: Inst[] = [], weeds: Inst[] = [], flowers: Inst[] = [];
    const leaf = { Spring: ["#3f7d3a", "#4a8a3f"], Summer: ["#2f6b34", "#3a7a3a"], Fall: ["#c46a2b", "#d49a2e"], Winter: ["#2e5a3e", "#365f44"] }[season];
    tiles.forEach((t, i) => {
      const x = i % W, z = Math.floor(i / W);
      const r = hash(i + 7);
      switch (t.obstacle) {
        case "tree": {
          const s = 0.8 + r * 0.5;
          trunks.push({ x, y: 0.4 * s, z, s });
          canopy.push({ x, y: 1.15 * s, z, s, ry: r * 6, color: leaf[r > 0.5 ? 1 : 0] });
          canopyTop.push({ x, y: 1.75 * s, z, s: s * 0.75, ry: r * 3, color: leaf[r > 0.5 ? 0 : 1] });
          break;
        }
        case "stone": stones.push({ x: x + (r - 0.5) * 0.2, y: 0.12, z, s: [1, 0.6 + r * 0.3, 0.9], ry: r * 6 }); break;
        case "stick": sticks.push({ x, y: 0.05, z, ry: r * 6, rz: 0.1 }); break;
        case "stump": stumps.push({ x, y: 0.15, z, s: 0.9 + r * 0.3 }); break;
        case "log": logs.push({ x, y: 0.18, z, ry: r * 3, rz: Math.PI / 2 }); break;
        case "sapling":
          trunks.push({ x, y: 0.15, z, s: 0.35 });
          canopy.push({ x, y: 0.42, z, s: 0.35, ry: r * 6, color: leaf[0] });
          break;
      }
      if (t.weeds) {
        for (let k = 0; k < 9; k++) {
          const h = 0.6 + hash(i * 13 + k) * 0.9;
          weeds.push({
            x: x + (hash(i * 7 + k) - 0.5) * 0.8, y: 0.2 * h, z: z + (hash(i * 11 + k) - 0.5) * 0.8,
            s: [1, h, 1], rx: (hash(i + k) - 0.5) * 0.5, rz: (hash(i * 3 + k) - 0.5) * 0.5,
            color: k % 3 === 0 ? "#6f7d2a" : "#3e6b24",
          });
        }
        if (r > 0.6 && season !== "Winter") flowers.push({ x: x + 0.2, y: 0.32, z: z - 0.1 });
      }
    });
    return { trunks, canopy, canopyTop, stones, sticks, stumps, logs, weeds, flowers };
  }, [tiles, season]);
  return (
    <group>
      <Instanced items={groups.trunks} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.8, 6]} />
        <meshStandardMaterial color="#6b4a2f" flatShading />
      </Instanced>
      <Instanced items={groups.canopy} castShadow>
        <coneGeometry args={[0.65, 1.1, 7]} />
        <meshStandardMaterial flatShading />
      </Instanced>
      <Instanced items={groups.canopyTop} castShadow>
        <coneGeometry args={[0.5, 0.9, 7]} />
        <meshStandardMaterial flatShading />
      </Instanced>
      <Instanced items={groups.stones} castShadow>
        <dodecahedronGeometry args={[0.28, 0]} />
        <meshStandardMaterial color="#9a958c" flatShading />
      </Instanced>
      <Instanced items={groups.sticks}>
        <boxGeometry args={[0.7, 0.06, 0.07]} />
        <meshStandardMaterial color="#7a5636" />
      </Instanced>
      <Instanced items={groups.stumps} castShadow>
        <cylinderGeometry args={[0.28, 0.33, 0.3, 8]} />
        <meshStandardMaterial color="#7a5636" flatShading />
      </Instanced>
      <Instanced items={groups.logs} castShadow>
        <cylinderGeometry args={[0.18, 0.18, 0.85, 8]} />
        <meshStandardMaterial color="#6e4b2e" flatShading />
      </Instanced>
      <Instanced items={groups.weeds}>
        <coneGeometry args={[0.07, 0.4, 3]} />
        <meshStandardMaterial roughness={1} />
      </Instanced>
      <Instanced items={groups.flowers}>
        <sphereGeometry args={[0.05, 6, 5]} />
        <meshStandardMaterial color="#f2c230" />
      </Instanced>
    </group>
  );
}

const ORE_COLOR: Record<string, string> = { copperOre: "#3fae7a", tinOre: "#5a5060", ironOre: "#b24a2c", goldOre: "#f2c230", mithrilOre: "#5fd8f0" };
const PINES = ["tree_pineRoundA", "tree_pineRoundC", "tree_pineTallA", "tree_pineSmallB"];
const LEAFY = ["tree_default", "tree_oak", "tree_detailed"];
const LEAF_SUFFIX: Record<Season, string> = { Spring: "", Summer: "", Fall: "_fall", Winter: "_dark" };
const pick = <T,>(list: T[], r: number) => list[Math.floor(r * list.length) % list.length];
const n = (name: string) => model("nature", name);

// Load every season's trees up front so the forest doesn't flicker back to simple shapes when the season changes.
if (typeof window !== "undefined") {
  for (const t of [...PINES, ...LEAFY.flatMap((l) => Object.values(LEAF_SUFFIX).map((sfx) => l + sfx))]) useGLTF.preload(n(t));
}

/** Kenney models for trees, rocks, stumps, logs, weeds, and wild plants. */
function ModelObstacles({ tiles, season, buildings }: { tiles: Tile[]; season: Season; buildings: Building[] }) {
  const { tall, low, sticks, ores } = useMemo(() => {
    const covered = new Set<number>();
    for (const b of buildings) {
      const [bw, bh] = BUILDING_SIZE[b.kind];
      for (let y = b.y; y < b.y + bh; y++) for (let x = b.x; x < b.x + bw; x++) covered.add(y * W + x);
    }
    const tallE: [string, Inst][] = [], lowE: [string, Inst][] = [], sticksL: Inst[] = [], ores: Inst[] = [];
    const flowers = ["flower_yellowA", "flower_redA", "flower_purpleA", "flower_yellowB"];
    tiles.forEach((t, i) => {
      const x = i % W, z = Math.floor(i / W);
      const r = hash(i + 7), r2 = hash(i * 3 + 1), ry = hash(i * 5 + 2) * Math.PI * 2;
      const y = tileTop(t);
      switch (t.obstacle) {
        case "tree": {
          // Pines up on the mountain; a mix down in the valley.
          const name = t.ground === "rock" || r < 0.35 ? pick(PINES, r2) : pick(LEAFY, r2) + LEAF_SUFFIX[season];
          tallE.push([n(name), { x: x + (r2 - 0.5) * 0.2, y, z: z + (r - 0.5) * 0.2, s: 1.3 + r * 0.45, ry }]);
          break;
        }
        case "stone": lowE.push([n(pick(["stone_smallA", "stone_smallB", "stone_smallC", "stone_smallFlatA"], r2)), { x, y, z, s: 1.9, ry }]); break;
        case "stump": lowE.push([n(r2 > 0.5 ? "stump_round" : "stump_old"), { x, y, z, s: 2, ry }]); break;
        case "log": lowE.push([n(r2 > 0.5 ? "log" : "log_large"), { x, y, z, s: 1.4, ry }]); break;
        case "stick": sticksL.push({ x, y: y + 0.05, z, ry, rz: 0.1 }); break;
        case "sapling": lowE.push([n(pick(LEAFY, r2) + LEAF_SUFFIX[season]), { x, y, z, s: 0.45, ry }]); break;
        case "copperOre": case "tinOre": case "ironOre": case "goldOre": case "mithrilOre":
          // Ore poking out of the mountainside: a rock with colored crystals.
          lowE.push([n("stone_smallB"), { x, y, z, s: 2.1, ry }]);
          ores.push({ x: x + 0.12, y: y + 0.22, z: z + 0.1, s: 1, ry, rx: 0.4, color: ORE_COLOR[t.obstacle] });
          ores.push({ x: x - 0.15, y: y + 0.16, z: z - 0.05, s: 0.75, ry: ry + 1, rz: 0.5, color: ORE_COLOR[t.obstacle] });
          break;
      }
      if (t.weeds) {
        for (let k = 0; k < 3; k++) {
          const name = pick(["grass_large", "grass_leafs", "plant_flatShort", "grass"], hash(i * 17 + k));
          lowE.push([n(name), { x: x + (hash(i * 7 + k) - 0.5) * 0.6, z: z + (hash(i * 11 + k) - 0.5) * 0.6, s: 1.5 + hash(i + k) * 0.6, ry: hash(i * 13 + k) * 6 }]);
        }
        if (r > 0.65 && season !== "Winter") lowE.push([n(pick(flowers, r2)), { x: x + 0.2, z: z - 0.15, s: 1.6, ry }]);
      }
      // Wild plants on open grass and lily pads on the pond make the farm feel alive.
      if (!t.obstacle && !covered.has(i)) {
        if (t.ground === "grass" && season !== "Winter") {
          if (r < 0.1) lowE.push([n(r2 > 0.5 ? "grass" : "grass_large"), { x: x + (r2 - 0.5) * 0.5, z, s: 1.4, ry }]);
          else if (r < 0.13) lowE.push([n(pick(flowers, r2)), { x, z, s: 1.6, ry }]);
          else if (r < 0.15) lowE.push([n(r2 > 0.5 ? "plant_bushSmall" : "plant_bush"), { x, z, s: 1.4, ry }]);
        }
        if (t.ground === "water" && r < 0.18) lowE.push([n(r2 > 0.5 ? "lily_large" : "lily_small"), { x, y: -0.06, z, s: 1.8, ry }]);
      }
    });
    return { tall: groupBy(tallE), low: groupBy(lowE), sticks: sticksL, ores };
  }, [tiles, season, buildings]);
  return (
    <group>
      <ModelGroups groups={tall} castShadow />
      <ModelGroups groups={low} />
      <Instanced items={sticks}>
        <boxGeometry args={[0.7, 0.06, 0.07]} />
        <meshStandardMaterial color="#7a5636" />
      </Instanced>
      <Instanced items={ores}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial flatShading roughness={0.4} />
      </Instanced>
    </group>
  );
}

/** Trees, rocks, sticks, stumps, logs, weeds, and wild plants. */
export function Obstacles({ tiles, season, buildings }: { tiles: Tile[]; season: Season; buildings: Building[] }) {
  return (
    <Suspense fallback={<ProceduralObstacles tiles={tiles} season={season} />}>
      <ModelObstacles tiles={tiles} season={season} buildings={buildings} />
    </Suspense>
  );
}
