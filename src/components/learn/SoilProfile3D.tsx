"use client";

import { Html, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useMemo, useState } from "react";

interface Horizon {
  id: string;
  name: string;
  height: number;
  color: string;
  text: string;
}

const HORIZONS: Horizon[] = [
  { id: "O", name: "O: Organic layer", height: 0.18, color: "#2b1d12", text: "Fallen leaves, twigs, and rotting plant bits. Fungi and insects break it down into humus." },
  { id: "A", name: "A: Topsoil", height: 0.65, color: "#4a3020", text: "Dark, crumbly, and alive. Most roots, worms, and microbes live here. This is the most valuable layer for growing food." },
  { id: "E", name: "E: Leached layer", height: 0.3, color: "#c9b493", text: "Pale and bleached. Water flowing down has carried clay, iron, and nutrients out of this layer." },
  { id: "B", name: "B: Subsoil", height: 0.85, color: "#9a5733", text: "Where clay, iron, and minerals from above pile up. Often reddish or brown and harder for roots to get through." },
  { id: "C", name: "C: Parent material", height: 0.7, color: "#8b7d69", text: "Chunks of broken rock that are slowly weathering. The soil above formed from this material." },
  { id: "R", name: "R: Bedrock", height: 0.5, color: "#626167", text: "Solid rock. Over thousands of years, it cracks and breaks to become new parent material." },
];

const W = 1.6;

function seeded(n: number) {
  const x = Math.sin(n * 999) * 10000;
  return x - Math.floor(x);
}

function Column({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = HORIZONS.reduce((s, h) => s + h.height, 0);
  const layers = useMemo(() => {
    let top = total / 2;
    return HORIZONS.map((h) => {
      const y = top - h.height / 2;
      top -= h.height;
      return { ...h, y };
    });
  }, [total]);
  const topY = total / 2;

  return (
    <group>
      {layers.map((l) => (
        <group key={l.id}>
          <mesh
            position={[0, l.y, 0]}
            onClick={(e) => { e.stopPropagation(); onSelect(l.id); }}
            onPointerOver={(e) => { e.stopPropagation(); setHover(l.id); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { setHover(null); document.body.style.cursor = ""; }}
          >
            <boxGeometry args={[W, l.height, W]} />
            <meshStandardMaterial
              color={l.color}
              roughness={0.95}
              emissive={selected === l.id || hover === l.id ? "#ffcc66" : "#000000"}
              emissiveIntensity={selected === l.id ? 0.1 : hover === l.id ? 0.06 : 0}
            />
          </mesh>
          <Html position={[W / 2 + 0.12, l.y, W / 2]} center={false} zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
            <div className="rounded-md bg-white/90 px-1.5 text-xs font-black text-ink shadow">{l.id}</div>
          </Html>
        </group>
      ))}

      {/* Grass on top */}
      {Array.from({ length: 40 }, (_, i) => (
        <mesh key={`g${i}`} position={[(seeded(i) - 0.5) * W * 0.95, topY + 0.08, (seeded(i + 50) - 0.5) * W * 0.95]}>
          <coneGeometry args={[0.03, 0.18 + seeded(i + 7) * 0.12, 4]} />
          <meshStandardMaterial color={i % 3 ? "#4f8f3a" : "#6aa84f"} />
        </mesh>
      ))}

      {/* Roots reaching down through the A and into the B horizon */}
      {Array.from({ length: 9 }, (_, i) => {
        const len = 0.5 + seeded(i + 3) * 0.9;
        return (
          <mesh key={`r${i}`} position={[(seeded(i + 11) - 0.5) * W * 0.8, topY - 0.15 - len / 2, W / 2 + 0.005]}>
            <cylinderGeometry args={[0.012, 0.004, len, 5]} />
            <meshStandardMaterial color="#e8d8b0" />
          </mesh>
        );
      })}

      {/* Earthworms in the topsoil */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh
          key={`w${i}`}
          position={[(seeded(i + 21) - 0.5) * W * 0.7, layers[1].y + (seeded(i + 31) - 0.5) * 0.4, W / 2 + 0.02]}
          rotation={[0, 0, seeded(i + 41) * Math.PI]}
        >
          <capsuleGeometry args={[0.025, 0.14, 4, 8]} />
          <meshStandardMaterial color="#d98c8c" />
        </mesh>
      ))}

      {/* Rocks in the parent material */}
      {Array.from({ length: 14 }, (_, i) => {
        const face = i % 2 === 0;
        const a = (seeded(i + 61) - 0.5) * W * 0.85;
        return (
          <mesh
            key={`k${i}`}
            position={[face ? a : W / 2, layers[4].y + (seeded(i + 71) - 0.5) * 0.55, face ? W / 2 : a]}
            rotation={[seeded(i) * 3, seeded(i + 1) * 3, 0]}
          >
            <dodecahedronGeometry args={[0.06 + seeded(i + 81) * 0.07, 0]} />
            <meshStandardMaterial color="#a39a8c" roughness={1} flatShading />
          </mesh>
        );
      })}
    </group>
  );
}

export default function SoilProfile3D() {
  const [selected, setSelected] = useState<string | null>("A");
  const info = HORIZONS.find((h) => h.id === selected);
  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="h-[420px] overflow-hidden rounded-2xl bg-gradient-to-b from-[#cfe6f3] to-[#f6efe2]">
        <Canvas camera={{ position: [3.2, 1.6, 3.6], fov: 45 }} dpr={[1, 2]}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 6, 5]} intensity={1.4} />
          <Column selected={selected} onSelect={setSelected} />
          <OrbitControls enablePan={false} minDistance={3} maxDistance={8} autoRotate={!selected} autoRotateSpeed={1} />
        </Canvas>
      </div>
      <div className="space-y-2">
        {HORIZONS.map((h) => (
          <button
            key={h.id}
            onClick={() => setSelected(h.id)}
            className={`flex w-full items-center gap-3 rounded-xl border-2 p-2 text-left transition ${selected === h.id ? "border-ink bg-white" : "border-transparent hover:bg-white"}`}
          >
            <span className="h-8 w-8 shrink-0 rounded-lg" style={{ background: h.color }} />
            <span className="font-bold">{h.name}</span>
          </button>
        ))}
        {info && <p className="animate-pop-in rounded-xl bg-paper p-4">{info.text}</p>}
      </div>
    </div>
  );
}
