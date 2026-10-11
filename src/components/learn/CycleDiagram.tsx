"use client";

import { useState } from "react";
import type { Level } from "@/content/soil/curriculum/types";

interface Step { icon: string; title: string; text: string; high?: string }

const CARBON: Step[] = [
  { icon: "☀️", title: "Photosynthesis", text: "Plants pull carbon dioxide (CO₂) from the air and use sunlight to turn it into sugars.", high: "6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂. Plants send a share of these sugars to their roots." },
  { icon: "🌿", title: "Into the soil", text: "Roots leak sugars into the soil, and dead leaves and roots fall on and into it.", high: "Root exudates and residues are the main entry points of carbon into soil." },
  { icon: "🦠", title: "Decomposers feast", text: "Bacteria, fungi, worms, and other decomposers eat the dead material for energy.", high: "Microbial respiration oxidizes organic carbon: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy." },
  { icon: "🟫", title: "Some becomes humus", text: "Part of the carbon becomes stable organic matter (humus) that can stay in soil for many years.", high: "Carbon protected inside aggregates or bound to clay minerals can persist for decades to centuries." },
  { icon: "💨", title: "Back to the air", text: "Breathing decomposers release CO₂ back into the air, and the cycle starts again.", high: "Tillage, erosion, and warming speed up decomposition and can make soils a net source of CO₂." },
];

const NITROGEN: Step[] = [
  { icon: "🌬️", title: "Nitrogen in the air", text: "About 78% of air is nitrogen gas (N₂), but plants can't use it in that form.", high: "N₂ has a very strong triple bond, so it takes a lot of energy to break." },
  { icon: "🫘", title: "Fixation", text: "Bacteria living in bumps (nodules) on bean and clover roots turn nitrogen gas into a form plants can use.", high: "Rhizobia use the enzyme nitrogenase to convert N₂ to ammonia (NH₃). Lightning and industrial fertilizer production also fix nitrogen." },
  { icon: "🍂", title: "Mineralization", text: "When plants and animals die, decomposers break them down and release nitrogen into the soil.", high: "Ammonification: organic N → ammonium (NH₄⁺)." },
  { icon: "🔬", title: "Nitrification", text: "Other bacteria change that nitrogen into nitrate, the form most plants drink up easily.", high: "NH₄⁺ → nitrite (NO₂⁻) → nitrate (NO₃⁻), carried out by nitrifying bacteria in well-aired soil." },
  { icon: "🌽", title: "Plant uptake", text: "Roots take in the nitrogen and use it to build proteins and DNA. Animals get it by eating plants.", high: "Plants absorb NH₄⁺ and NO₃⁻ and build amino acids and nucleic acids." },
  { icon: "💧", title: "Losses", text: "In soggy soil, bacteria turn nitrate back into gas. Extra nitrate can also wash into streams and groundwater.", high: "Denitrification: NO₃⁻ → N₂O → N₂ in low-oxygen soil. Nitrate is negatively charged, so it isn't held by soil and leaches easily, polluting water." },
];

export function CycleDiagram({ kind, level }: { kind: "carbon" | "nitrogen"; level: Level }) {
  const steps = kind === "carbon" ? CARBON : NITROGEN;
  const [i, setI] = useState(0);
  const s = steps[i];
  const R = 95;
  return (
    <div className="grid items-center gap-4 sm:grid-cols-[260px_1fr]">
      <svg viewBox="0 0 260 260" className="mx-auto w-64" role="img" aria-label={`${kind} cycle`}>
        <circle cx="130" cy="130" r={R} fill="none" stroke="#e3d6c1" strokeWidth="10" />
        {steps.map((st, k) => {
          const a = (k / steps.length) * Math.PI * 2 - Math.PI / 2;
          const x = 130 + Math.cos(a) * R, y = 130 + Math.sin(a) * R;
          return (
            <g key={st.title} onClick={() => setI(k)} className="cursor-pointer" role="button" tabIndex={0} aria-label={st.title}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setI(k); }}>
              <circle cx={x} cy={y} r="24" fill={k === i ? "#3f7d4e" : "#fffcf5"} stroke="#3f7d4e" strokeWidth="2" />
              <text x={x} y={y + 7} textAnchor="middle" className="text-[20px]">{st.icon}</text>
            </g>
          );
        })}
        <text x="130" y="126" textAnchor="middle" className="fill-ink text-[14px] font-black">{kind === "carbon" ? "Carbon" : "Nitrogen"}</text>
        <text x="130" y="144" textAnchor="middle" className="fill-muted text-[12px] font-bold">cycle</text>
      </svg>
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-muted">Step {i + 1} of {steps.length}</div>
        <h3 className="text-xl font-black">{s.icon} {s.title}</h3>
        <p className="mt-1">{s.text}</p>
        {level === "high" && s.high && <p className="mt-2 rounded-xl bg-sky/10 p-3 font-mono text-sm">{s.high}</p>}
        <div className="mt-3 flex gap-2">
          <button className="btn btn-ghost px-3 py-1.5 text-sm" onClick={() => setI((i - 1 + steps.length) % steps.length)}>← Back</button>
          <button className="btn btn-primary px-3 py-1.5 text-sm" onClick={() => setI((i + 1) % steps.length)}>Next step →</button>
        </div>
      </div>
    </div>
  );
}
