"use client";

import { memo, useMemo } from "react";
import type { CropId } from "@/game/crops";
import { W } from "@/world/map";
import type { CropInstance, Tile } from "@/world/types";

const Mat = ({ color }: { color: string }) => <meshStandardMaterial color={color} flatShading />;

/** One plant of the given crop, drawn from simple shapes. */
export function Plant({ crop, vigor, seed }: { crop: CropId; vigor: number; seed: number }) {
  switch (crop) {
    case "corn": {
      const h = 0.45 * vigor;
      return (
        <group>
          <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[0.02, 0.025, h, 5]} /><Mat color="#5f9e3c" /></mesh>
          <mesh position={[0.03, h * 0.65, 0]}><capsuleGeometry args={[0.03, 0.07, 3, 6]} /><Mat color="#e8c547" /></mesh>
        </group>
      );
    }
    case "tomato":
      return (
        <group>
          <mesh position={[0, 0.12 * vigor, 0]}><icosahedronGeometry args={[0.1 * vigor, 0]} /><Mat color="#3f7a2e" /></mesh>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.cos(i * 2.1 + seed) * 0.08, 0.1 + i * 0.03, Math.sin(i * 2.1 + seed) * 0.08]}>
              <sphereGeometry args={[0.035, 8, 6]} /><Mat color="#d7322b" />
            </mesh>
          ))}
        </group>
      );
    case "potato":
      return (
        <group>
          <mesh position={[0, 0.03, 0]} scale={[1, 0.5, 1]}><sphereGeometry args={[0.1, 8, 6]} /><Mat color="#5a3a22" /></mesh>
          <mesh position={[0, 0.1 * vigor, 0]} scale={[1, 0.6, 1]}><icosahedronGeometry args={[0.09 * vigor, 0]} /><Mat color="#5b8f3a" /></mesh>
        </group>
      );
    case "beans":
      return (
        <group>
          <mesh position={[0, 0.08 * vigor, 0]}><icosahedronGeometry args={[0.1 * vigor, 0]} /><Mat color="#4c8a35" /></mesh>
          <mesh position={[0.06, 0.06, 0.05]} rotation={[0, 0, 0.6]}><capsuleGeometry args={[0.012, 0.06, 3, 5]} /><Mat color="#8bc34a" /></mesh>
        </group>
      );
    case "carrot":
      return (
        <group>
          {[-0.03, 0, 0.03].map((dx, i) => (
            <mesh key={i} position={[dx, 0.07 * vigor, 0]} rotation={[0, 0, dx * 6]}>
              <coneGeometry args={[0.025, 0.14 * vigor, 4]} /><Mat color="#62a83f" />
            </mesh>
          ))}
          <mesh position={[0, 0.005, 0]}><cylinderGeometry args={[0.025, 0.025, 0.01, 8]} /><Mat color="#e8792b" /></mesh>
        </group>
      );
    case "wheat": {
      const h = 0.32 * vigor;
      return <mesh position={[0, h / 2, 0]}><coneGeometry args={[0.05, h, 5]} /><Mat color="#d6b04a" /></mesh>;
    }
    case "squash":
      return (
        <group>
          {[0, 1, 2].map((i) => (
            <mesh key={i} position={[Math.cos(i * 2.1) * 0.07, 0.04, Math.sin(i * 2.1) * 0.07]} rotation={[-Math.PI / 2, 0, i]}>
              <circleGeometry args={[0.1 * vigor, 6]} /><meshStandardMaterial color="#3f7d2e" side={2} />
            </mesh>
          ))}
          <mesh position={[0.04, 0.05, -0.03]} scale={[1, 0.8, 1]}><sphereGeometry args={[0.055, 10, 8]} /><Mat color="#e88a1f" /></mesh>
        </group>
      );
    case "sunflower": {
      const h = 0.5 * vigor;
      return (
        <group>
          <mesh position={[0, h / 2, 0]}><cylinderGeometry args={[0.015, 0.02, h, 5]} /><Mat color="#4f8a2e" /></mesh>
          <mesh position={[0, h, 0.02]} rotation={[Math.PI / 2.4, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.015, 10]} /><Mat color="#f2c230" /></mesh>
          <mesh position={[0, h + 0.008, 0.025]} rotation={[Math.PI / 2.4, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.017, 8]} /><Mat color="#5a3a22" /></mesh>
        </group>
      );
    }
    case "clover":
      return (
        <group>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.3 + seed) * 0.07, 0.03 * vigor, Math.sin(i * 1.3 + seed) * 0.07]} scale={[1, 0.4, 1]}>
              <icosahedronGeometry args={[0.05 * vigor, 0]} /><Mat color="#4f9a3c" />
            </mesh>
          ))}
          {[0, 1].map((i) => (
            <mesh key={`f${i}`} position={[Math.cos(i * 3 + seed) * 0.05, 0.08 * vigor, Math.sin(i * 3 + seed) * 0.05]}>
              <sphereGeometry args={[0.025, 6, 5]} /><Mat color="#e9a7c8" />
            </mesh>
          ))}
        </group>
      );
    case "buckwheat":
      return (
        <group>
          <mesh position={[0, 0.07 * vigor, 0]}><icosahedronGeometry args={[0.08 * vigor, 0]} /><Mat color="#5d9c42" /></mesh>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos(i * 1.6 + seed) * 0.05, 0.14 * vigor, Math.sin(i * 1.6 + seed) * 0.05]}>
              <sphereGeometry args={[0.018, 6, 5]} /><Mat color="#fbf6ef" />
            </mesh>
          ))}
        </group>
      );
  }
}

