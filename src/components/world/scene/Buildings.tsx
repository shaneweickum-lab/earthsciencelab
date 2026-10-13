"use client";

import { Html } from "@react-three/drei";
import { memo } from "react";
import { BUILDING_SIZE } from "@/world/map";
import type { Building } from "@/world/types";

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

const Model = memo(function Model({ b }: { b: Building }) {
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
          <Html position={[0, 3.3, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <div className="whitespace-nowrap rounded-full bg-soil px-3 py-1 text-xs font-black text-white shadow">🌱 Seed &amp; Soil Co.</div>
          </Html>
        </group>
      );
    case "shippingBin":
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow><boxGeometry args={[0.9, 0.7, 0.7]} /><Mat color="#9a6b3f" /></mesh>
          <mesh position={[0, 0.74, -0.1]} rotation={[-0.3, 0, 0]}><boxGeometry args={[0.95, 0.06, 0.75]} /><Mat color="#7a5230" /></mesh>
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
  }
});

export function Buildings({ buildings }: { buildings: Building[] }) {
  return (
    <group>
      {buildings.map((b) => {
        const [w, h] = BUILDING_SIZE[b.kind];
        return (
          <group key={b.id} position={[b.x + (w - 1) / 2, 0, b.y + (h - 1) / 2]}>
            <Model b={b} />
          </group>
        );
      })}
    </group>
  );
}
