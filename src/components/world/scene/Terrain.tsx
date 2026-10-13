"use client";

import { useMemo } from "react";
import { H, W } from "@/world/map";
import type { Season, Tile } from "@/world/types";
import { hash, Instanced, type Inst } from "./Instanced";

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
    case "farm":
      if (t.tilled) return t.moisture > 45 ? "#4a2f1c" : "#7a5233";
      return t.greenhouse ? "#8a6a45" : season === "Winter" ? "#c9c3b4" : "#9c8458";
  }
}

/** The ground: one flat block per tile, colored by what's on it. */
export function Terrain({ tiles, season }: { tiles: Tile[]; season: Season }) {
  const ground = useMemo<Inst[]>(
    () => tiles.map((t, i) => ({
      x: i % W, z: Math.floor(i / W),
      y: t.ground === "water" ? -0.25 : t.tilled ? -0.08 : -0.1,
      color: groundColor(t, i, season),
    })),
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

/** Water surface over the pond tiles. */
export function Pond({ tiles }: { tiles: Tile[] }) {
  const water = useMemo<Inst[]>(
    () => tiles.flatMap((t, i) => (t.ground === "water" ? [{ x: i % W, y: -0.06, z: Math.floor(i / W) }] : [])),
    [tiles],
  );
  return (
    <Instanced items={water}>
      <boxGeometry args={[1, 0.02, 1]} />
      <meshStandardMaterial color="#5fa3cf" transparent opacity={0.75} roughness={0.15} metalness={0.1} />
    </Instanced>
  );
}

/** Trees, rocks, sticks, stumps, logs, and weeds. */
export function Obstacles({ tiles, season }: { tiles: Tile[]; season: Season }) {
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
