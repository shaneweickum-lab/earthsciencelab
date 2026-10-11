"use client";

import { useState } from "react";

const STEPS = [
  {
    title: "Bare rock", when: "The start",
    text: "Everything begins with parent material: solid bedrock, or loose material dropped by glaciers, rivers, wind, or volcanoes.",
    layers: [{ h: 100, color: "#7d7a76", label: "R" }],
  },
  {
    title: "Weathering cracks the rock", when: "Years to centuries",
    text: "Water freezes and expands in cracks, rain slowly dissolves minerals, and roots pry rock apart. Pioneer lichens and mosses cling to the surface.",
    layers: [{ h: 10, color: "#a59c8f", label: "C" }, { h: 90, color: "#7d7a76", label: "R" }],
  },
  {
    title: "Life moves in", when: "Hundreds of years",
    text: "Plants grow in the weathered bits. Dead roots and leaves add organic matter, and microbes and worms mix it in. A dark topsoil (A horizon) begins.",
    layers: [{ h: 8, color: "#4a3020", label: "A" }, { h: 22, color: "#a59c8f", label: "C" }, { h: 70, color: "#7d7a76", label: "R" }],
  },
  {
    title: "Layers develop", when: "Thousands of years",
    text: "Water moving down carries clay, iron, and minerals from the upper layers and deposits them lower, building a subsoil (B horizon).",
    layers: [{ h: 4, color: "#2b1d12", label: "O" }, { h: 14, color: "#4a3020", label: "A" }, { h: 20, color: "#9a5733", label: "B" }, { h: 22, color: "#a59c8f", label: "C" }, { h: 40, color: "#7d7a76", label: "R" }],
  },
  {
    title: "A mature soil", when: "Thousands to millions of years",
    text: "Over very long times a full profile forms. Very old, deeply weathered soils, like the red Oxisols of the tropics, have lost many of their nutrients.",
    layers: [{ h: 5, color: "#2b1d12", label: "O" }, { h: 16, color: "#4a3020", label: "A" }, { h: 8, color: "#c9b493", label: "E" }, { h: 26, color: "#9a5733", label: "B" }, { h: 20, color: "#a59c8f", label: "C" }, { h: 25, color: "#7d7a76", label: "R" }],
  },
];

const FACTORS = [
  { icon: "🌦️", name: "Climate", text: "Rain and temperature control how fast rock weathers and how much gets washed down." },
  { icon: "🐛", name: "Organisms", text: "Plants, animals, fungi, and microbes add organic matter and mix the soil." },
  { icon: "⛰️", name: "Relief (topography)", text: "Slopes lose soil to erosion; low spots collect water and soil." },
  { icon: "🪨", name: "Parent material", text: "The rock or sediment the soil formed from sets its starting minerals and texture." },
  { icon: "⏳", name: "Time", text: "Older soils usually have more distinct, more developed horizons." },
];

export function FormationTimeline() {
  const [step, setStep] = useState(0);
  const s = STEPS[step];
  let y = 0;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <svg viewBox="0 0 120 130" className="mx-auto w-40" role="img" aria-label={`Soil profile: ${s.title}`}>
          <rect x="10" y="0" width="100" height="18" fill="#cfe6f3" />
          {step >= 2 && [20, 40, 60, 80, 100].map((x) => <path key={x} d={`M${x} 18 l-3 -8 l3 3 l3 -6 l1 11`} fill="#4f8f3a" />)}
          {s.layers.map((l) => {
            const top = 18 + y;
            y += l.h * 1.1;
            return (
              <g key={l.label}>
                <rect x="10" y={top} width="100" height={l.h * 1.1} fill={l.color} className="transition-all duration-700" />
                <text x="104" y={top + (l.h * 1.1) / 2 + 3} textAnchor="end" className="fill-white text-[7px] font-black">{l.label}</text>
              </g>
            );
          })}
        </svg>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Step {step + 1} of {STEPS.length} · {s.when}</div>
          <h3 className="text-xl font-black">{s.title}</h3>
          <p className="mt-1">{s.text}</p>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-ghost px-3 py-1.5 text-sm" disabled={step === 0} onClick={() => setStep(step - 1)}>← Back</button>
            <button className="btn btn-primary px-3 py-1.5 text-sm" disabled={step === STEPS.length - 1} onClick={() => setStep(step + 1)}>Forward in time →</button>
          </div>
          <input type="range" min={0} max={STEPS.length - 1} value={step} onChange={(e) => setStep(Number(e.target.value))} className="mt-3 w-full" aria-label="Time" />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-black">The five soil-forming factors</h3>
        <ul className="grid gap-2 sm:grid-cols-5">
          {FACTORS.map((f) => (
            <li key={f.name} className="rounded-xl bg-paper p-2 text-center text-xs">
              <div className="text-2xl">{f.icon}</div>
              <div className="font-black">{f.name}</div>
              <div className="text-muted">{f.text}</div>
            </li>
          ))}
        </ul>
        <p className="mt-1 text-[11px] text-muted">After Hans Jenny, <em>Factors of Soil Formation</em> (1941).</p>
      </div>
    </div>
  );
}
