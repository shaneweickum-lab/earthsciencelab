"use client";

import { useState } from "react";
import { classifyTexture, compositionFromSandClay, TEXTURE_INFO, type Composition } from "@/lib/soil/textureTriangle";
import { TextureTrianglePlot } from "./TextureTrianglePlot";

const PRESETS: { name: string; c: Composition }[] = [
  { name: "🏖️ Beach sand", c: { sand: 94, silt: 4, clay: 2 } },
  { name: "🌻 Garden loam", c: { sand: 40, silt: 40, clay: 20 } },
  { name: "🌽 Iowa farmland", c: { sand: 15, silt: 65, clay: 20 } },
  { name: "🏺 Pottery clay", c: { sand: 15, silt: 20, clay: 65 } },
];

export function TextureTriangle() {
  const [comp, setComp] = useState<Composition>({ sand: 40, silt: 40, clay: 20 });
  const cls = classifyTexture(comp);
  const info = TEXTURE_INFO[cls];

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <TextureTrianglePlot value={comp} onPick={setComp} highlight={cls} className="w-full" />
      <div className="space-y-4">
        <div className="rounded-2xl p-4 text-white" style={{ background: info.color }}>
          <div className="text-xs font-bold uppercase tracking-wider opacity-80">Your soil is</div>
          <div className="text-3xl font-black" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>{info.label}</div>
        </div>
        <Slider label="Sand" color="text-sun" value={comp.sand} onChange={(v) => setComp(compositionFromSandClay(v, Math.min(comp.clay, 100 - v)))} />
        <Slider label="Clay" color="text-clay" value={comp.clay} max={100 - comp.sand} onChange={(v) => setComp(compositionFromSandClay(comp.sand, v))} />
        <div className="flex items-center justify-between rounded-xl bg-paper px-4 py-2 font-bold">
          <span className="text-sky">Silt (the rest)</span>
          <span>{comp.silt}%</span>
        </div>
        <dl className="space-y-2 text-sm">
          <div><dt className="font-black">How it feels</dt><dd className="text-muted">{info.feel}</dd></div>
          <div><dt className="font-black">Water</dt><dd className="text-muted">{info.drainage}</dd></div>
        </dl>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.name} onClick={() => setComp(p.c)} className="rounded-full border-2 border-line bg-white px-3 py-1 text-sm font-bold hover:border-leaf">
              {p.name}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted">Tip: tap anywhere on the triangle to jump there.</p>
      </div>
    </div>
  );
}

function Slider({ label, value, onChange, color, max = 100 }: { label: string; value: number; onChange: (v: number) => void; color: string; max?: number }) {
  return (
    <label className="block">
      <div className="flex justify-between font-bold">
        <span className={color}>{label}</span>
        <span>{value}%</span>
      </div>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}
