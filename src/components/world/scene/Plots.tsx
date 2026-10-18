"use client";

import { Suspense, useMemo } from "react";
import { PLOTS } from "@/world/map";
import { Instanced, type Inst } from "./Instanced";
import { model, ModelInstances } from "./models";

/** Farmland you don't own yet: a low post-and-rail fence around each locked plot, and a sign. */
export function LockedPlots({ owned }: { owned: number[] }) {
  const { posts, rails, signs } = useMemo(() => {
    const posts: Inst[] = [], rails: Inst[] = [], signs: Inst[] = [];
    for (const p of PLOTS) {
      if (owned.includes(p.id)) continue;
      const x0 = p.x0 - 0.45, x1 = p.x1 + 0.45, z0 = p.y0 - 0.45, z1 = p.y1 + 0.45;
      for (const x of [x0, (x0 + x1) / 2, x1]) for (const z of [z0, z1]) posts.push({ x, y: 0.22, z });
      for (const x of [x0, x1]) posts.push({ x, y: 0.22, z: (z0 + z1) / 2 });
      for (const z of [z0, z1]) rails.push({ x: (x0 + x1) / 2, y: 0.3, z, s: [x1 - x0, 0.05, 0.05] });
      for (const x of [x0, x1]) rails.push({ x, y: 0.3, z: (z0 + z1) / 2, s: [0.05, 0.05, z1 - z0] });
      signs.push({ x: p.x0, z: p.y0, s: 1.2, ry: Math.PI });
    }
    return { posts, rails, signs };
  }, [owned]);
  return (
    <group>
      <Instanced items={posts} castShadow>
        <boxGeometry args={[0.1, 0.44, 0.1]} />
        <meshStandardMaterial color="#9a6b3f" />
      </Instanced>
      <Instanced items={rails}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#b08458" />
      </Instanced>
      <Suspense fallback={null}>
        <ModelInstances url={model("survival", "signpost")} items={signs} castShadow />
      </Suspense>
    </group>
  );
}