const SPOTS: [number, number][] = [[-0.22, -0.2], [0.22, -0.18], [-0.2, 0.22], [0.2, 0.2]];

/** All the crops on one tile: a few plants that grow bigger as the crop matures. */
const CropTile = memo(function CropTile({ crop, x, z }: { crop: CropInstance; x: number; z: number }) {
  if (crop.dead) {
    return (
      <group position={[x, 0.05, z]}>
        {SPOTS.map(([dx, dz], i) => (
          <mesh key={i} position={[dx, 0.06, dz]} rotation={[0.5, i, 0.4]}>
            <coneGeometry args={[0.05, 0.2, 4]} /><Mat color="#8a6f4a" />
          </mesh>
        ))}
      </group>
    );
  }
  // Seed → sprout → young → mature: growth shows as size.
  const g = crop.growth;
  const vigor = g < 0.1 ? 0.25 : 0.35 + g * 0.75;
  const ripe = g >= 1;
  return (
    <group position={[x, 0.05, z]}>
      {g < 0.1 ? (
        SPOTS.map(([dx, dz], i) => (
          <mesh key={i} position={[dx, 0.03, dz]}><sphereGeometry args={[0.035, 5, 4]} /><Mat color="#7cc35a" /></mesh>
        ))
      ) : (
        SPOTS.map(([dx, dz], i) => (
          <group key={i} position={[dx, 0, dz]} scale={1.7}>
            <Plant crop={crop.id as CropId} vigor={vigor} seed={i * 5 + x * 3 + z} />
          </group>
        ))
      )}
      {crop.pests && (
        <mesh position={[0.1, 0.35, 0.1]}><sphereGeometry args={[0.04, 6, 5]} /><Mat color="#c0392b" /></mesh>
      )}
      {ripe && (
        <mesh position={[0, 1.0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.09, 0]} /><meshStandardMaterial color="#ffe066" emissive="#ffcc33" emissiveIntensity={0.7} />
        </mesh>
      )}
    </group>
  );
});

export function Crops({ tiles }: { tiles: Tile[] }) {
  const list = useMemo(
    () => tiles.flatMap((t, i) => (t.crop ? [{ crop: t.crop, x: i % W, z: Math.floor(i / W), i }] : [])),
    [tiles],
  );
  return (
    <group>
      {list.map((c) => <CropTile key={c.i} crop={c.crop} x={c.x} z={c.z} />)}
    </group>
  );
}
