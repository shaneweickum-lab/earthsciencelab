"use client";

import { useState } from "react";

interface Node { id: string; label: string; icon: string; x: number; y: number; text: string }

/** Based on the soil food web in the USDA/SWCS Soil Biology Primer. */
const NODES: Node[] = [
  { id: "plants", label: "Plants", icon: "🌱", x: 60, y: 40, text: "Plants capture the sun's energy. Their roots, leaking sugars (exudates), and dead leaves feed the whole underground web." },
  { id: "om", label: "Organic matter", icon: "🍂", x: 60, y: 150, text: "Dead leaves, roots, and animal remains. Food for decomposers." },
  { id: "bacteria", label: "Bacteria", icon: "🦠", x: 200, y: 70, text: "Tiny single cells that break down simple materials and root sugars. A teaspoon of healthy soil holds a huge number of them." },
  { id: "fungi", label: "Fungi", icon: "🍄", x: 200, y: 175, text: "Thread-like hyphae break down tough material like wood. Mycorrhizal fungi trade nutrients with roots." },
  { id: "protozoa", label: "Protozoa", icon: "🫧", x: 340, y: 40, text: "Single-celled hunters that eat bacteria, releasing extra nitrogen that plants can use." },
  { id: "nematodes", label: "Nematodes", icon: "🪱", x: 340, y: 130, text: "Microscopic roundworms. Some eat bacteria, some eat fungi, some eat other nematodes, and a few attack roots." },
  { id: "arthropods", label: "Arthropods", icon: "🕷️", x: 340, y: 215, text: "Mites, springtails, beetles, centipedes, and spiders. Some shred leaves, some graze fungi, some hunt." },
  { id: "earthworms", label: "Earthworms", icon: "🪱", x: 200, y: 255, text: "Eat organic matter and the microbes on it, and leave behind nutrient-rich castings and tunnels." },
  { id: "animals", label: "Birds & mammals", icon: "🐦", x: 470, y: 150, text: "Birds, moles, and shrews eat earthworms and arthropods, linking soil life to the wider food web." },
];

/** prey → predator (energy flows this way) */
const EDGES: [string, string][] = [
  ["plants", "bacteria"], ["plants", "fungi"], ["plants", "om"], ["plants", "nematodes"],
  ["om", "bacteria"], ["om", "fungi"], ["om", "arthropods"], ["om", "earthworms"],
  ["bacteria", "protozoa"], ["bacteria", "nematodes"], ["fungi", "nematodes"], ["fungi", "arthropods"],
  ["bacteria", "earthworms"], ["fungi", "earthworms"], ["protozoa", "nematodes"], ["nematodes", "arthropods"],
  ["arthropods", "animals"], ["earthworms", "animals"],
];

export function FoodWeb() {
  const [sel, setSel] = useState<string>("bacteria");
  const node = NODES.find((n) => n.id === sel)!;
  const eats = EDGES.filter(([, to]) => to === sel).map(([f]) => f);
  const eatenBy = EDGES.filter(([f]) => f === sel).map(([, t]) => t);
  const pos = (id: string) => NODES.find((n) => n.id === id)!;
  const name = (id: string) => pos(id).label;
  return (
    <div className="space-y-3">
      <svg viewBox="0 0 530 290" className="w-full rounded-2xl bg-[#3d2716]" role="img" aria-label="Soil food web diagram">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10z" fill="#c9b493" />
          </marker>
        </defs>
        {EDGES.map(([f, t]) => {
          const a = pos(f), b = pos(t);
          const active = f === sel || t === sel;
          const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
          return (
            <line
              key={`${f}-${t}`}
              x1={a.x + (dx / len) * 26} y1={a.y + (dy / len) * 26} x2={b.x - (dx / len) * 28} y2={b.y - (dy / len) * 28}
              stroke={active ? "#f2c230" : "#8a6f4e"} strokeWidth={active ? 2.5 : 1.2} markerEnd="url(#arrow)" opacity={active ? 1 : 0.6}
            />
          );
        })}
        {NODES.map((n) => (
          <g key={n.id} onClick={() => setSel(n.id)} className="cursor-pointer" role="button" aria-label={n.label} tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSel(n.id); }}>
            <circle cx={n.x} cy={n.y} r={24} fill={n.id === sel ? "#f2c230" : "#fffcf5"} stroke="#2a2017" strokeWidth={1.5} />
            <text x={n.x} y={n.y + 6} textAnchor="middle" className="text-[18px]">{n.icon}</text>
            <text x={n.x} y={n.y + 38} textAnchor="middle" className="fill-[#f6efe2] text-[11px] font-bold">{n.label}</text>
          </g>
        ))}
      </svg>
      <div className="rounded-xl bg-paper p-4">
        <h3 className="font-black">{node.icon} {node.label}</h3>
        <p className="mt-1 text-sm">{node.text}</p>
        <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
          <div><strong>Gets energy from:</strong> {eats.length ? eats.map(name).join(", ") : "the sun (photosynthesis)"}</div>
          <div><strong>Food for:</strong> {eatenBy.length ? eatenBy.map(name).join(", ") : "top of this web"}</div>
        </div>
      </div>
      <p className="text-[11px] text-muted">Arrows show the direction energy flows (from food to eater). Simplified from the USDA/SWCS <em>Soil Biology Primer</em>.</p>
    </div>
  );
}
