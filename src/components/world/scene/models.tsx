"use client";

import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { Matrix4, Object3D, type BufferGeometry, type InstancedMesh, type Material, type Mesh, type MeshStandardMaterial } from "three";
import { chunked, type Inst } from "./Instanced";

/** CC0 models (Kenney, and Quaternius crops, nature, trees and farm buildings) prepared in public/models by `npm run assets`. */
export type Pack = "nature" | "town" | "survival" | "food" | "crops" | "characters" | "qnature" | "qbuildings" | "furniture" | "qtrees";

export const model = (pack: Pack, name: string) => `/models/${pack}/${name}.glb`;

interface Part {
  geometry: BufferGeometry;
  material: Material | Material[];
  matrix: Matrix4;
}

/**
 * Kenney's Nature Kit uses a bright pastel palette (teal leaves, orange dirt) and marks its colors as metallic,
 * which renders nearly black without an environment map. We repaint materials by name to match the farm's
 * earthy look and make them matte.
 */
const PALETTE: Record<string, string> = {
  grass: "#6fae4f", leafsGreen: "#4f9a45", leafsDark: "#3d7058", leafsFall: "#e08a3c",
  woodBark: "#8a5a3c", woodBarkDark: "#6e4a35", woodInner: "#e8c99a", woodBirch: "#efe6d6",
  dirt: "#8a6040", stone: "#b9bcb6", stoneDark: "#8f948f", wood: "#b07a4f", woodDark: "#8a5a3c", corn: "#f0c75a",
};

function fixMaterial(mat: Material) {
  if (mat.userData.fixed) return;
  mat.userData.fixed = true;
  const std = mat as MeshStandardMaterial;
  if ("metalness" in std) {
    std.metalness = 0;
    std.roughness = Math.max(std.roughness, 0.8);
  }
  const color = PALETTE[mat.name];
  if (color && std.color) std.color.set(color);
}

const tinted = new Map<string, Material>();

/** A copy of a leaf material in another color (autumn leaves); bark and everything else stays as it is. */
function tintLeaves(mat: Material, tint: string | undefined): Material {
  if (!tint || !/leaves/i.test(mat.name)) return mat;
  const key = `${mat.uuid}#${tint}`;
  let out = tinted.get(key);
  if (!out) {
    out = mat.clone();
    (out as MeshStandardMaterial).color.set(`#${tint}`);
    tinted.set(key, out);
  }
  return out;
}

/** A model URL whose leaves are tinted: `withTint(url, "e0672e")`. */
export const withTint = (url: string, tint: string) => `${url}#${tint}`;

/** Every mesh in a model with its transform relative to the model root (a `#rrggbb` ending tints its leaves). */
export function useParts(url: string): Part[] {
  const [file, tint] = url.split("#");
  const { scene } = useGLTF(file);
  return useMemo(() => {
    scene.updateMatrixWorld(true);
    const parts: Part[] = [];
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach(fixMaterial);
      parts.push({ geometry: m.geometry, material: Array.isArray(m.material) ? mats.map((x) => tintLeaves(x, tint)) : tintLeaves(m.material, tint), matrix: m.matrixWorld.clone() });
    });
    return parts;
  }, [scene, tint]);
}

const dummy = new Object3D();
const tmp = new Matrix4();

function PartInstances({ part, items, castShadow }: { part: Part; items: Inst[]; castShadow?: boolean }) {
  const ref = useRef<InstancedMesh>(null);
  const cap = Math.max(16, Math.ceil(items.length / 32) * 32);
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
      mesh.setMatrixAt(i, tmp.multiplyMatrices(dummy.matrix, part.matrix));
    });
    mesh.count = items.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items, part]);
  return (
    <instancedMesh key={cap} ref={ref} args={[part.geometry, part.material, cap]} castShadow={castShadow} receiveShadow />
  );
}

/** Draws many copies of a model (all its meshes): a draw call per mesh per chunk of the valley, skipping chunks off screen. */
export function ModelInstances({ url, items, castShadow }: { url: string; items: Inst[]; castShadow?: boolean }) {
  const parts = useParts(url);
  const chunks = useMemo(() => chunked(items), [items]);
  if (!items.length) return null;
  return (
    <>
      {chunks.map((c, k) => parts.map((p, i) => <PartInstances key={`${k}-${i}`} part={p} items={c} castShadow={castShadow} />))}
    </>
  );
}

/** Group instances by model so each model is drawn once. */
export function groupBy(entries: [url: string, inst: Inst][]): Map<string, Inst[]> {
  const out = new Map<string, Inst[]>();
  for (const [url, inst] of entries) {
    const list = out.get(url);
    if (list) list.push(inst);
    else out.set(url, [inst]);
  }
  return out;
}

export function ModelGroups({ groups, castShadow }: { groups: Map<string, Inst[]>; castShadow?: boolean }) {
  return (
    <>
      {[...groups].map(([url, items]) => <ModelInstances key={url} url={url} items={items} castShadow={castShadow} />)}
    </>
  );
}

/** One copy of a model, for buildings and other one-offs. */
export function Model({ url, ...props }: { url: string } & ThreeElements["group"]) {
  const parts = useParts(url);
  return (
    <group {...props}>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geometry} material={p.material} matrix={p.matrix} matrixAutoUpdate={false} castShadow receiveShadow />
      ))}
    </group>
  );
}
