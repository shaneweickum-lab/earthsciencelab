"use client";

import { useMemo, useState } from "react";

const COLORS = [
  { id: "dark", swatch: "#2e1f14", name: "Dark brown to black", meaning: "Lots of organic matter (humus)", detail: "Organic matter coats mineral grains and darkens them, so dark topsoils are usually rich in humus." },
  { id: "red", swatch: "#a5402b", name: "Red", meaning: "Iron oxides in well-drained, well-aired soil", detail: "The iron oxide hematite gives red colors. It forms where soil drains well and has plenty of oxygen, often in warm or old, weathered soils." },
  { id: "yellow", swatch: "#b9873a", name: "Yellow-brown", meaning: "Iron oxides in moister, cooler soil", detail: "The iron oxide goethite gives yellow-brown colors, common in soils that stay a bit moister." },
  { id: "gray", swatch: "#7f8a8c", name: "Gray or blue-gray", meaning: "Waterlogged soil with little oxygen", detail: "When soil stays saturated, microbes use up the oxygen and iron dissolves and moves away, leaving gray colors. Soil scientists call this gleying." },
  { id: "mottled", swatch: "repeating-radial-gradient(circle at 30% 30%,#8a8f8f 0 6px,#b0662f 6px 10px)", name: "Mottled (gray with orange spots)", meaning: "A water table that rises and falls", detail: "Spots of rusty orange in gray soil show where iron was stripped away and redeposited as the soil kept getting wet, then dry. These are called redoximorphic features." },
  { id: "pale", swatch: "#ddd3c0", name: "Pale or whitish", meaning: "A leached layer, or built-up lime or salt", detail: "Water washing through can strip color from a layer (like an E horizon). In dry places, white can mean calcium carbonate or salts collecting." },
];

export function ColorChart() {
  const [round, setRound] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const order = useMemo(() => [3, 0, 5, 1, 4, 2], []);
  const target = COLORS[order[round % COLORS.length]];
  const options = useMemo(() => {
    const others = COLORS.filter((c) => c.id !== target.id);
    const picks = [target, others[round % others.length], others[(round + 2) % others.length]];
    return picks.sort((a, b) => a.meaning.localeCompare(b.meaning));
  }, [target, round]);

  function choose(id: string) {
    if (picked) return;
    setPicked(id);
    if (id === target.id) setScore(score + 1);
  }

  return (
    <div className="space-y-4">
      <div className="grid items-center gap-4 sm:grid-cols-[140px_1fr]">
        <div className="mx-auto h-32 w-32 rounded-2xl shadow-inner ring-4 ring-white" style={{ background: target.swatch }} aria-label={`Soil color: ${target.name}`} role="img" />
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Sample {(round % COLORS.length) + 1} of {COLORS.length} · score {score}</div>
          <h3 className="text-lg font-black">This soil is {target.name.toLowerCase()}. What does that tell you?</h3>
          <div className="mt-2 grid gap-2">
            {options.map((o) => {
              const state = !picked ? "idle" : o.id === target.id ? "right" : o.id === picked ? "wrong" : "dim";
              return (
                <button key={o.id} onClick={() => choose(o.id)} disabled={!!picked}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-sm font-bold ${
                    state === "idle" ? "border-line bg-white hover:border-leaf" : state === "right" ? "border-leaf bg-leaf-light" : state === "wrong" ? "border-danger bg-danger/10" : "border-line bg-white opacity-50"
                  }`}>
                  {o.meaning}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {picked && (
        <div className="animate-pop-in flex flex-col gap-2 rounded-xl bg-paper p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p><strong>{picked === target.id ? "Yes! " : "Not quite. "}</strong>{target.detail}</p>
          <button className="btn btn-primary shrink-0 px-3 py-1.5 text-sm" onClick={() => { setPicked(null); setRound(round + 1); }}>Next sample →</button>
        </div>
      )}
      <p className="text-[11px] text-muted">Color meanings follow the USDA NRCS <em>Soil Survey Manual</em>. Scientists describe exact colors with Munsell color charts (hue, value, and chroma).</p>
    </div>
  );
}
