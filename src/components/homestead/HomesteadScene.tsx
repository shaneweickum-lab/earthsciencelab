"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { Suspense, useMemo } from "react";
import { Box3, Matrix4, Vector3, type Mesh } from "three";
import { AREA_SIZE, DECOR_BY_ID, footprint, surfaceAt, type DecorDef } from "@/world/homestead";
import type { DecorArea, Placed } from "@/world/types";
import { model, useParts, type Pack } from "../world/scene/models";

const decorUrl = (def: DecorDef) => model(def.pack as Pack, def.model);

/** A model's bounds in its own units, so it can be centered on its cells and stood on the floor. */
function useBounds(url: string) {
  const parts = useParts(url);
  return useMemo(() => {
    const box = new Box3();
    for (const p of parts) {
      p.geometry.computeBoundingBox();
      box.union(p.geometry.boundingBox!.clone().applyMatrix4(p.matrix));
    }
    return { parts, box, size: box.getSize(new Vector3()) };
  }, [parts]);
}

/** How tall a surface (a table, a counter) stands, for the things set on it. */
function SurfaceLift({ surface, children }: { surface: Placed; children: (y: number) => React.ReactNode }) {
  const def = DECOR_BY_ID[surface.item];
  const { size } = useBounds(decorUrl(def));
  return <>{children(size.y * def.s)}</>;
}

/** One decoration, centered on the cells it covers, turned, and tinted while it's a ghost. */
function DecorModel({ def, x, y, rot, lift = 0, ghost, selected, onClick }: {
  def: DecorDef; x: number; y: number; rot: number; lift?: number; ghost?: "ok" | "bad"; selected?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const { parts, box } = useBounds(decorUrl(def));
  const [w, d] = footprint(def, rot);
  const center = box.getCenter(new Vector3());
  const offset = new Matrix4().makeTranslation(-center.x, -box.min.y, -center.z);
  return (
    <group position={[x + w / 2, lift, y + d / 2]} rotation={[0, -rot * Math.PI / 2, 0]} onClick={onClick}>
      <group scale={def.s}>
        {parts.map((p, i) => (
          <mesh key={i} geometry={p.geometry} matrix={offset.clone().multiply(p.matrix)} matrixAutoUpdate={false} castShadow={!ghost} receiveShadow>
            {ghost ? <meshStandardMaterial color={ghost === "ok" ? "#7fd18b" : "#e86b5a"} transparent opacity={0.6} /> : <primitive object={p.material} attach="material" />}
          </mesh>
        ))}
      </group>
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[Math.max(w, d) * 0.55, Math.max(w, d) * 0.55 + 0.08, 40]} />
          <meshBasicMaterial color="#f2c230" />
        </mesh>
      )}
    </group>
  );
}

function Placement({ p, placed, selected, onPick }: { p: Placed; placed: Placed[]; selected: boolean; onPick: (uid: number) => void }) {
  const def = DECOR_BY_ID[p.item];
  if (!def) return null;
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onPick(p.uid);
  };
  const surface = def.layer === "top" ? surfaceAt(placed, p.x, p.y) : undefined;
  if (surface) return <SurfaceLift surface={surface}>{(y) => <DecorModel def={def} x={p.x} y={p.y} rot={p.rot} lift={y} selected={selected} onClick={click} />}</SurfaceLift>;
  return <DecorModel def={def} x={p.x} y={p.y} rot={p.rot} lift={def.layer === "rug" ? 0.005 : 0} selected={selected} onClick={click} />;
}

/** The farmhouse room: a wooden floor and two walls (with a window and the door), open toward you. */
function Room() {
  const [w, d] = AREA_SIZE.room;
  const floor = model("furniture", "floorFull");
  const walls = useMemo(() => {
    const out: { url: string; pos: [number, number, number]; ry: number }[] = [];
    for (let x = 0; x < w; x += 2) out.push({ url: model("furniture", x === 2 || x === 6 ? "wallWindow" : "wall"), pos: [x, 0, 0], ry: 0 });
    for (let z = 0; z < d; z += 2) out.push({ url: model("furniture", z === 2 ? "wallDoorway" : "wall"), pos: [0, 0, z], ry: -Math.PI / 2 });
    return out;
  }, [w, d]);
  return (
    <group>
      {Array.from({ length: (w / 2) * (d / 2) }, (_, i) => (
        <Piece key={i} url={floor} pos={[(i % (w / 2)) * 2, -0.1, Math.floor(i / (w / 2)) * 2 + 2]} />
      ))}
      {walls.map((wl, i) => <Piece key={`w${i}`} url={wl.url} pos={wl.pos} ry={wl.ry} />)}
    </group>
  );
}

