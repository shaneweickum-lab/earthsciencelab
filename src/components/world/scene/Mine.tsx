"use client";

import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo } from "react";
import { Color } from "three";
import { MINE_W } from "@/world/map";
import type { Building, OreRock, Tile } from "@/world/types";
import { useWorld } from "../useWorld";
import { hash, Instanced, type Inst } from "./Instanced";
import { groupBy, model, ModelGroups } from "./models";

/** Ore crystal colors (the same as the item icons in scripts/icons-page.js). */
export const ORE_COLORS: Record<OreRock, string> = {
  copperOre: "#3fae7a", tinOre: "#3b3440", ironOre: "#b24a2c", goldOre: "#f2c230", mithrilOre: "#5fd8f0",
};
const ROCK_MODELS = ["Rock_1", "Rock_2", "Rock_3", "Rock_4"];

/** The cave floor and the rock walls around it. */
function Cave({ tiles }: { tiles: Tile[] }) {
  const { floor, walls } = useMemo(() => {
    const floor: Inst[] = [], walls: Inst[] = [];
    tiles.forEach((t, i) => {
      const x = i % MINE_W, z = Math.floor(i / MINE_W);
      const r = hash(i + 3);
      if (t.ground === "cave") floor.push({ x, y: -0.1, z, color: r > 0.5 ? "#8a7866" : "#81705f" });
      else walls.push({ x, y: 0.45 + r * 0.15, z, s: [1, 1.1 + r * 0.3, 1], color: r > 0.6 ? "#5d534a" : r > 0.3 ? "#675c52" : "#564d45" });
    });
    return { floor, walls };
  }, [tiles]);
  return (
    <group>
      <Instanced items={floor}>
        <boxGeometry args={[1, 0.2, 1]} />
        <meshStandardMaterial roughness={1} />
      </Instanced>
      <Instanced items={walls} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={1} flatShading />
      </Instanced>
    </group>
  );
}

/** Rocks (the same Quaternius rocks as the farm), with colored crystals where there's ore. */
function Rocks({ tiles }: { tiles: Tile[] }) {
  const { rocks, crystals } = useMemo(() => {
    const rocksE: [string, Inst][] = [], crystals: Inst[] = [];
    tiles.forEach((t, i) => {
      if (!t.obstacle) return;
      const x = i % MINE_W, z = Math.floor(i / MINE_W);
      const r = hash(i * 7 + 1), ry = hash(i * 3 + 2) * Math.PI * 2;
      rocksE.push([model("qnature", ROCK_MODELS[Math.floor(r * 4)]), { x, z, s: 0.95, ry }]);
      if (t.obstacle === "stone") return;
      const color = ORE_COLORS[t.obstacle as OreRock];
      for (let k = 0; k < 3; k++) {
        const a = ry + k * 2.1;
        crystals.push({ x: x + Math.cos(a) * 0.25, y: 0.4 + hash(i + k) * 0.25, z: z + Math.sin(a) * 0.25, s: 0.15 + hash(i * 5 + k) * 0.07, rx: 0.4, ry: a, color });
      }
    });
    return { rocks: groupBy(rocksE), crystals };
  }, [tiles]);
  return (
    <group>
      <Suspense fallback={null}>
        <ModelGroups groups={rocks} castShadow />
      </Suspense>
      <Instanced items={crystals}>
        <octahedronGeometry args={[1, 0]} />
        <meshStandardMaterial roughness={0.3} emissive="#222" flatShading />
      </Instanced>
    </group>
  );
}

/** A wooden ladder: up (leaning on the wall) or down (poking out of a hole). */
function Ladder({ b }: { b: Building }) {
  const down = b.kind === "ladderDown";
  return (
    <group position={[b.x, 0, b.y]}>
      {down && (
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.42, 16]} />
          <meshBasicMaterial color="#0b0806" />
        </mesh>
      )}
      <group position={[0, down ? 0.1 : 0.7, down ? 0 : -0.3]} rotation={[down ? -0.35 : -0.25, 0, 0]}>
        {[-0.2, 0.2].map((x) => (
          <mesh key={x} position={[x, 0, 0]} castShadow>
            <boxGeometry args={[0.07, down ? 0.9 : 1.5, 0.07]} />
            <meshStandardMaterial color="#8a5a3c" />
          </mesh>
        ))}
        {(down ? [-0.25, 0, 0.25] : [-0.5, -0.2, 0.1, 0.4]).map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <boxGeometry args={[0.42, 0.05, 0.06]} />
            <meshStandardMaterial color="#a8774f" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Underground: dark, lit by your lantern and a little ambient glow. */
export function MineScene() {
  const mine = useWorld((s) => s.world!.mine!);
  const { scene } = useThree();
  useEffect(() => {
    const before = scene.background;
    scene.background = new Color("#1d1611");
    return () => {
      scene.background = before;
    };
  }, [scene]);
  return (
    <>
      <ambientLight intensity={1.1} color="#d9c4a6" />
      <hemisphereLight args={["#efe0c8", "#3a2e24", 0.9]} />
      <Cave tiles={mine.tiles} />
      <Rocks tiles={mine.tiles} />
      {mine.buildings.map((b) => <Ladder key={b.id} b={b} />)}
    </>
  );
}
