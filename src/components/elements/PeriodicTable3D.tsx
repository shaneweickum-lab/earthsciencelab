"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, MeshStandardMaterial, SRGBColorSpace, Vector3, type Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CATEGORY_INFO, ELEMENTS, tilePosition, type ChemElement, type ElementCategory } from "@/data/elements";

export type HeightMode = "flat" | "mass" | "crust";

const STEP = 1.12;
const FLAT = 0.25;
const MAX_BAR = 3.2;

function tileXY(col: number, row: number): [number, number] {
  const gap = row >= 9 ? 0.45 : 0;
  return [(col - 9.5) * STEP, -(row - 5.5) * STEP - gap];
}

export function tileDepth(el: ChemElement, mode: HeightMode): number {
  if (mode === "mass") return FLAT + (el.mass / 294) * MAX_BAR;
  if (mode === "crust") {
    if (el.crustPpm <= 0) return 0.12;
    // log scale from 1e-13 ppm (radon) to ~5e5 ppm (oxygen)
    const t = (Math.log10(el.crustPpm) + 13) / 18.7;
    return FLAT * 0.5 + Math.max(0, t) * MAX_BAR;
  }
  return FLAT;
}

function faceTexture(symbol: string, top: string, bottom: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(0, 0, 256, 8);
  ctx.fillStyle = "#1d1611";
  ctx.font = "bold 44px ui-rounded, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(top, 18, 52);
  ctx.textAlign = "center";
  ctx.font = `bold ${symbol.length > 2 ? 78 : 112}px ui-rounded, system-ui, sans-serif`;
  ctx.fillText(symbol, 128, 168);
  ctx.font = "600 30px ui-rounded, system-ui, sans-serif";
  ctx.fillText(bottom.length > 13 ? bottom.slice(0, 12) + "…" : bottom, 128, 228);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

interface TileProps {
  x: number;
  y: number;
  depth: number;
  color: string;
  symbol: string;
  top: string;
  bottom: string;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

function Tile({ x, y, depth, color, symbol, top, bottom, selected, dimmed, onClick }: TileProps) {
  const ref = useRef<Group>(null);
  const [hover, setHover] = useState(false);
  const materials = useMemo(() => {
    const side = new MeshStandardMaterial({ color, roughness: 0.6, transparent: true });
    const front = new MeshStandardMaterial({ map: faceTexture(symbol, top, bottom, color), roughness: 0.5, transparent: true });
    return { side, front, all: [side, side, side, side, front, side] };
  }, [color, symbol, top, bottom]);

  useEffect(() => () => {
    materials.front.map?.dispose();
    materials.front.dispose();
    materials.side.dispose();
  }, [materials]);

  useEffect(() => {
    const opacity = dimmed ? 0.18 : 1;
    materials.side.opacity = opacity;
    materials.front.opacity = opacity;
    const glow = selected ? 0.12 : hover ? 0.1 : 0;
    for (const m of [materials.side, materials.front]) {
      m.emissive.set(selected || hover ? "#ffffff" : "#000000");
      m.emissiveIntensity = glow;
    }
  }, [dimmed, selected, hover, materials]);

  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const lift = selected ? 0.5 : hover && onClick ? 0.25 : 0;
    // Animate depth changes between height modes and the hover lift.
    g.scale.z += (depth - g.scale.z) * 0.12;
    g.position.z += (g.scale.z / 2 + lift - g.position.z) * 0.18;
  });

  return (
    <group ref={ref} position={[x, y, depth / 2]} scale={[1, 1, depth]}>
      <mesh
        material={materials.all}
        onClick={onClick ? (e) => { e.stopPropagation(); onClick(); } : undefined}
        onPointerOver={onClick ? (e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; } : undefined}
        onPointerOut={onClick ? () => { setHover(false); document.body.style.cursor = ""; } : undefined}
      >
        <boxGeometry args={[1, 1, 1]} />
      </mesh>
      {selected && (
        // Gold frame around the chosen tile, drawn just in front of its face.
        <mesh position={[0, 0, 0.5]} scale={[1, 1, 1 / Math.max(depth, 0.01)]}>
          <ringGeometry args={[0.62, 0.72, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color="#ffd166" />
        </mesh>
      )}
    </group>
  );
}

/** Eases the camera to the selected tile, and tilts it when tiles become bars so heights show. */
function CameraRig({ focus, bars }: { focus: [number, number, number] | null; bars: boolean }) {
  const { camera, controls } = useThree();
  const goal = useRef<{ target: Vector3; cam: Vector3 } | null>(null);
  useEffect(() => {
    const target = focus ? new Vector3(focus[0], focus[1], 0) : new Vector3(0, -0.5, 0);
    const offset = bars
      ? new Vector3(0, focus ? -8 : -14, focus ? 9 : 13)
      : new Vector3(0, focus ? -2.5 : -6.5, focus ? 12 : 18.5);
    goal.current = { target, cam: target.clone().add(offset) };
  }, [focus, bars]);
  useFrame(() => {
    const g = goal.current;
    const c = controls as unknown as OrbitControlsImpl | null;
    if (!g || !c) return;
    c.target.lerp(g.target, 0.08);
    camera.position.lerp(g.cam, 0.08);
    if (camera.position.distanceTo(g.cam) < 0.02) goal.current = null;
  });
  return null;
}

interface Props {
  selected: number | null;
  onSelect: (z: number) => void;
  heightMode: HeightMode;
  filter: ElementCategory | null;
  matches: Set<number> | null;
}

export default function PeriodicTable3D({ selected, onSelect, heightMode, filter, matches }: Props) {
  const selectedEl = selected ? ELEMENTS[selected - 1] : null;
  const focus = useMemo<[number, number, number] | null>(() => {
    if (!selectedEl) return null;
    const { col, row } = tilePosition(selectedEl);
    const [x, y] = tileXY(col, row);
    return [x, y, 0];
  }, [selectedEl]);

  return (
    <Canvas camera={{ position: [0, -7, 19], fov: 45 }} dpr={[1, 2]}>
      <color attach="background" args={["#141b2d"]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[6, 8, 12]} intensity={1.3} />
      <directionalLight position={[-8, -4, 6]} intensity={0.35} />
      {ELEMENTS.map((el) => {
        const { col, row } = tilePosition(el);
        const [x, y] = tileXY(col, row);
        const dimmed = (filter !== null && el.category !== filter) || (matches !== null && !matches.has(el.z));
        return (
          <Tile
            key={el.z}
            x={x}
            y={y}
            depth={tileDepth(el, heightMode)}
            color={CATEGORY_INFO[el.category].color}
            symbol={el.symbol}
            top={String(el.z)}
            bottom={el.name}
            selected={selected === el.z}
            dimmed={dimmed}
            onClick={() => onSelect(el.z)}
          />
        );
      })}
      {/* Placeholders that point down to the lanthanide and actinide rows */}
      {([[6, "57–71", "lanthanide"], [7, "89–103", "actinide"]] as const).map(([row, label, cat]) => {
        const [x, y] = tileXY(3, row);
        return (
          <Tile key={label} x={x} y={y} depth={0.12} color={CATEGORY_INFO[cat].color} symbol="↓" top={label} bottom="" dimmed={filter !== null && filter !== cat} />
        );
      })}
      <CameraRig focus={focus} bars={heightMode !== "flat"} />
      <OrbitControls
        makeDefault
        target={[0, -0.5, 0]}
        minDistance={4}
        maxDistance={30}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
        minAzimuthAngle={-Math.PI / 3}
        maxAzimuthAngle={Math.PI / 3}
        screenSpacePanning
      />
    </Canvas>
  );
}
