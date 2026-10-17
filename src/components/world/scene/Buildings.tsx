"use client";

import { Html } from "@react-three/drei";
import { memo, Suspense } from "react";
import { BUILDING_SIZE } from "@/world/map";
import type { Building } from "@/world/types";
import { mineOpen } from "@/world/engine";
import { labelLayer, useWorld } from "../useWorld";
import { Model, model, type Pack } from "./models";

const Mat = ({ color, ...rest }: { color: string; transparent?: boolean; opacity?: number; emissive?: string; emissiveIntensity?: number }) => (
  <meshStandardMaterial color={color} flatShading {...rest} />
);

function Ready() {
  return (
    <mesh position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 4]}>
      <octahedronGeometry args={[0.12, 0]} />
      <meshStandardMaterial color="#ffe066" emissive="#ffcc33" emissiveIntensity={0.7} />
    </mesh>
  );
}

function Cottage({ w, h, wall, roof, trim }: { w: number; h: number; wall: string; roof: string; trim: string }) {
  return (
    <group>
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[w - 0.3, 1.8, h - 0.6]} /><Mat color={wall} />
      </mesh>
      <mesh position={[0, 2.35, 0]} rotation={[0, Math.PI / 4, 0]} scale={[(w - 0.1) * 0.72, 1.1, (h - 0.3) * 0.72]} castShadow>
        <coneGeometry args={[1, 1, 4]} /><Mat color={roof} />
      </mesh>
      {/* Door on the front (south) wall. */}
      <mesh position={[0, 0.55, (h - 0.6) / 2 + 0.01]}>
        <boxGeometry args={[0.6, 1.1, 0.05]} /><Mat color={trim} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (w / 2 - 1), 1.05, (h - 0.6) / 2 + 0.01]}>
          <boxGeometry args={[0.55, 0.5, 0.05]} /><Mat color="#ffe7a8" emissive="#ffc861" emissiveIntensity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

/** The old mine: a rocky hillside with a timber-framed opening, boarded up until Luis's quest. */
function MineEntrance() {
  const open = useWorld((s) => !!s.world && mineOpen(s.world));
  return (
    <group>
      <mesh position={[0, 0.9, -0.35]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.8, 1.3]} />
        <Mat color="#7d756b" />
      </mesh>
      <mesh position={[0, 1.9, -0.5]} rotation={[0, Math.PI / 4, 0]} scale={[1.5, 0.7, 1.2]} castShadow>
        <coneGeometry args={[1, 1, 5]} />
        <Mat color="#6d665d" />
      </mesh>
      <mesh position={[0, 0.65, 0.31]}>
        <boxGeometry args={[1, 1.3, 0.02]} />
        <meshBasicMaterial color="#0d0a08" />
      </mesh>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.7, 0.35]} castShadow><boxGeometry args={[0.16, 1.4, 0.16]} /><Mat color="#7a5636" /></mesh>
      ))}
      <mesh position={[0, 1.42, 0.35]} castShadow><boxGeometry args={[1.35, 0.16, 0.18]} /><Mat color="#6b4423" /></mesh>
      {!open && [0.3, 0.7, 1.05].map((y, i) => (
        <mesh key={y} position={[0, y, 0.42]} rotation={[0, 0, (i - 1) * 0.12]}><boxGeometry args={[1.25, 0.14, 0.05]} /><Mat color="#a8774f" /></mesh>
      ))}
    </group>
  );
}

