"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { Color, type Group } from "three";
import { fullyTested, GRID_SIZE, plotHealth, type GameState, type Plot, type SeasonName } from "@/game/engine";

const POOR = new Color("#cdb184");
const RICH = new Color("#2e1c10");
const SPACING = 1.2;

const SKY: Record<SeasonName, string> = {
  Spring: "#d4ecf7",
  Summer: "#f3e6c4",
  Fall: "#f1d9c0",
  Winter: "#e7edf2",
};

function seeded(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function healthColor(h: number) {
  return h >= 70 ? "#3f7d4e" : h >= 45 ? "#c48a1c" : "#b8432f";
}

function Tufts({ count, color, height, seed, spread = 0.85 }: { count: number; color: string; height: number; seed: number; spread?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} position={[(seeded(seed + i) - 0.5) * spread, 0.26 + height / 2, (seeded(seed + i + 100) - 0.5) * spread]}>
          <coneGeometry args={[0.035, height, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </>
  );
}

function Crop({ plot, winter }: { plot: Plot; winter: boolean }) {
  if (winter) return null;
  const vigor = 0.5 + plotHealth(plot) / 140;
  const spots = [-0.27, 0, 0.27];
  return (
    <>
      {spots.flatMap((x, i) =>
        spots.map((z, j) => {
          const key = `${i}-${j}`;
          if (plot.crop === 0) {
            const h = 0.45 * vigor;
            return (
              <group key={key} position={[x, 0.25, z]}>
                <mesh position={[0, h / 2, 0]}>
                  <cylinderGeometry args={[0.02, 0.025, h, 5]} />
                  <meshStandardMaterial color="#5f9e3c" />
                </mesh>
                <mesh position={[0.03, h * 0.65, 0]}>
                  <capsuleGeometry args={[0.03, 0.07, 3, 6]} />
                  <meshStandardMaterial color="#e8c547" />
                </mesh>
              </group>
            );
          }
          if (plot.crop === 1) {
            return (
              <mesh key={key} position={[x, 0.25 + 0.08 * vigor, z]}>
                <icosahedronGeometry args={[0.1 * vigor, 0]} />
                <meshStandardMaterial color="#4c8a35" flatShading />
              </mesh>
            );
          }
          const h = 0.32 * vigor;
          return (
            <mesh key={key} position={[x, 0.25 + h / 2, z]}>
              <coneGeometry args={[0.05, h, 5]} />
              <meshStandardMaterial color="#d6b04a" />
            </mesh>
          );
        }),
      )}
    </>
  );
}

/** A messy tangle of weeds: tall grassy spikes, broad leaves, and a few dandelions. */
function Weeds({ seed }: { seed: number }) {
  return (
    <>
      {Array.from({ length: 28 }, (_, i) => {
        const h = 0.18 + seeded(seed + i * 3) * 0.32;
        return (
          <mesh
            key={`s${i}`}
            position={[(seeded(seed + i) - 0.5) * 0.92, 0.25 + h / 2, (seeded(seed + i + 50) - 0.5) * 0.92]}
            rotation={[(seeded(seed + i + 9) - 0.5) * 0.6, 0, (seeded(seed + i + 19) - 0.5) * 0.6]}
          >
            <coneGeometry args={[0.03, h, 3]} />
            <meshStandardMaterial color={i % 3 === 0 ? "#6f7d2a" : "#3e6b24"} />
          </mesh>
        );
      })}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`l${i}`} position={[(seeded(seed + i * 7) - 0.5) * 0.85, 0.29, (seeded(seed + i * 11) - 0.5) * 0.85]} scale={[1, 0.35, 1]}>
          <icosahedronGeometry args={[0.09, 0]} />
          <meshStandardMaterial color="#4f7a2c" flatShading />
        </mesh>
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={`d${i}`} position={[(seeded(seed + i * 13) - 0.5) * 0.8, 0.42 + seeded(seed + i) * 0.1, (seeded(seed + i * 17) - 0.5) * 0.8]}>
          <sphereGeometry args={[0.035, 8, 6]} />
          <meshStandardMaterial color="#f2c230" />
        </mesh>
      ))}
    </>
  );
}

