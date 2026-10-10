"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, Vector3, type Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CATEGORY_INFO, ELEMENTS, tilePosition, type ChemElement, type ElementCategory } from "@/data/elements";
import { SOIL_BY_Z, SOIL_ROLES, type SoilRole } from "@/data/soilElements";

export type HeightMode = "flat" | "mass" | "crust" | "soil";

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
  if (mode === "soil") {
    const p = SOIL_BY_Z.get(el.z)?.soilPercent;
    if (!SOIL_BY_Z.has(el.z)) return 0.12;
    if (!p) return FLAT * 2;
    // log scale from ~6e-6 % (mercury) to 49 % (oxygen)
    const t = (Math.log10(p) + 5.5) / 7.2;
    return FLAT * 0.5 + Math.max(0.05, t) * MAX_BAR;
  }
  return FLAT;
}

/** Small soil mound with a sprout, drawn on the corner of every tile that builds soil. */
function drawSoilMark(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#5a3a22";
  ctx.beginPath();
  ctx.arc(222, 50, 22, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = "#3d7a33";
  ctx.beginPath();
  ctx.ellipse(214, 22, 9, 5, -0.6, 0, Math.PI * 2);
  ctx.ellipse(230, 22, 9, 5, 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3d7a33";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(222, 30);
  ctx.lineTo(222, 40);
  ctx.stroke();
}

function faceTexture(symbol: string, top: string, bottom: string, color: string, soil = false) {
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
  if (soil) {
    // Earthy strip along the bottom edge plus the mound icon.
    ctx.fillStyle = "#6b4423";
    ctx.fillRect(0, 242, 256, 14);
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    for (let i = 0; i < 14; i++) ctx.fillRect((i * 37) % 250, 245 + (i % 3) * 3, 3, 3);
    drawSoilMark(ctx);
  }
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
  soil?: boolean;
  /** Ring color when the soil lens highlights this tile. */
  soilRing?: string | null;
  onClick?: () => void;
}

function Tile({ x, y, depth, color, symbol, top, bottom, selected, dimmed, soil, soilRing, onClick }: TileProps) {
  const ref = useRef<Group>(null);
  const [hover, setHover] = useState(false);
  const materials = useMemo(() => {
    const side = new MeshStandardMaterial({ color, roughness: 0.6, transparent: true });
    const front = new MeshStandardMaterial({ map: faceTexture(symbol, top, bottom, color, soil), roughness: 0.5, transparent: true });
    return { side, front, all: [side, side, side, side, front, side] };
  }, [color, symbol, top, bottom, soil]);

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
    const lift = (selected ? 0.5 : hover && onClick ? 0.25 : 0) + (soilRing ? 0.3 : 0);
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
      {soilRing && !selected && (
        <mesh position={[0, 0, 0.5]} scale={[1, 1, 1 / Math.max(depth, 0.01)]}>
          <ringGeometry args={[0.6, 0.68, 4, 1, Math.PI / 4]} />
          <meshBasicMaterial color={soilRing} />
        </mesh>
      )}
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

function soilTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(0, 0, 256, 256);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const specks = ["#6b4423", "#3a2414", "#8a5a3a", "#c9a865", "#2b1d12"];
  for (let i = 0; i < 900; i++) {
    ctx.fillStyle = specks[i % specks.length];
    ctx.globalAlpha = 0.5 + rand() * 0.5;
    const r = 1 + rand() * 3;
    ctx.beginPath();
    ctx.arc(rand() * 256, rand() * 256, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.wrapS = tex.wrapT = RepeatWrapping;
  tex.repeat.set(6, 3);
  return tex;
}

/** A slab of soil the elements stand on when the soil lens is on. */
function SoilSlab() {
  const tex = useMemo(() => soilTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const [, top] = tileXY(1, 1);
  const [, bottom] = tileXY(1, 10);
  const height = top - bottom + 1.6;
  const cy = (top + bottom) / 2;
  return (
    <group>
      <mesh position={[0, cy, -0.35]}>
        <boxGeometry args={[18 * STEP + 1.2, height, 0.5]} />
        <meshStandardMaterial map={tex} roughness={1} />
      </mesh>
      {/* grass edge along the top */}
      <mesh position={[0, cy + height / 2 + 0.06, -0.3]}>
        <boxGeometry args={[18 * STEP + 1.2, 0.14, 0.6]} />
        <meshStandardMaterial color="#5a8f3a" roughness={1} />
      </mesh>
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
  soilLens: boolean;
  soilRole: SoilRole | null;
}

export default function PeriodicTable3D({ selected, onSelect, heightMode, filter, matches, soilLens, soilRole }: Props) {
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
        const soil = SOIL_BY_Z.get(el.z);
        const soilMatch = soil && (soilRole === null || soil.roles.includes(soilRole));
        const dimmed =
          (filter !== null && el.category !== filter) ||
          (matches !== null && !matches.has(el.z)) ||
          (soilLens && !soilMatch);
        const ring = soilLens && soilMatch ? SOIL_ROLES[soilRole ?? soil.roles[0]].color : null;
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
            soil={!!soil}
            soilRing={ring}
            onClick={() => onSelect(el.z)}
          />
        );
      })}
      {/* Placeholders that point down to the lanthanide and actinide rows */}
      {([[6, "57–71", "lanthanide"], [7, "89–103", "actinide"]] as const).map(([row, label, cat]) => {
        const [x, y] = tileXY(3, row);
        return (
          <Tile key={label} x={x} y={y} depth={0.12} color={CATEGORY_INFO[cat].color} symbol="↓" top={label} bottom="" dimmed={(filter !== null && filter !== cat) || soilLens} />
        );
      })}
      {soilLens && <SoilSlab />}
      <CameraRig focus={focus} bars={heightMode !== "flat" || soilLens} />
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