const Procedural = memo(function Procedural({ b }: { b: Building }) {
  const [w, h] = BUILDING_SIZE[b.kind];
  switch (b.kind) {
    case "house":
      return (
        <group>
          <Cottage w={w} h={h} wall="#f3e3c3" roof="#b5532f" trim="#7a4a2a" />
          <mesh position={[1.2, 2.6, -0.5]} castShadow><boxGeometry args={[0.35, 0.9, 0.35]} /><Mat color="#8b5a3c" /></mesh>
        </group>
      );
    case "store":
      return (
        <group>
          <Cottage w={w} h={h} wall="#e8f0e0" roof="#3f7d4e" trim="#6b4423" />
          {[-2, -1, 0, 1, 2].map((i) => (
            <mesh key={i} position={[i * 0.9, 1.75, (h - 0.6) / 2 + 0.35]} rotation={[0.5, 0, 0]}>
              <boxGeometry args={[0.9, 0.05, 0.8]} /><Mat color={i % 2 ? "#fbf6ef" : "#c0603b"} />
            </mesh>
          ))}
        </group>
      );
    case "shippingBin":
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[0.9, 0.7, 0.7]} /><Mat color="#9a6b3f" /></mesh>
          <mesh position={[0, 0.74, -0.1]} rotation={[-0.3, 0, 0]}><boxGeometry args={[0.95, 0.06, 0.75]} /><Mat color="#7a5230" /></mesh>
        </group>
      );
    case "chest":
      return (
        <group>
          <mesh position={[0, 0.3, 0]} castShadow><boxGeometry args={[0.8, 0.6, 0.55]} /><Mat color="#8a5a3c" /></mesh>
          <mesh position={[0, 0.63, 0]}><boxGeometry args={[0.85, 0.08, 0.6]} /><Mat color="#6b4423" /></mesh>
        </group>
      );
    case "composter":
      return (
        <group>
          <mesh position={[0, 0.4, 0]} castShadow><boxGeometry args={[0.8, 0.8, 0.8]} /><Mat color="#3d6b3f" /></mesh>
          <mesh position={[0, 0.83, 0]}><boxGeometry args={[0.85, 0.06, 0.85]} /><Mat color="#2c4f2e" /></mesh>
          {(b.data.ready ?? 0) > 0 && <Ready />}
        </group>
      );
    case "rainBarrel":
      return (
        <group>
          <mesh position={[0, 0.45, 0]} castShadow><cylinderGeometry args={[0.33, 0.3, 0.9, 12]} /><Mat color="#3f6f8f" /></mesh>
          <mesh position={[0, 0.91, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.02, 12]} />
            <Mat color={(b.data.water ?? 0) > 0 ? "#6fb3dc" : "#2b3d4a"} />
          </mesh>
        </group>
      );
    case "beehive":
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[0, 0.2 + i * 0.28, 0]} castShadow><boxGeometry args={[0.6, 0.26, 0.5]} /><Mat color={i % 2 ? "#f5e7b8" : "#fbf6ef"} /></mesh>
          ))}
          <mesh position={[0, 1.0, 0]}><boxGeometry args={[0.7, 0.06, 0.6]} /><Mat color="#b5532f" /></mesh>
          {b.data.ready ? <Ready /> : null}
        </group>
      );
    case "birdHouse":
      return (
        <group>
          <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.04, 0.04, 1.2, 6]} /><Mat color="#7a5636" /></mesh>
          <mesh position={[0, 1.3, 0]} castShadow><boxGeometry args={[0.35, 0.35, 0.35]} /><Mat color="#c0603b" /></mesh>
          <mesh position={[0, 1.58, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.32, 0.25, 4]} /><Mat color="#6b4423" /></mesh>
          <mesh position={[0, 1.3, 0.18]}><circleGeometry args={[0.06, 10]} /><Mat color="#2a2017" /></mesh>
        </group>
      );
    case "bugHotel":
      return (
        <group>
          <mesh position={[0, 0.45, 0]} castShadow><boxGeometry args={[0.7, 0.9, 0.4]} /><Mat color="#9a6b3f" /></mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <mesh key={i} position={[-0.2 + (i % 3) * 0.2, 0.3 + Math.floor(i / 3) * 0.3, 0.21]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, 0.02, 8]} /><Mat color="#4a2f1c" />
            </mesh>
          ))}
          <mesh position={[0, 1.0, 0]} rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.55, 0.3, 4]} /><Mat color="#3f7d4e" /></mesh>
        </group>
      );
    case "scarecrow":
      return (
        <group>
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.04, 0.04, 1.4, 6]} /><Mat color="#7a5636" /></mesh>
          <mesh position={[0, 1.05, 0]}><boxGeometry args={[0.9, 0.06, 0.06]} /><Mat color="#7a5636" /></mesh>
          <mesh position={[0, 0.95, 0]}><boxGeometry args={[0.35, 0.45, 0.2]} /><Mat color="#3f86b0" /></mesh>
          <mesh position={[0, 1.38, 0]}><sphereGeometry args={[0.15, 8, 6]} /><Mat color="#e0c27a" /></mesh>
          <mesh position={[0, 1.52, 0]}><coneGeometry args={[0.25, 0.2, 10]} /><Mat color="#d6b04a" /></mesh>
        </group>
      );
    case "greenhouse":
      return (
        <group>
          {/* Glass walls with a gap for the door. */}
          <mesh position={[0, 1.1, 0]}>
            <boxGeometry args={[w - 0.1, 2.2, h - 0.1]} />
            <meshStandardMaterial color="#cfeef0" transparent opacity={0.22} roughness={0.05} depthWrite={false} />
          </mesh>
          <mesh position={[0, 2.55, 0]} rotation={[0, Math.PI / 4, 0]} scale={[w * 0.7, 0.8, h * 0.7]}>
            <coneGeometry args={[1, 1, 4]} />
            <meshStandardMaterial color="#cfeef0" transparent opacity={0.3} roughness={0.05} depthWrite={false} />
          </mesh>
          {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], i) => (
            <mesh key={i} position={[sx * (w / 2 - 0.05), 1.1, sz * (h / 2 - 0.05)]}><boxGeometry args={[0.1, 2.2, 0.1]} /><Mat color="#fbf6ef" /></mesh>
          ))}
          <mesh position={[0, 2.2, 0]}><boxGeometry args={[w, 0.08, 0.08]} /><Mat color="#fbf6ef" /></mesh>
        </group>
      );
    case "fence":
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[0.14, 0.7, 0.14]} /><Mat color="#b08458" /></mesh>
          {[0.25, 0.5].map((y) => (
            <mesh key={y} position={[0, y, 0]}><boxGeometry args={[1, 0.08, 0.06]} /><Mat color="#c49a6c" /></mesh>
          ))}
        </group>
      );
    case "flowerBed":
      return (
        <group>
          <mesh position={[0, 0.06, 0]}><boxGeometry args={[0.9, 0.12, 0.9]} /><Mat color="#5a3a22" /></mesh>
          {["#e85d75", "#f2c230", "#9b6ad6", "#fbf6ef", "#e8792b"].map((c, i) => (
            <group key={i} position={[Math.cos(i * 1.25) * 0.28, 0, Math.sin(i * 1.25) * 0.28]}>
              <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.015, 0.015, 0.25, 4]} /><Mat color="#4f8a2e" /></mesh>
              <mesh position={[0, 0.34, 0]}><sphereGeometry args={[0.07, 6, 5]} /><Mat color={c} /></mesh>
            </group>
          ))}
        </group>
      );
    case "pathStone":
      return (
        <mesh position={[0, 0.02, 0]} receiveShadow><cylinderGeometry args={[0.42, 0.45, 0.06, 8]} /><Mat color="#b9b2a4" /></mesh>
      );
    case "mineEntrance":
      return <MineEntrance />;
    case "noticeBoard":
      return (
        <group>
          {[-0.35, 0.35].map((x) => (
            <mesh key={x} position={[x, 0.6, 0]} castShadow><boxGeometry args={[0.08, 1.2, 0.08]} /><Mat color="#7a5636" /></mesh>
          ))}
          <mesh position={[0, 0.95, 0]} castShadow><boxGeometry args={[0.95, 0.6, 0.06]} /><Mat color="#b08458" /></mesh>
          <mesh position={[0, 1.3, 0]}><boxGeometry args={[1.05, 0.08, 0.14]} /><Mat color="#6b4423" /></mesh>
          {[[-0.25, 1.02, "#fbf6ef"], [0.12, 0.9, "#ffe7a8"], [0.3, 1.05, "#fbf6ef"], [-0.1, 0.82, "#dcebd6"]].map(([x, y, c], i) => (
            <mesh key={i} position={[x as number, y as number, 0.035]} rotation-z={(i - 1.5) * 0.08}>
              <boxGeometry args={[0.22, 0.2, 0.01]} /><Mat color={c as string} />
            </mesh>
          ))}
        </group>
      );
    case "barn":
    case "smallBarn":
    case "chickenCoop":
      return (
        <group>
          <Cottage w={w} h={h} wall={b.kind === "chickenCoop" ? "#fbf6ef" : "#a8382c"} roof="#3a3a3a" trim="#fbf6ef" />
          {(b.data.ready ?? 0) > 0 || (b.data.eggs ?? 0) > 0 ? <Ready /> : null}
        </group>
      );
    case "silo":
    case "waterTower":
      return (
        <group>
          <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.7, 0.7, 3.2, 12]} /><Mat color={b.kind === "silo" ? "#c0603b" : "#9a6b3f"} /></mesh>
          <mesh position={[0, 3.45, 0]} castShadow><coneGeometry args={[0.75, 0.5, 12]} /><Mat color="#8f948f" /></mesh>
        </group>
      );
    case "windmill":
      return (
        <group>
          <mesh position={[0, 1.6, 0]} castShadow><cylinderGeometry args={[0.5, 0.8, 3.2, 8]} /><Mat color="#b08458" /></mesh>
          <mesh position={[0, 3, 0.85]} rotation-z={Math.PI / 4}><boxGeometry args={[2.6, 0.25, 0.05]} /><Mat color="#fbf6ef" /></mesh>
          <mesh position={[0, 3, 0.85]} rotation-z={-Math.PI / 4}><boxGeometry args={[2.6, 0.25, 0.05]} /><Mat color="#fbf6ef" /></mesh>
        </group>
      );
    case "well":
      return (
        <group>
          <mesh position={[0, 0.3, 0]} castShadow><cylinderGeometry args={[0.4, 0.42, 0.6, 12]} /><Mat color="#b9b2a4" /></mesh>
          <mesh position={[0, 1.05, 0]} rotation-y={Math.PI / 4}><coneGeometry args={[0.6, 0.35, 4]} /><Mat color="#a8382c" /></mesh>
        </group>
      );
    default:
      // Simple stand-in while a model loads.
      return (
        <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[w - 0.3, 1.2, h - 0.3]} /><Mat color="#c9b28f" /></mesh>
      );
  }
});

