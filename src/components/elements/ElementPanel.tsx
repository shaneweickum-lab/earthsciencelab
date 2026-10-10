"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { CATEGORY_INFO, getElement, neutrons, type ChemElement } from "@/data/elements";

const AtomModel3D = dynamic(() => import("./AtomModel3D"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-white/60">Building atom…</div>,
});

const PHASE_LABEL = { solid: "🧱 Solid", liquid: "💧 Liquid", gas: "💨 Gas", unknown: "❓ Unknown" };

export function ElementPanel({ el, onSelect }: { el: ChemElement; onSelect: (z: number) => void }) {
  const [mode, setMode] = useState<"bohr" | "cloud">("bohr");
  const [playing, setPlaying] = useState(true);
  const cat = CATEGORY_INFO[el.category];
  const n = neutrons(el);
  const prev = getElement(el.z - 1);
  const next = getElement(el.z + 1);

  const facts: [string, string][] = [
    ["Atomic mass", el.massIsIsotope ? `[${el.mass}]` : String(el.mass)],
    ["Protons", String(el.z)],
    ["Neutrons", `${n}${el.massIsIsotope ? "" : ` (in ${el.name.toLowerCase()}-${el.isotope})`}`],
    ["Electrons", String(el.z)],
    ["Electron shells", el.shells.join(", ")],
    ["At room temp", PHASE_LABEL[el.phase]],
    ["Group · Period", `${el.group ?? "f-block"} · ${el.period}`],
    ["Discovered", el.discovered === "ancient" ? "Known since ancient times" : el.discovered],
  ];

  const found = [
    { icon: "🌌", label: "In the universe", text: el.foundIn.universe },
    { icon: "🌍", label: "On Earth", text: el.foundIn.earth },
    { icon: "🧬", label: "In living things", text: el.foundIn.life },
    { icon: "🏠", label: "Everyday uses", text: el.foundIn.uses },
  ];

  return (
    <article className="card animate-pop-in overflow-hidden" key={el.z} aria-live="polite">
      <div className="flex items-stretch gap-4 p-4" style={{ background: cat.color }}>
        <div className="grid w-24 shrink-0 place-items-center rounded-xl bg-white/85 p-2 text-center text-ink shadow-sm">
          <div className="self-start justify-self-start text-sm font-black">{el.z}</div>
          <div className="text-5xl font-black leading-none">{el.symbol}</div>
          <div className="text-[11px] font-bold">{el.massIsIsotope ? `[${el.mass}]` : el.mass}</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center text-ink">
          <div className="text-xs font-bold uppercase tracking-wider opacity-75">{cat.label}</div>
          <h2 className="text-3xl font-black">{el.name}</h2>
          <p className="mt-1 text-sm font-semibold">{el.summary}</p>
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-2">
        <div>
          <div className="relative h-72 overflow-hidden rounded-2xl">
            <AtomModel3D protons={el.z} neutrons={n} shells={el.shells} mode={mode} playing={playing} />
            <div className="absolute left-2 top-2 flex gap-1">
              <button onClick={() => setMode("bohr")} className={`rounded-full px-2.5 py-1 text-xs font-bold ${mode === "bohr" ? "bg-white text-ink" : "bg-white/15 text-white"}`}>Shells</button>
              <button onClick={() => setMode("cloud")} className={`rounded-full px-2.5 py-1 text-xs font-bold ${mode === "cloud" ? "bg-white text-ink" : "bg-white/15 text-white"}`}>Cloud</button>
              <button onClick={() => setPlaying(!playing)} className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-bold text-white" aria-label={playing ? "Pause" : "Play"}>
                {playing ? "⏸" : "▶"}
              </button>
            </div>
            <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex flex-wrap justify-center gap-x-3 text-[11px] font-bold text-white/85">
              <span><span className="text-[#e5484d]">●</span> {el.z} protons</span>
              <span><span className="text-[#b9bcc6]">●</span> {n} neutrons</span>
              <span><span className="text-[#3f9bff]">●</span> {el.z} electrons</span>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-muted">
            {mode === "bohr"
              ? "The shell (Bohr) model is a simplified picture. Real electrons don't travel in neat circles."
              : "Scientists picture electrons as a fuzzy cloud. Denser spots are where an electron is more likely to be."}
            {el.isotope > 300 ? " Big nuclei are drawn with fewer, representative particles." : ""}
          </p>
        </div>

        <dl className="grid grid-cols-2 content-start gap-2 text-sm">
          {facts.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-paper px-3 py-2">
              <dt className="text-[11px] font-bold uppercase tracking-wide text-muted">{k}</dt>
              <dd className="font-black">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="px-4 pb-4">
        <h3 className="mb-2 font-black">Where it&apos;s found</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {found.map((f) => (
            <div key={f.label} className="rounded-xl border border-line bg-white p-3">
              <div className="text-xs font-bold uppercase tracking-wide text-muted">
                {f.icon} {f.label}
              </div>
              <p className="mt-1 text-sm">{f.text}</p>
            </div>
          ))}
        </div>
        {el.crustPpm > 0 && (
          <p className="mt-2 text-xs text-muted">
            Earth&apos;s crust: about {formatPpm(el.crustPpm)} per million by weight.
          </p>
        )}
        <div className="mt-4 flex justify-between gap-2">
          <button className="btn btn-ghost px-3 py-1.5 text-sm" disabled={!prev} onClick={() => prev && onSelect(prev.z)}>
            ← {prev ? `${prev.z} ${prev.name}` : ""}
          </button>
          <button className="btn btn-ghost px-3 py-1.5 text-sm" disabled={!next} onClick={() => next && onSelect(next.z)}>
            {next ? `${next.z} ${next.name}` : ""} →
          </button>
        </div>
      </div>
    </article>
  );
}

function formatPpm(ppm: number) {
  if (ppm >= 1) return `${Math.round(ppm).toLocaleString()} parts`;
  if (ppm >= 0.001) return `${ppm.toPrecision(2)} parts`;
  return "a tiny trace (far less than 0.001 parts)";
}
