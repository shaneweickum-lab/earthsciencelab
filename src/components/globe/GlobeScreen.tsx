"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { SOIL_ORDER_IDS, SOIL_ORDERS, type SoilOrderId } from "@/data/soilOrders";
import { SOIL_REGIONS, type SoilRegion } from "@/data/soilRegions";
import { TEXTURE_CLASSES, TEXTURE_INFO, type TextureClass } from "@/lib/soil/textureTriangle";
import { useProgress } from "@/store/progress";
import { TextureTrianglePlot } from "../learn/TextureTrianglePlot";

const Globe3D = dynamic(() => import("./Globe3D"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-white/70">Spinning up the planet…</div>,
});

type Mode = "orders" | "texture" | "quiz";
const PEAT_COLOR = "#2b1d12";

function textureColor(r: SoilRegion) {
  return r.texture ? TEXTURE_INFO[r.texture].color : PEAT_COLOR;
}

function textureLabel(r: SoilRegion) {
  return r.texture ? TEXTURE_INFO[r.texture].label : "Organic (peat / muck)";
}

interface QuizQ {
  region: SoilRegion;
  kind: "order" | "texture";
  options: string[];
  answer: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion(prev?: SoilRegion): QuizQ {
  const pool = SOIL_REGIONS.filter((r) => r !== prev);
  const region = pool[Math.floor(Math.random() * pool.length)];
  const kind = region.texture && Math.random() < 0.5 ? "texture" : "order";
  if (kind === "order") {
    const answer = SOIL_ORDERS[region.order].name;
    const wrong = shuffle(SOIL_ORDER_IDS.filter((o) => o !== region.order)).slice(0, 3).map((o) => SOIL_ORDERS[o].name);
    return { region, kind, answer, options: shuffle([answer, ...wrong]) };
  }
  const answer = TEXTURE_INFO[region.texture!].label;
  const wrong = shuffle(TEXTURE_CLASSES.filter((t) => t !== region.texture)).slice(0, 3).map((t) => TEXTURE_INFO[t].label);
  return { region, kind, answer, options: shuffle([answer, ...wrong]) };
}

export function GlobeScreen() {
  const [mode, setMode] = useState<Mode>("orders");
  const [selected, setSelected] = useState<SoilRegion | null>(null);
  const [filter, setFilter] = useState<SoilOrderId | TextureClass | "peat" | null>(null);
  const [quiz, setQuiz] = useState<QuizQ | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const visited = useProgress((s) => s.visitedRegions);
  const visitRegion = useProgress((s) => s.visitRegion);
  const answerGlobeQuiz = useProgress((s) => s.answerGlobeQuiz);

  const usedTextures = useMemo(() => {
    const set = new Set(SOIL_REGIONS.map((r) => r.texture ?? "peat"));
    return [...TEXTURE_CLASSES.filter((t) => set.has(t)), ...(set.has("peat") ? (["peat"] as const) : [])];
  }, []);

  function select(r: SoilRegion) {
    if (mode === "quiz") return;
    setSelected(r);
    visitRegion(r.id);
  }

  function switchMode(m: Mode) {
    setMode(m);
    setFilter(null);
    setPicked(null);
    if (m === "quiz") {
      const q = makeQuestion();
      setQuiz(q);
      setSelected(q.region);
    } else {
      setQuiz(null);
      setSelected(null);
    }
  }

  function answer(opt: string) {
    if (!quiz || picked) return;
    setPicked(opt);
    const correct = opt === quiz.answer;
    setStreak(correct ? streak + 1 : 0);
    answerGlobeQuiz(correct);
  }

  function nextQuestion() {
    const q = makeQuestion(quiz?.region);
    setQuiz(q);
    setSelected(q.region);
    setPicked(null);
  }

  const colorFor = (r: SoilRegion) =>
    mode === "quiz" ? (picked ? (quiz?.kind === "texture" ? textureColor(r) : SOIL_ORDERS[r.order].color) : "#ffffff")
      : mode === "texture" ? textureColor(r) : SOIL_ORDERS[r.order].color;

  const isDimmed = (r: SoilRegion) => {
    if (!filter) return false;
    if (mode === "orders") return r.order !== filter;
    return (r.texture ?? "peat") !== filter;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {([
            ["orders", "🎨 Soil Orders"],
            ["texture", "🤏 Texture"],
            ["quiz", "❓ Guess the Soil"],
          ] as const).map(([m, label]) => (
            <button key={m} onClick={() => switchMode(m)} className={`btn ${mode === m ? "btn-soil" : "btn-ghost"} px-4 py-2 text-sm`}>
              {label}
            </button>
          ))}
          <div className="ml-auto self-center text-sm font-bold text-muted">
            🧭 Visited {visited.length} / {SOIL_REGIONS.length}
            {visited.length < 10 && <span className="hidden sm:inline"> · {10 - visited.length} more for Soil Explorer</span>}
          </div>
        </div>

        <div className="relative h-[420px] overflow-hidden rounded-3xl bg-[radial-gradient(ellipse_at_center,#1b2b44_0%,#0b1220_75%)] sm:h-[560px]">
          <Globe3D
            regions={SOIL_REGIONS}
            colorFor={colorFor}
            selectedId={selected?.id ?? null}
            isDimmed={isDimmed}
            hideAnswers={mode === "quiz"}
            onSelect={select}
          />
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 text-center text-xs font-semibold text-white/60">
            Drag to spin · scroll or pinch to zoom · dominant soil types, simplified
          </div>
        </div>

        {mode !== "quiz" && (
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-black">{mode === "orders" ? "The 12 soil orders" : "Texture classes"}</h3>
              {filter && <button onClick={() => setFilter(null)} className="text-sm font-bold text-muted underline">Show all</button>}
            </div>
            <div className="flex flex-wrap gap-2">
              {mode === "orders"
                ? SOIL_ORDER_IDS.map((id) => (
                    <LegendChip key={id} color={SOIL_ORDERS[id].color} label={SOIL_ORDERS[id].name} active={filter === id} onClick={() => setFilter(filter === id ? null : id)} />
                  ))
                : usedTextures.map((t) => (
                    <LegendChip
                      key={t}
                      color={t === "peat" ? PEAT_COLOR : TEXTURE_INFO[t].color}
                      label={t === "peat" ? "Peat (organic)" : TEXTURE_INFO[t].label}
                      active={filter === t}
                      onClick={() => setFilter(filter === t ? null : t)}
                    />
                  ))}
            </div>
            {mode === "orders" && filter && SOIL_ORDERS[filter as SoilOrderId] && (
              <p className="mt-3 rounded-xl bg-paper p-3 text-sm">
                <strong>{SOIL_ORDERS[filter as SoilOrderId].nickname}.</strong> {SOIL_ORDERS[filter as SoilOrderId].description}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {mode === "quiz" && quiz ? (
          <QuizPanel quiz={quiz} picked={picked} onAnswer={answer} onNext={nextQuestion} streak={streak} />
        ) : selected ? (
          <RegionCard region={selected} onClose={() => setSelected(null)} />
        ) : (
          <div className="card p-6 text-center">
            <div className="text-5xl">🌍</div>
            <h2 className="mt-2 text-xl font-black">Pick a spot on the globe</h2>
            <p className="mt-1 text-muted">
              Each dot is a region with a famous soil. Tap one to see what kind of soil it has and why.
            </p>
            <p className="mt-3 text-sm text-muted">
              <strong>Soil orders</strong> group soils by how they formed. <strong>Texture</strong> tells you how sandy, silty, or clayey they are.
            </p>
          </div>
        )}
        {mode !== "quiz" && selected && <QuickJump visited={visited} onPick={select} />}
        {mode !== "quiz" && (
          <label className="card block p-4 text-sm font-black">
            Jump to a region
            <select
              aria-label="Jump to a region"
              value={selected?.id ?? ""}
              onChange={(e) => {
                const r = SOIL_REGIONS.find((x) => x.id === e.target.value);
                if (r) select(r);
              }}
              className="mt-2 w-full rounded-xl border-2 border-line bg-white px-3 py-2 font-bold"
            >
              <option value="" disabled>Choose a place…</option>
              {SOIL_REGIONS.map((r) => (
                <option key={r.id} value={r.id}>
                  {visited.includes(r.id) ? "✓ " : ""}{r.name} ({r.place})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
    </div>
  );
}

function LegendChip({ color, label, active, onClick }: { color: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-xs font-bold ${active ? "border-ink bg-white" : "border-line bg-white/60"}`}>
      <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ background: color }} />
      {label}
    </button>
  );
}

function RegionCard({ region, onClose }: { region: SoilRegion; onClose: () => void }) {
  const order = SOIL_ORDERS[region.order];
  return (
    <article className="card animate-pop-in overflow-hidden" key={region.id}>
      <div className="p-5 text-white" style={{ background: order.color }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider opacity-80">{region.place}</div>
            <h2 className="text-2xl font-black" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.35)" }}>{region.name}</h2>
          </div>
          <button onClick={onClose} className="rounded-full bg-black/20 px-2 text-lg" aria-label="Close">×</button>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-paper p-3">
            <div className="text-xs font-bold text-muted">Soil order</div>
            <div className="font-black">{order.name}</div>
            <div className="text-xs text-muted">{order.nickname}</div>
          </div>
          <div className="rounded-xl bg-paper p-3">
            <div className="text-xs font-bold text-muted">Texture</div>
            <div className="flex items-center gap-1.5 font-black">
              <span className="h-3 w-3 rounded-full" style={{ background: textureColor(region) }} />
              {textureLabel(region)}
            </div>
            {region.texture && (
              <div className="text-xs text-muted">
                ~{region.sand}% sand · {region.silt}% silt · {region.clay}% clay
              </div>
            )}
          </div>
        </div>
        <p>{region.traits}</p>
        {region.texture ? (
          <TextureTrianglePlot value={{ sand: region.sand!, silt: region.silt!, clay: region.clay! }} highlight={region.texture} showLabels={false} className="mx-auto w-56" />
        ) : (
          <p className="rounded-xl bg-paper p-3 text-sm">
            Peat and muck are mostly organic matter, not sand, silt, and clay, so they sit off the texture triangle entirely.
          </p>
        )}
        <div className="text-sm"><strong>🌾 What grows here:</strong> {region.grows}</div>
        <div className="rounded-xl border-l-4 border-sun bg-sun/10 p-3 text-sm"><strong>Did you know?</strong> {region.fact}</div>
        <details className="text-sm">
          <summary className="cursor-pointer font-bold">About {order.name}</summary>
          <p className="mt-2 text-muted">{order.description}</p>
          <p className="mt-1 text-xs text-muted">{order.nameMeaning}</p>
        </details>
      </div>
    </article>
  );
}

function QuickJump({ visited, onPick }: { visited: string[]; onPick: (r: SoilRegion) => void }) {
  const next = SOIL_REGIONS.filter((r) => !visited.includes(r.id)).slice(0, 4);
  if (next.length === 0) return null;
  return (
    <div className="card p-4">
      <div className="mb-2 text-sm font-black">Explore next</div>
      <div className="flex flex-wrap gap-2">
        {next.map((r) => (
          <button key={r.id} onClick={() => onPick(r)} className="rounded-full border-2 border-line bg-white px-3 py-1 text-xs font-bold hover:border-sky">
            {r.name}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuizPanel({ quiz, picked, onAnswer, onNext, streak }: { quiz: QuizQ; picked: string | null; onAnswer: (o: string) => void; onNext: () => void; streak: number }) {
  const correct = picked === quiz.answer;
  return (
    <div className="card space-y-4 p-5" key={quiz.region.id}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold uppercase tracking-wider text-sky">Guess the soil</div>
        <div className="text-sm font-bold">🔥 Streak {streak}</div>
      </div>
      <h2 className="text-xl font-black">
        The glowing pin is in <span className="text-clay">{quiz.region.name}</span> ({quiz.region.place}).
      </h2>
      <p className="font-bold">{quiz.kind === "order" ? "Which soil order is found here?" : "What's the texture of the soil here?"}</p>
      <div className="grid gap-2">
        {quiz.options.map((o) => {
          const state = !picked ? "idle" : o === quiz.answer ? "right" : o === picked ? "wrong" : "dim";
          return (
            <button
              key={o}
              onClick={() => onAnswer(o)}
              disabled={!!picked}
              className={`rounded-xl border-2 px-4 py-2.5 text-left font-bold ${
                state === "idle" ? "border-line bg-white hover:border-sky" :
                state === "right" ? "border-leaf bg-leaf-light" :
                state === "wrong" ? "border-danger bg-danger/10" : "border-line bg-white opacity-50"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="animate-pop-in space-y-3">
          <p className="rounded-xl bg-paper p-3 text-sm">
            <strong>{correct ? "Correct! +5 XP. " : `It's ${quiz.answer}. `}</strong>
            {quiz.region.traits}
          </p>
          <button onClick={onNext} className="btn btn-primary w-full">Next pin →</button>
        </div>
      )}
      <p className="text-xs text-muted">Hint: think about the climate. Is it hot and rainy, frozen, dry, volcanic, or grassland?</p>
    </div>
  );
}
