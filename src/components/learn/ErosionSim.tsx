"use client";

import { useEffect, useState } from "react";

type Cover = "bare" | "plowed" | "mulch" | "cover";
const COVERS: Record<Cover, { label: string; loss: number; top: string }> = {
  plowed: { label: "🚜 Freshly plowed", loss: 1.4, top: "#7a5232" },
  bare: { label: "🟫 Bare soil", loss: 1, top: "#6b4423" },
  mulch: { label: "🌾 Straw mulch", loss: 0.15, top: "#d9b86a" },
  cover: { label: "🌱 Cover crop", loss: 0.08, top: "#4f8f3a" },
};

function Field({ cover, setCover, soil, raining }: { cover: Cover; setCover: (c: Cover) => void; soil: number; raining: boolean }) {
  const runoff = 100 - soil;
  return (
    <div className="flex-1 space-y-2">
      <select value={cover} onChange={(e) => setCover(e.target.value as Cover)} className="w-full rounded-xl border-2 border-line bg-white px-3 py-2 font-bold">
        {Object.entries(COVERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
      </select>
      <svg viewBox="0 0 200 150" className="w-full rounded-xl bg-[#cfe6f3]">
        {raining && Array.from({ length: 24 }, (_, i) => (
          <line key={i} x1={(i * 37) % 200} y1={0} x2={(i * 37) % 200 - 4} y2={10} stroke="#3f86b0" strokeWidth={2} strokeLinecap="round">
            <animateTransform attributeName="transform" type="translate" from={`0 ${-(i % 5) * 12}`} to="0 90" dur={`${0.5 + (i % 3) * 0.15}s`} repeatCount="indefinite" />
          </line>
        ))}
        {/* subsoil */}
        <path d="M0 95 L200 115 L200 150 L0 150 Z" fill="#9a5733" />
        {/* topsoil band shrinks as soil washes away */}
        <path d={`M0 ${95 - (soil / 100) * 22} L200 ${115 - (soil / 100) * 22} L200 115 L0 95 Z`} fill="#4a3020" />
        {/* surface cover */}
        {cover === "cover" && Array.from({ length: 20 }, (_, i) => (
          <path key={i} d={`M${i * 10 + 4} ${95 - (soil / 100) * 22 + i - 1} l3 -10 l3 10`} fill="#4f8f3a" />
        ))}
        {cover === "mulch" && <path d={`M0 ${95 - (soil / 100) * 22 - 3} L200 ${115 - (soil / 100) * 22 - 3} L200 ${115 - (soil / 100) * 22} L0 ${95 - (soil / 100) * 22} Z`} fill="#d9b86a" />}
        {cover === "plowed" && Array.from({ length: 10 }, (_, i) => (
          <path key={i} d={`M${i * 20} ${95 - (soil / 100) * 22 + i * 2} q5 -5 10 0 q5 -5 10 0`} stroke="#3d2716" fill="none" strokeWidth={1.5} />
        ))}
        {/* muddy runoff bucket */}
        <rect x={160} y={118} width={34} height={28} fill="white" stroke="#2a2017" strokeWidth={1.5} rx={3} />
        <rect x={161} y={145 - Math.min(26, runoff * 0.26)} width={32} height={Math.min(26, runoff * 0.26)} fill="#8b5e3c" />
      </svg>
      <div className="flex justify-between text-sm font-bold">
        <span>Topsoil left</span>
        <span className={soil < 60 ? "text-danger" : "text-leaf"}>{Math.round(soil)}%</span>
      </div>
    </div>
  );
}

export function ErosionSim() {
  const [left, setLeft] = useState<Cover>("bare");
  const [right, setRight] = useState<Cover>("cover");
  const [soilL, setSoilL] = useState(100);
  const [soilR, setSoilR] = useState(100);
  const [raining, setRaining] = useState(false);
  const [intensity, setIntensity] = useState(3);

  useEffect(() => {
    if (!raining) return;
    let ticks = 0;
    const id = setInterval(() => {
      ticks++;
      setSoilL((s) => Math.max(0, s - COVERS[left].loss * intensity * 0.9));
      setSoilR((s) => Math.max(0, s - COVERS[right].loss * intensity * 0.9));
      if (ticks >= 20) setRaining(false);
    }, 120);
    return () => clearInterval(id);
  }, [raining, left, right, intensity]);

  const reset = () => { setSoilL(100); setSoilR(100); };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Field cover={left} setCover={(c) => { setLeft(c); reset(); }} soil={soilL} raining={raining} />
        <Field cover={right} setCover={(c) => { setRight(c); reset(); }} soil={soilR} raining={raining} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex flex-1 items-center gap-3 font-bold">
          Storm strength
          <input type="range" min={1} max={5} value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} className="flex-1" />
        </label>
        <button className="btn btn-primary" disabled={raining} onClick={() => setRaining(true)}>🌧️ Make it rain</button>
        <button className="btn btn-ghost" disabled={raining} onClick={reset}>Reset</button>
      </div>
      <p className="text-sm text-muted">
        Covered soil can lose far less soil in a storm than bare ground. Plants and mulch break the raindrops&apos; fall, and roots hold soil together.
      </p>
    </div>
  );
}