function Tile({
  plot, selected, onSelect, winter,
}: { plot: Plot; selected: boolean; onSelect: () => void; winter: boolean }) {
  const ref = useRef<Group>(null);
  const [hover, setHover] = useState(false);
  const r = Math.floor(plot.id / GRID_SIZE);
  const c = plot.id % GRID_SIZE;
  const health = plotHealth(plot);
  const soilColor = useMemo(() => POOR.clone().lerp(RICH, Math.min(1, health / 90)), [health]);
  const has = (id: string) => plot.applied.includes(id as never);
  // Worms only show up once you've dug a shovel test and seen them.
  const worms = plot.known.shovel ? Math.floor(plot.life / 18) : 0;
  const tested = fullyTested(plot);
  const anyTest = plot.known.lab || plot.known.shovel || plot.known.water;

  useFrame(() => {
    if (!ref.current) return;
    const target = selected ? 0.15 : hover ? 0.07 : 0;
    ref.current.position.y += (target - ref.current.position.y) * 0.2;
  });

  return (
    <group ref={ref} position={[(c - 1) * SPACING, 0, (r - 1) * SPACING]}>
      <mesh
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ""; }}
      >
        <boxGeometry args={[1, 0.5, 1]} />
        <meshStandardMaterial color={soilColor} roughness={1} emissive={selected ? "#ffb347" : "#000"} emissiveIntensity={selected ? 0.25 : 0} />
      </mesh>

      {/* subsoil stripe so the tile reads as a soil block */}
      <mesh position={[0, -0.18, 0]}>
        <boxGeometry args={[1.005, 0.14, 1.005]} />
        <meshStandardMaterial color="#8a5a3a" roughness={1} />
      </mesh>

      {has("plow") &&
        [-0.3, -0.1, 0.1, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.255, 0]}>
            <boxGeometry args={[0.05, 0.01, 0.95]} />
            <meshStandardMaterial color="#1f130a" />
          </mesh>
        ))}
      {has("mulch") && (
        <mesh position={[0, 0.27, 0]}>
          <boxGeometry args={[0.96, 0.04, 0.96]} />
          <meshStandardMaterial color="#dcc072" roughness={1} />
        </mesh>
      )}
      {has("coverCrop") && <Tufts count={46} color="#5aa04a" height={0.12} seed={plot.id * 13} spread={0.92} />}
      {has("compost") && (
        <mesh position={[0.32, 0.3, 0.32]}>
          <sphereGeometry args={[0.09, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#3a2414" />
        </mesh>
      )}
      {has("grazing") && (
        <group position={[-0.25, 0.36, 0.28]}>
          <mesh>
            <boxGeometry args={[0.2, 0.12, 0.11]} />
            <meshStandardMaterial color="#f4f1ea" />
          </mesh>
          <mesh position={[0.12, 0.04, 0]}>
            <boxGeometry args={[0.07, 0.07, 0.07]} />
            <meshStandardMaterial color="#2a2017" />
          </mesh>
        </group>
      )}
      {plot.weedy ? <Weeds seed={plot.id * 31 + 5} /> : <Crop plot={plot} winter={winter} />}

      {plot.hedgerow &&
        [-0.36, -0.12, 0.12, 0.36].map((x, i) => (
          <mesh key={x} position={[x, 0.38, -0.52]}>
            <icosahedronGeometry args={[0.14 + seeded(plot.id + i) * 0.04, 0]} />
            <meshStandardMaterial color="#2f6b3a" flatShading />
          </mesh>
        ))}

      {/* worms visible on the front face, one per ~18 points of soil life */}
      {Array.from({ length: worms }, (_, i) => (
        <mesh key={`w${i}`} position={[(seeded(plot.id * 7 + i) - 0.5) * 0.8, -0.02 - seeded(i + plot.id) * 0.12, 0.505]} rotation={[0, 0, seeded(i * 3 + plot.id) * Math.PI]}>
          <capsuleGeometry args={[0.018, 0.09, 3, 6]} />
          <meshStandardMaterial color="#e09a9a" />
        </mesh>
      ))}
      {plot.biochar &&
        Array.from({ length: 8 }, (_, i) => (
          <mesh key={`b${i}`} position={[(seeded(plot.id + i * 5) - 0.5) * 0.85, 0.05 - seeded(i) * 0.15, -0.505]}>
            <boxGeometry args={[0.04, 0.04, 0.01]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}

      <Html position={[0, 0.95, 0]} center zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
        <div
          className="whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-black text-white shadow"
          style={{ background: tested ? healthColor(health) : "#6e5f50" }}
          title={tested ? "Plot health" : "Soil not fully tested yet"}
        >
          {tested ? Math.round(health) : "?"}
          {anyTest && !tested ? " 🧪" : ""}
          {plot.weedy ? " 🌿" : ""}
          {plot.noTill ? " 🚫" : ""}
        </div>
      </Html>
    </group>
  );
}

export default function FieldBoard3D({
  state, selected, onSelect, season,
}: { state: GameState; selected: number | null; onSelect: (id: number) => void; season: SeasonName }) {
  return (
    <Canvas camera={{ position: [3.6, 4.2, 4.6], fov: 40 }} dpr={[1, 2]} onPointerMissed={() => {}}>
      <color attach="background" args={[SKY[season]]} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 4]} intensity={1.3} />
      <mesh position={[0, -0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.4, 48]} />
        <meshStandardMaterial color={season === "Winter" ? "#dfe5e0" : "#9cbf6e"} />
      </mesh>
      {state.plots.map((p) => (
        <Tile key={p.id} plot={p} selected={selected === p.id} onSelect={() => onSelect(p.id)} winter={season === "Winter"} />
      ))}
      <OrbitControls enablePan={false} minPolarAngle={0.4} maxPolarAngle={1.2} minDistance={4} maxDistance={10} />
    </Canvas>
  );
}
