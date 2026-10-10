"use client";

import { useState } from "react";

const SLICES = [
  { id: "minerals", label: "Minerals", pct: 45, color: "#b08a5a", text: "Tiny bits of broken-down rock: sand, silt, and clay. They're the skeleton of the soil." },
  { id: "om", label: "Organic matter", pct: 5, color: "#3d2716", text: "Rotting leaves, roots, and microbes. Only about 5%, but it feeds soil life and holds water like a sponge." },
  { id: "water", label: "Water", pct: 25, color: "#3f86b0", text: "Fills some of the pores. Plants drink it, and it carries dissolved nutrients to roots." },
  { id: "air", label: "Air", pct: 25, color: "#a9cfe0", text: "Fills the other pores. Roots, worms, and most microbes need oxygen to breathe." },
];

export function SoilPie() {
  const [active, setActive] = useState(SLICES[0].id);
  const r = 80;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const current = SLICES.find((s) => s.id === active)!;
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <svg viewBox="0 0 220 220" className="w-56 shrink-0" role="img" aria-label="Pie chart of soil parts">
        <g transform="rotate(-90 110 110)">
          {SLICES.map((s) => {
            const len = (s.pct / 100) * c;
            const el = (
              <circle
                key={s.id}
                cx="110" cy="110" r={r} fill="none" stroke={s.color}
                strokeWidth={active === s.id ? 46 : 38}
                strokeDasharray={`${len} ${c - len}`}
                strokeDashoffset={-offset}
                className="cursor-pointer transition-all"
                onClick={() => setActive(s.id)}
              />
            );
            offset += len;
            return el;
          })}
        </g>
        <text x="110" y="106" textAnchor="middle" className="fill-ink text-[22px] font-black">{current.pct}%</text>
        <text x="110" y="126" textAnchor="middle" className="fill-muted text-[11px] font-semibold">{current.label}</text>
      </svg>
      <div className="flex-1 space-y-3">
        <div className="flex flex-wrap gap-2">
          {SLICES.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`flex items-center gap-2 rounded-full border-2 px-3 py-1 text-sm font-bold ${active === s.id ? "border-ink" : "border-line"}`}
            >
              <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
              {s.label} {s.pct}%
            </button>
          ))}
        </div>
        <p className="rounded-xl bg-paper p-4 text-[17px]">{current.text}</p>
      </div>
    </div>
  );
}