/** The front of the farmhouse, behind the yard: wooden siding, a door, two windows, and the roof's edge. */
function FarmhouseFront({ w }: { w: number }) {
  const len = w - 2;
  const box = (size: [number, number, number], pos: [number, number, number], color: string, rx = 0) => (
    <mesh position={pos} rotation={[rx, 0, 0]} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
  return (
    <group position={[w / 2, 0, -0.45]}>
      {box([len, 2.4, 0.4], [0, 1.2, 0], "#d9a46b")}
      {[0.5, 1.0, 1.5, 2.0].map((y) => box([len + 0.02, 0.04, 0.42], [0, y, 0], "#c48e58"))}
      {box([1.1, 1.8, 0.1], [0, 0.9, 0.22], "#7a4a2a")}
      {box([0.12, 0.12, 0.06], [0.35, 0.9, 0.29], "#f2c230")}
      {[-2.2, 2.2].map((x) => (
        <group key={x}>
          {box([1.2, 1, 0.08], [x, 1.45, 0.22], "#f6f1e4")}
          {box([1, 0.8, 0.1], [x, 1.45, 0.23], "#9cc7de")}
          {box([0.06, 0.8, 0.12], [x, 1.45, 0.25], "#f6f1e4")}
        </group>
      ))}
      {box([len + 0.8, 0.18, 1.6], [0, 2.55, 0.25], "#b04a3a", 0.35)}
    </group>
  );
}

/** The front yard: a lawn in front of the farmhouse, fenced at the sides. */
function Yard() {
  const [w, d] = AREA_SIZE.yard;
  return (
    <group>
      <mesh position={[w / 2, -0.05, d / 2]} receiveShadow>
        <boxGeometry args={[w + 4, 0.1, d + 4]} />
        <meshStandardMaterial color="#79b35a" roughness={1} />
      </mesh>
      <mesh position={[w / 2, 0.003, d / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#86c066" roughness={1} />
      </mesh>
      <FarmhouseFront w={w} />
      {Array.from({ length: d }, (_, z) => [
        <Piece key={`l${z}`} url={model("nature", "fence_simple")} pos={[-0.03, 0, z + 0.5]} ry={Math.PI / 2} s={1} />,
        <Piece key={`r${z}`} url={model("nature", "fence_simple")} pos={[w + 0.03, 0, z + 0.5]} ry={Math.PI / 2} s={1} />,
      ])}
    </group>
  );
}

/** Lines between the cells, while you're placing something. */
function Grid({ w, d }: { w: number; d: number }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let x = 0; x <= w; x++) pts.push(x, 0, 0, x, 0, d);
    for (let z = 0; z <= d; z++) pts.push(0, 0, z, w, 0, z);
    return new Float32Array(pts);
  }, [w, d]);
  return (
    <lineSegments position={[0, 0.015, 0]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[geo, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#5c4630" transparent opacity={0.35} />
    </lineSegments>
  );
}

/** One fixed piece of the room or yard, as authored (origin and all). */
function Piece({ url, pos, ry = 0, s = 2 }: { url: string; pos: [number, number, number]; ry?: number; s?: number }) {
  const parts = useParts(url);
  return (
    <group position={pos} rotation={[0, ry, 0]} scale={s}>
      {parts.map((p, i) => (
        <mesh key={i} geometry={p.geometry} material={p.material} matrix={p.matrix} matrixAutoUpdate={false} castShadow receiveShadow />
      ))}
    </group>
  );
}

export interface Ghost {
  item: string;
  x: number;
  y: number;
  rot: number;
  ok: boolean;
}

/** The room or yard in 3D. Click a cell to place (or move) something, or click a decoration to pick it. */
export function HomesteadScene({ area, placed, selected, ghost, onHover, onCell, onPick }: {
  area: DecorArea;
  placed: Placed[];
  selected: number | null;
  ghost: Ghost | null;
  onHover: (x: number, y: number) => void;
  onCell: (x: number, y: number) => void;
  onPick: (uid: number) => void;
}) {
  const [w, d] = AREA_SIZE[area];
  const cell = (e: ThreeEvent<PointerEvent | MouseEvent>) => [Math.floor(e.point.x), Math.floor(e.point.z)] as const;
  const ghostDef = ghost ? DECOR_BY_ID[ghost.item] : null;
  const ghostSurface = ghost && ghostDef?.layer === "top" ? surfaceAt(placed, ghost.x, ghost.y) : undefined;
  const target: [number, number, number] = [w / 2, 0.6, d / 2];
  return (
    <Canvas shadows dpr={[1, 1.5]} camera={{ fov: 38, position: [w / 2 + 5, area === "room" ? 9 : 11, d + 7] }} aria-label={area === "room" ? "Your farmhouse room" : "Your front yard"}>
      <color attach="background" args={[area === "room" ? "#efe4cf" : "#cfe6f2"]} />
      <hemisphereLight args={["#fff8ec", "#8a7a6a", 1.2]} />
      <directionalLight position={[w + 4, 10, d + 6]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <OrbitControls target={target} enablePan={false} minDistance={6} maxDistance={22} minPolarAngle={0.35} maxPolarAngle={1.2} minAzimuthAngle={-0.2} maxAzimuthAngle={1.2} />
      <Suspense fallback={null}>
        {area === "room" ? <Room /> : <Yard />}
        {placed.map((p) => <Placement key={p.uid} p={p} placed={placed} selected={p.uid === selected} onPick={onPick} />)}
        {ghost && ghostDef && (ghostSurface
          ? <SurfaceLift surface={ghostSurface}>{(y) => <DecorModel def={ghostDef} x={ghost.x} y={ghost.y} rot={ghost.rot} lift={y} ghost={ghost.ok ? "ok" : "bad"} />}</SurfaceLift>
          : <DecorModel def={ghostDef} x={ghost.x} y={ghost.y} rot={ghost.rot} lift={0.01} ghost={ghost.ok ? "ok" : "bad"} />)}
      </Suspense>
      {/* The grid you place things on. */}
      <mesh
        position={[w / 2, 0.004, d / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={(e) => onHover(...cell(e))}
        onClick={(e) => {
          e.stopPropagation();
          onCell(...cell(e));
        }}
        ref={(m: Mesh | null) => {
          if (m) m.renderOrder = -1;
        }}
      >
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {ghost && <Grid w={w} d={d} />}
    </Canvas>
  );
}
