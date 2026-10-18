"use client";

import { Billboard, useTexture } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import { CanvasTexture, DoubleSide, NearestFilter, SRGBColorSpace, type Group, type Material, type MeshStandardMaterial, type Object3D } from "three";
import { ITEMS, TIERS } from "@/world/items";
import { runtime } from "../useWorld";
import { model, useParts } from "./models";

/**
 * Where the fist is on the arm bone: the arm runs along the bone's −x from the shoulder, and
 * the bone's +y points up out of the fist, so tools stand upright in the hand.
 */
const HAND = { position: [-0.13, -0.03, 0] as const, rotation: [0, 0, 0] as const };

/** How long a use (like pouring the watering can) lasts. */
const USE_MS = 650;

const metalCache = new Map<string, Material>();

/** A copy of a material with its grey metal recolored for a tool tier (as the icons do). */
function metal(mat: Material, color: string): Material {
  const key = `${mat.uuid}|${color}`;
  const hit = metalCache.get(key);
  if (hit) return hit;
  const std = mat as MeshStandardMaterial;
  const img = std.map?.image as CanvasImageSource & { width: number; height: number } | undefined;
  if (!img) return mat;
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext("2d")!;
  g.drawImage(img, 0, 0);
  const px = g.getImageData(0, 0, c.width, c.height);
  const d = px.data;
  const tint = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  for (let i = 0; i < d.length; i += 4) {
    const max = Math.max(d[i], d[i + 1], d[i + 2]), min = Math.min(d[i], d[i + 1], d[i + 2]);
    if (max > 90 && (max - min) / max < 0.3) {
      const k = max / 175;
      d[i] = Math.min(255, tint[0] * k);
      d[i + 1] = Math.min(255, tint[1] * k);
      d[i + 2] = Math.min(255, tint[2] * k);
    }
  }
  g.putImageData(px, 0, 0);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.flipY = std.map!.flipY;
  tex.magFilter = NearestFilter;
  const out = std.clone();
  out.map = tex;
  metalCache.set(key, out);
  return out;
}

/** A Kenney tool model, tinted for its tier. */
function Tool({ name, tint }: { name: string; tint?: string }) {
  const parts = useParts(model("survival", name));
  return (
    <group scale={1.8}>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geometry} material={tint ? metal(p.material as Material, tint) : p.material} matrix={p.matrix} matrixAutoUpdate={false} castShadow />
      ))}
    </group>
  );
}

function Can({ color }: { color: string }) {
  return (
    <group position={[0, -0.04, 0]} scale={0.22} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, -0.35, 0]} castShadow><cylinderGeometry args={[0.38, 0.42, 0.7, 12]} /><meshStandardMaterial color={color} flatShading /></mesh>
      <mesh position={[0.5, -0.25, 0]} rotation={[0, 0, -0.9]}><cylinderGeometry args={[0.05, 0.08, 0.8, 8]} /><meshStandardMaterial color={color} flatShading /></mesh>
      <mesh position={[-0.1, 0.05, 0]}><torusGeometry args={[0.28, 0.05, 6, 12, Math.PI]} /><meshStandardMaterial color={color} flatShading /></mesh>
    </group>
  );
}

function Scythe() {
  return (
    <group scale={0.3}>
      <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.04, 0.05, 1.5, 6]} /><meshStandardMaterial color="#b07a4f" flatShading /></mesh>
      <mesh position={[0.35, 1.25, 0]} rotation={[0, 0, Math.PI * 0.55]} scale={[1, 1, 0.4]}>
        <torusGeometry args={[0.45, 0.06, 4, 12, Math.PI * 0.6]} /><meshStandardMaterial color="#c9ced6" flatShading />
      </mesh>
    </group>
  );
}

function Ring() {
  return (
    <mesh position={[0, -0.02, 0]}>
      <cylinderGeometry args={[0.13, 0.13, 0.12, 16, 1, true]} />
      <meshStandardMaterial color="#b9bcb6" side={DoubleSide} flatShading />
    </mesh>
  );
}

/** Anything that isn't a tool: its hotbar picture on a little card that always faces you. */
function Card({ id }: { id: string }) {
  const tex = useTexture(ITEMS[id].image ?? "/icons/sticks.png");
  return (
    <Billboard position={[0, 0.14, 0]}>
      <mesh>
        <planeGeometry args={[0.32, 0.32]} />
        <meshBasicMaterial map={tex} transparent alphaTest={0.1} depthWrite={false} />
      </mesh>
    </Billboard>
  );
}

function ItemModel({ id }: { id: string }) {
  const tool = ITEMS[id].tool;
  if (!tool) return <Card id={id} />;
  const tint = tool.tier === "base" ? undefined : TIERS[tool.tier].color;
  switch (tool.use) {
    case "axe": return <Tool name="tool-axe" tint={tint} />;
    case "pickaxe": return <Tool name="tool-pickaxe" tint={tint} />;
    case "hoe": return <Tool name="tool-hoe" />;
    case "shovel": return <Tool name="tool-shovel" />;
    case "scythe": return <Scythe />;
    case "can": return <Can color="#4f8a6e" />;
    case "ring": return <Ring />;
  }
}

/** The selected hotbar item, in the farmer's right hand. The watering can tips while you pour. */
export function HeldItem({ farmer, item }: { farmer: Object3D; item: string | null }) {
  const arm = useMemo(() => farmer.getObjectByName("arm-right") ?? null, [farmer]);
  const tilt = useRef<Group>(null);
  useFrame(() => {
    if (!tilt.current) return;
    const t = (performance.now() - runtime.action.at) / USE_MS;
    const pouring = item === "can" && runtime.action.anim === "use" && t >= 0 && t < 1;
    tilt.current.rotation.x = pouring ? -Math.sin(t * Math.PI) * 1.1 : 0;
  });
  if (!arm || !item || !ITEMS[item]) return null;
  return createPortal(
    <group position={HAND.position} rotation={HAND.rotation}>
      <group ref={tilt}>
        <Suspense fallback={null}>
          <ItemModel id={item} />
        </Suspense>
      </group>
    </group>,
    arm,
  );
}
