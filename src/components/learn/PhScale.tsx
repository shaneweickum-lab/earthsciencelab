"use client";

import { useState } from "react";

/**
 * Approximate relative nutrient availability by pH, after the classic Truog (1946) chart
 * reproduced in Weil & Brady. Values are 0–1 bar widths for teaching, not lab data.
 */
const NUTRIENTS: { name: string; color: string; avail: (ph: number) => number }[] = [
  { name: "Nitrogen (N)", color: "#3f86b0", avail: (ph) => bell(ph, 6.0, 8.0) },
  { name: "Phosphorus (P)", color: "#c0603b", avail: (ph) => bell(ph, 6.0, 7.5) },
  { name: "Potassium (K)", color: "#e0a83a", avail: (ph) => bell(ph, 6.0, 9.0) },
  { name: "Calcium & Magnesium", color: "#8a6f4e", avail: (ph) => bell(ph, 7.0, 8.5) },
  { name: "Iron, Manganese, Zinc", color: "#7d5a3c", avail: (ph) => bell(ph, 4.5, 6.5) },
];

/** Full availability between lo and hi, tapering off outside. */
function bell(ph: number, lo: number, hi: number) {
  if (ph >= lo && ph <= hi) return 1;
  const d = ph < lo ? lo - ph : ph - hi;
  return Math.max(0.15, 1 - d * 0.45);
}

const CROPS = [
  { name: "🫐 Blueberries", lo: 4.5, hi: 5.5 },
  { name: "🥔 Potatoes", lo: 5.0, hi: 6.5 },
  { name: "🍅 Most vegetables", lo: 6.0, hi: 7.0 },
  { name: "🌿 Alfalfa", lo: 6.5, hi: 7.5 },
];

const MARKS = [
  { ph: 4.5, label: "Very acidic" },
  { ph: 6.5, label: "Slightly acidic" },
  { ph: 7, label: "Neutral" },
  { ph: 8.5, label: "Alkaline" },
];

export function PhScale() {
  const [ph, setPh] = useState(6.5);
  const pct = ((ph - 4) / 5) * 100;
  const zone = ph < 5.5 ? "Strongly acidic" : ph < 6.5 ? "Moderately to slightly acidic" : ph <= 7.3 ? "Near neutral" : "Alkaline";
  return (
    <div className="space-y-4">
      <div>
        <div className="relative h-8 rounded-full" style={{ background: "linear-gradient(90deg,#d7322b,#e88a1f,#f2c230,#5aa04a,#3f86b0,#5c5470)" }}>
          <div className="absolute -top-1 h-10 w-1.5 rounded bg-ink shadow" style={{ left: `calc(${pct}% - 3px)` }} />
        </div>
        <input type="range" min={4} max={9} step={0.1} value={ph} onChange={(e) => setPh(Number(e.target.value))} className="mt-2 w-full" aria-label="Soil pH" />
        <div className="flex justify-between text-[11px] font-bold text-muted">
          {MARKS.map((m) => <span key={m.ph}>{m.ph} {m.label}</span>)}
        </div>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-black">pH {ph.toFixed(1)}</span>
        <span className="font-bold text-muted">{zone}</span>
      </div>
      <div className="space-y-1.5">
        <div className="text-sm font-black">How easily plants can get each nutrient</div>
        {NUTRIENTS.map((n) => (
          <div key={n.name} className="grid grid-cols-[150px_1fr] items-center gap-2 text-xs font-bold">
            <span>{n.name}</span>
            <div className="h-3 rounded-full bg-line">
              <div className="h-full rounded-full transition-all" style={{ width: `${n.avail(ph) * 100}%`, background: n.color }} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {CROPS.map((c) => {
          const happy = ph >= c.lo && ph <= c.hi;
          return (
            <span key={c.name} className={`rounded-full px-3 py-1 text-xs font-bold ${happy ? "bg-leaf-light text-leaf" : "bg-paper text-muted"}`}>
              {c.name} {c.lo}–{c.hi} {happy ? "😊" : ""}
            </span>
          );
        })}
      </div>
      <p className="text-[11px] text-muted">
        Each step on the pH scale is 10 times more acidic or basic than the next. Bars are approximate, after the classic nutrient availability chart in Weil &amp; Brady, <em>The Nature and Properties of Soils</em>.
      </p>
    </div>
  );
}