const town = (name: string) => model("town", name);

/**
 * A building made from Kenney's modular town pieces. Each wall piece is a thin panel on the +x edge of a
 * 1×1 cell, so it's rotated to face outward on each side of a w×d box.
 */
function Walls({ w, d, floors, front, z = 0 }: { w: number; d: number; floors: number; front: (i: number, floor: number) => string; z?: number }) {
  const x0 = -(w - 1) / 2, z0 = -(d - 1) / 2 + z;
  const pieces: { name: string; x: number; y: number; z: number; ry: number }[] = [];
  for (let f = 0; f < floors; f++) {
    const side = (k: number) => (f > 0 || k % 2 === 1 ? "wall-wood-window-shutters" : "wall-wood");
    for (let i = 0; i < w; i++) {
      pieces.push({ name: front(i, f), x: x0 + i, y: f, z: z0 + d - 1, ry: -Math.PI / 2 });
      pieces.push({ name: f > 0 && i % 2 ? "wall-wood-window-small" : "wall-wood", x: x0 + i, y: f, z: z0, ry: Math.PI / 2 });
    }
    for (let j = 0; j < d; j++) {
      pieces.push({ name: side(j), x: x0 + w - 1, y: f, z: z0 + j, ry: 0 });
      pieces.push({ name: side(j + 1), x: x0, y: f, z: z0 + j, ry: Math.PI });
    }
  }
  return (
    <group>
      {pieces.map((p, k) => <Model key={k} url={town(p.name)} position={[p.x, p.y, p.z]} rotation-y={p.ry} />)}
    </group>
  );
}

