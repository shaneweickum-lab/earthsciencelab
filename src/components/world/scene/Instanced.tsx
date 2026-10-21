"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Color, Object3D, type InstancedMesh } from "three";

export interface Inst {
  x: number;
  y?: number;
  z: number;
  /** Uniform scale, or per-axis. */
  s?: number | [number, number, number];
  ry?: number;
  rx?: number;
  rz?: number;
  color?: string;
}

const dummy = new Object3D();
const tmp = new Color();

/** Chunks of the valley, in tiles: each is drawn (or skipped, when it's off screen) on its own. */
export const CHUNK = 16;

/** Split instances by the chunk of the valley they stand in. */
export function chunked(items: Inst[]): Inst[][] {
  const out = new Map<number, Inst[]>();
  for (const it of items) {
    const key = Math.floor(it.z / CHUNK) * 1000 + Math.floor(it.x / CHUNK);
    const list = out.get(key);
    if (list) list.push(it);
    else out.set(key, [it]);
  }
  return [...out.values()];
}

/** Draws many copies of one shape, a draw call per chunk of the valley, skipping chunks off screen. */
export function Instanced({ items, children, castShadow }: { items: Inst[]; children: React.ReactNode; castShadow?: boolean }) {
  const chunks = useMemo(() => chunked(items), [items]);
  return (
    <>
      {chunks.map((c, i) => <InstancedChunk key={i} items={c} castShadow={castShadow}>{children}</InstancedChunk>)}
    </>
  );
}

function InstancedChunk({ items, children, castShadow }: { items: Inst[]; children: React.ReactNode; castShadow?: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    items.forEach((it, i) => {
      dummy.position.set(it.x, it.y ?? 0, it.z);
      dummy.rotation.set(it.rx ?? 0, it.ry ?? 0, it.rz ?? 0);
      const s = it.s ?? 1;
      if (typeof s === "number") dummy.scale.setScalar(s);
      else dummy.scale.set(s[0], s[1], s[2]);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (it.color) mesh.setColorAt(i, tmp.set(it.color));
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (items.length === 0) return null;
  // Allocate a little headroom so small changes don't rebuild the mesh.
  const cap = Math.ceil(items.length / 64) * 64;
  return (
    <instancedMesh key={cap} ref={ref} args={[undefined, undefined, cap]} castShadow={castShadow} receiveShadow>
      {children}
    </instancedMesh>
  );
}

/** Deterministic pseudo-random number from an integer, for scattering details. */
export function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
