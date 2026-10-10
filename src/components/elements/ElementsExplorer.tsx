"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_INFO, ELEMENTS, findElements, getElement, type ElementCategory } from "@/data/elements";
import { useProgress } from "@/store/progress";
import { TOTAL_ELEMENTS } from "@/store/progressLogic";
import { ElementPanel } from "./ElementPanel";
import { PeriodicGrid2D } from "./PeriodicGrid2D";
import type { HeightMode } from "./PeriodicTable3D";

const PeriodicTable3D = dynamic(() => import("./PeriodicTable3D"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-white/60">Arranging 118 elements…</div>,
});

const HEIGHT_MODES: { id: HeightMode; label: string; hint: string }[] = [
  { id: "flat", label: "Flat", hint: "The classic table." },
  { id: "mass", label: "Atomic mass", hint: "Taller tiles have heavier atoms." },
  { id: "crust", label: "Found in Earth's crust", hint: "Taller tiles are more common in rocks and soil (log scale)." },
];

export function ElementsExplorer({ initialZ, onClose }: { initialZ: number | null; onClose?: () => void }) {
  const [selected, setSelected] = useState<number | null>(initialZ);
  const [view, setView] = useState<"3d" | "2d">("3d");
  const [heightMode, setHeightMode] = useState<HeightMode>("flat");
  const [filter, setFilter] = useState<ElementCategory | null>(null);
  const [query, setQuery] = useState("");
  const viewElement = useProgress((s) => s.viewElement);
  const viewed = useProgress((s) => s.viewedElements);

  useEffect(() => {
    if (window.innerWidth < 640) setView("2d");
  }, []);

  useEffect(() => {
    setSelected(initialZ);
  }, [initialZ]);

  useEffect(() => {
    if (selected) viewElement(selected);
  }, [selected, viewElement]);

  const results = useMemo(() => findElements(query), [query]);
  const matches = useMemo(() => (query.trim() ? new Set(results.map((r) => r.z)) : null), [query, results]);
  const el = selected ? getElement(selected) : undefined;

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (results[0]) {
      setSelected(results[0].z);
      setQuery("");
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:px-6">
      <header className="flex flex-wrap items-center gap-3">
        <div className="mr-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky">For every lab</p>
          <h1 className="font-display text-3xl font-black">⚛️ The Periodic Table</h1>
          <p className="text-sm text-muted">
            Everything around you is built from these 118 elements. Explored {viewed.length} / {TOTAL_ELEMENTS}.
          </p>
        </div>
        <form onSubmit={submitSearch} className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search: iron, Fe, 26…"
            aria-label="Search elements"
            className="w-56 rounded-full border-2 border-line bg-white px-4 py-2 font-semibold focus:border-sky focus:outline-none"
          />
          {query && results.length > 0 && (
            <ul className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-xl border border-line bg-white shadow-lg">
              {results.slice(0, 6).map((r) => (
                <li key={r.z}>
                  <button type="button" onClick={() => { setSelected(r.z); setQuery(""); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold hover:bg-paper">
                    <span className="grid h-7 w-7 place-items-center rounded text-xs font-black" style={{ background: CATEGORY_INFO[r.category].color }}>{r.symbol}</span>
                    {r.name}
                    <span className="ml-auto text-xs text-muted">{r.z}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
        {onClose && (
          <button onClick={onClose} className="btn btn-soil px-4 py-2" aria-label="Close periodic table">
            ✕ Close
          </button>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border-2 border-line bg-white p-0.5">
          {(["3d", "2d"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-1 text-sm font-bold ${view === v ? "bg-ink text-white" : ""}`}>
              {v === "3d" ? "3D" : "Grid"}
            </button>
          ))}
        </div>
        {view === "3d" && (
          <div className="flex flex-wrap rounded-full border-2 border-line bg-white p-0.5">
            {HEIGHT_MODES.map((m) => (
              <button key={m.id} title={m.hint} onClick={() => setHeightMode(m.id)} className={`rounded-full px-3 py-1 text-sm font-bold ${heightMode === m.id ? "bg-sky text-white" : ""}`}>
                {m.label}
              </button>
            ))}
          </div>
        )}
        <span className="text-xs text-muted">{view === "3d" ? HEIGHT_MODES.find((m) => m.id === heightMode)!.hint + " Drag to tilt, scroll to zoom, right-drag to slide." : "Tap any element."}</span>
      </div>

      <div className={`grid gap-4 ${el ? "lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]" : ""}`}>
        <div className="min-w-0 space-y-3">
          {view === "3d" ? (
            <div className="h-[420px] overflow-hidden rounded-2xl sm:h-[540px]">
              <PeriodicTable3D selected={selected} onSelect={setSelected} heightMode={heightMode} filter={filter} matches={matches} />
            </div>
          ) : (
            <PeriodicGrid2D selected={selected} onSelect={setSelected} filter={filter} matches={matches} viewed={viewed} />
          )}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(CATEGORY_INFO) as ElementCategory[]).map((c) => (
              <button
                key={c}
                onClick={() => setFilter(filter === c ? null : c)}
                title={CATEGORY_INFO[c].blurb}
                className={`flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-bold ${filter === c ? "border-ink bg-white" : "border-line bg-white/60"}`}
              >
                <span className="h-3 w-3 rounded-sm" style={{ background: CATEGORY_INFO[c].color }} />
                {CATEGORY_INFO[c].label}
              </button>
            ))}
          </div>
          {filter && <p className="rounded-xl bg-white p-3 text-sm"><strong>{CATEGORY_INFO[filter].label}:</strong> {CATEGORY_INFO[filter].blurb} ({ELEMENTS.filter((x) => x.category === filter).length} elements)</p>}
        </div>

        {el ? (
          <ElementPanel el={el} onSelect={setSelected} />
        ) : (
          <div className="card p-5 text-center text-muted lg:hidden">Pick an element to see its atom and where it&apos;s found.</div>
        )}
      </div>
      {!el && (
        <p className="hidden text-center text-muted lg:block">Pick any element to see its 3D atom and where it&apos;s found.</p>
      )}
    </div>
  );
}