/** The roof: one gable piece stretched over the whole building. */
function Roof({ w, d, y, z = 0 }: { w: number; d: number; y: number; z?: number }) {
  return <Model url={town("roof-high-gable")} position={[0, y, z]} rotation-y={Math.PI / 2} scale={[d / 1.1 + 0.15, 1.1, w / 1.1 + 0.1]} />;
}

/** Kenney models where we have a good one; everything else keeps its hand-built shape. */
function Fancy({ b }: { b: Building }) {
  const [w, h] = BUILDING_SIZE[b.kind];
  const mid = Math.floor(w / 2);
  switch (b.kind) {
    case "house":
      return (
        <group>
          <Walls w={w} d={h} floors={2} front={(i, f) => (f === 0 && i === mid ? "wall-wood-door" : i % 2 ? "wall-wood-window-shutters" : "wall-wood")} />
          <Roof w={w} d={h} y={2} />
          <Model url={town("chimney")} position={[1.2, 2.4, -0.6]} scale={[1, 1.2, 1]} />
          <Model url={town("lantern")} position={[1.1, 0, h / 2 + 0.25]} />
        </group>
      );
    case "store":
      return (
        <group>
          <Walls w={w} d={h - 1} z={-0.5} floors={1} front={(i) => (i === mid ? "wall-wood-door" : "wall-wood-window-shutters")} />
          <Roof w={w} d={h - 1} y={1} z={-0.5} />
          <Model url={town("stall-green")} position={[-1.5, 0, h / 2 - 0.5]} />
          <Model url={town("stall-red")} position={[1.5, 0, h / 2 - 0.5]} />
          <Model url={town("banner-green")} position={[-0.9, 0, h / 2 - 1]} />
        </group>
      );
    case "shippingBin":
      return <Model url={model("survival", "box-large")} scale={1.6} />;
    case "chest":
      return <Model url={model("survival", "chest")} position={[0, 0.12, -0.15]} scale={3} />;
    case "fence":
      return <Model url={model("nature", "fence_simple")} position={[0, 0, 0.47]} scale={[1, 1.5, 1]} />;
    case "pathStone":
      return <Model url={model("nature", "path_stoneCircle")} position={[0, 0.01, 0]} />;
    case "extension":
      return (
        <group>
          <Walls w={w} d={h} floors={1} front={(i) => (i === mid ? "wall-wood-door" : "wall-wood-window-shutters")} />
          <Roof w={w} d={h} y={1} />
          <Model url={town("banner-green")} position={[1.6, 0, h / 2 + 0.15]} />
          <Model url={town("stall-bench")} position={[-1.4, 0, h / 2 + 0.4]} />
        </group>
      );
    case "cottage":
      return (
        <group>
          <Walls w={w} d={h} floors={1} front={(i) => (i === 2 ? "wall-wood-door" : "wall-wood-window-small")} />
          <Roof w={w} d={h} y={1} />
          <Model url={town("chimney")} position={[0.9, 1.3, -0.5]} />
        </group>
      );
    case "fountain":
      return <Model url={town("fountain-round-detail")} scale={1.9} />;
    case "lamp":
      return (
        <group>
          <Model url={town("lantern")} />
          <mesh position={[0, 1.4, 0]}>
            <sphereGeometry args={[0.09, 8, 6]} />
            <meshStandardMaterial color="#ffe7a8" emissive="#ffc861" emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case "field":
      return (
        <group>
          {[-1, 0, 1].map((r) => (
            <mesh key={r} position={[0, 0.02, r]} receiveShadow>
              <boxGeometry args={[w - 0.2, 0.06, 0.6]} />
              <meshStandardMaterial color="#5a3a22" roughness={1} />
            </mesh>
          ))}
          {[-2, -1, 0, 1, 2].flatMap((c) => [-1, 0, 1].map((r) => (
            <Model key={`${c},${r}`} url={model("crops", "Corn_4")} position={[c, 0.03, r]} scale={0.5} rotation-y={(c * 3 + r) * 1.3} />
          )))}
        </group>
      );
    // Quaternius's farm buildings; the scales match the Godot version (godot/scene/buildings_view.gd).
    case "barn":
      return <Model url={model("qbuildings", b.data.owner ? "BigBarn" : "Barn")} scale={0.5} />;
    case "silo":
      return <Model url={model("qbuildings", "Silo")} scale={0.5} />;
    case "windmill":
      return <Model url={model("qbuildings", "Windmill")} scale={0.45} />;
    case "waterTower":
      return <Model url={model("qbuildings", "WaterTower")} scale={0.6} />;
    case "well":
      return <Model url={model("qbuildings", "Well")} scale={0.6} />;
    case "chickenCoop":
      return (
        <group>
          <Model url={model("qbuildings", "ChickenCoop")} scale={0.75} />
          {(b.data.ready ?? 0) > 0 || (b.data.eggs ?? 0) > 0 ? <Ready /> : null}
        </group>
      );
    case "smallBarn":
      return (
        <group>
          <Model url={model("qbuildings", "SmallBarn")} scale={0.45} />
          {(b.data.ready ?? 0) > 0 ? <Ready /> : null}
        </group>
      );
    case "prop":
      if (!b.data.model) return null;
      return <Model url={model(b.data.model.split("/")[0] as Pack, b.data.model.split("/")[1])} />;
    default:
      return <Procedural b={b} />;
  }
}

export function Buildings({ buildings }: { buildings: Building[] }) {
  return (
    <group>
      {buildings.map((b) => {
        const [w, h] = BUILDING_SIZE[b.kind];
        return (
          <group key={b.id} position={[b.x + (w - 1) / 2, 0, b.y + (h - 1) / 2]}>
            <Suspense fallback={<Procedural b={b} />}>
              <Fancy b={b} />
            </Suspense>
            {b.data.sign && (
              <Html position={[0, 3.1, 0]} center zIndexRange={[30, 0]} portal={labelLayer as React.MutableRefObject<HTMLElement>} style={{ pointerEvents: "none" }}>
                <div className="whitespace-nowrap rounded-full bg-soil px-3 py-1 text-xs font-black text-white shadow">
                  {b.kind === "store" ? "🌱" : "🔬"} {b.data.sign}
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
