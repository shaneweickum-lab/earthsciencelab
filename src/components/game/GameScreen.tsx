"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  advanceSeason, applyPractice, canApply, EVENTS, fieldHealth, fullyTested, GAME_VERSION, isKnown, newGame,
  ORGANIC_BONUS, organicMatterPercent, plantCrop, plotHealth, previewPractice, seasonName, starsFor, TOTAL_SEASONS, WIN_HEALTH,
  type GameState, type Metric, type Plot, type SeasonReport,
} from "@/game/engine";
import { CROPS, FAMILY_LABEL, type CropId } from "@/game/crops";
import { PRACTICE_ORDER, PRACTICES, type Practice, type PracticeId } from "@/game/practices";
import { useProgress } from "@/store/progress";
import { METRIC_INFO, METRICS, Modal, PreviewEffects } from "./previewParts";
import { SeedBag } from "./SeedBag";

const FieldBoard3D = dynamic(() => import("./FieldBoard3D"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">Preparing the garden…</div>,
});

const SAVE_KEY = "earthsciencelab-field-game";


function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const saved = raw ? (JSON.parse(raw) as GameState) : null;
    // Saves from older versions of the game don't have weeds or soil tests.
    return saved?.version === GAME_VERSION ? saved : null;
  } catch {
    return null;
  }
}

function save(state: GameState | null) {
  try {
    if (state) localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    /* storage unavailable: the game still works, it just won't resume */
  }
}

export function GameScreen() {
  const [game, setGame] = useState<GameState | null>(null);
  const [selected, setSelected] = useState<number>(0);
  const [report, setReport] = useState<SeasonReport | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, setPending] = useState<PracticeId | null>(null);
  const [showIntro, setShowIntro] = useState(false);
  const [seedBag, setSeedBag] = useState(false);
  const finishGame = useProgress((s) => s.finishGame);
  const recorded = useRef(false);

  useEffect(() => {
    const saved = loadSaved();
    if (saved) setGame(saved);
    else {
      setGame(newGame());
      setShowIntro(true);
    }
  }, []);

  useEffect(() => {
    if (game) save(game.status === "playing" ? game : null);
  }, [game]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!game) return <div className="card grid h-96 place-items-center text-muted">Loading garden…</div>;

  const season = seasonName(game.season);
  const year = Math.ceil(game.season / 4);
  const tested = game.plots.filter(fullyTested).length;
  const weeded = game.plots.filter((p) => !p.weedy).length;
  const allTested = tested === game.plots.length;
  const planted = game.plots.filter((p) => p.crop).length;
  const health = fieldHealth(game.plots);
  const plot = game.plots[selected];
  const over = game.status !== "playing";

  function confirm(id: PracticeId) {
    if (!game) return;
    const r = applyPractice(game, selected, id);
    if (!r.ok) setToast(r.reason);
    else {
      setGame(r.state);
      if (PRACTICES[id].kind === "test") setToast(`${PRACTICES[id].icon} Results are in for Plot ${selected + 1}!`);
    }
    setPending(null);
  }

  function plant(crop: CropId) {
    if (!game) return;
    const r = plantCrop(game, selected, crop);
    if (!r.ok) setToast(r.reason);
    else {
      setGame(r.state);
      setToast(`${CROPS[crop].icon} ${CROPS[crop].name} planted in Plot ${selected + 1}!`);
    }
    setSeedBag(false);
  }

  function endSeason() {
    if (!game) return;
    const { state, report } = advanceSeason(game);
    setGame(state);
    setReport(report);
    if (state.status !== "playing" && !recorded.current) {
      recorded.current = true;
      finishGame(starsFor(state), fieldHealth(state.plots));
    }
  }

  function restart() {
    recorded.current = false;
    setGame(newGame());
    setReport(null);
    setSelected(0);
    setShowIntro(true);
  }

  const forecast = EVENTS[game.forecast];

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <Stat label={`Year ${year}`} value={`${season === "Winter" ? "❄️" : season === "Summer" ? "☀️" : season === "Fall" ? "🍁" : "🌷"} ${season}`} />
        <Stat label="Season" value={`${game.season} / ${TOTAL_SEASONS}`} />
        <Stat label="Coins" value={`🪙 ${game.coins}`} />
        <div>
          <div className="text-xs font-bold text-muted">Status</div>
          <div className={`text-sm font-black ${game.organic ? "text-leaf" : "text-danger"}`} title={game.organic ? `Organic harvests sell for ${Math.round((ORGANIC_BONUS - 1) * 100)}% more` : "Certification lost"}>
            {game.organic ? "🌿 Certified organic" : "⚠️ Not organic"}
          </div>
        </div>
        <div className="min-w-48 flex-1">
          <div className="flex justify-between text-xs font-bold text-muted">
            <span>Soil Health Index {allTested ? "" : `· tested ${tested} / ${game.plots.length} plots`}</span>
            <span>Goal {WIN_HEALTH}</span>
          </div>
          <div className="relative mt-1 h-4 overflow-hidden rounded-full bg-line">
            {allTested ? (
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${health}%`, background: health >= WIN_HEALTH ? "#3f7d4e" : health >= 45 ? "#c48a1c" : "#b8432f" }}
              />
            ) : (
              <div className="h-full w-full bg-[repeating-linear-gradient(45deg,#e3d6c1_0_8px,#efe5d3_8px_16px)]" />
            )}
            <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${WIN_HEALTH}%` }} />
          </div>
          <div className="mt-0.5 text-right text-sm font-black">{allTested ? health : "? Test every plot to find out"}</div>
        </div>
      </div>

      {(weeded < game.plots.length || !allTested || planted < game.plots.length) && game.season === 1 && (
        <div className="card flex flex-wrap items-center gap-x-6 gap-y-2 border-sun bg-sun/10 px-5 py-3 text-sm">
          <strong>🧑‍🌾 First steps</strong>
          <Check done={weeded === game.plots.length}>Pull the weeds in every plot ({weeded} / {game.plots.length})</Check>
          <Check done={allTested}>Test the soil in every plot ({tested} / {game.plots.length})</Check>
          <Check done={planted === game.plots.length}>Plant seeds from the seed bag ({planted} / {game.plots.length})</Check>
          <span className="text-muted">Tip: tap a plot, then pick an action below.</span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="card relative h-[380px] overflow-hidden sm:h-[460px]">
            <FieldBoard3D state={game} selected={selected} onSelect={setSelected} season={season} />
            <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-muted">
              Tap a plot · drag to look around
            </div>
          </div>
          <div className="card flex items-start gap-3 p-4">
            <span className="text-4xl">{forecast.icon}</span>
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-wider text-sky">Forecast for this {season.toLowerCase()}</div>
              <div className="font-black">{forecast.name}</div>
              <p className="text-sm text-muted">{forecast.forecast}</p>
            </div>
            <button onClick={endSeason} disabled={over} className="btn btn-soil shrink-0">
              End {season} →
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <PlotPanel plot={plot} winter={season === "Winter"} onOpenSeedBag={() => setSeedBag(true)} />
          <div className="card space-y-4 p-4">
            <p className="text-sm text-muted">
              Take as many actions as you can afford. Tap one to see what it will do to <strong>Plot {selected + 1}</strong> before you commit.
            </p>
            <Section title="🧑‍🌾 Garden care & soil tests" game={game} selected={selected} kinds={["care", "test"]} onPick={setPending} />
            <Section title="🌿 Organic & regenerative" game={game} selected={selected} kinds={["regenerative"]} onPick={setPending} />
            <Section title="⚠️ Shortcuts" game={game} selected={selected} kinds={["conventional"]} onPick={setPending} />
          </div>
          <button onClick={() => setShowIntro(true)} className="text-sm font-bold text-muted underline">
            How to play
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4">
          <div className="animate-pop-in rounded-full bg-ink px-4 py-2 font-bold text-white shadow-lg">{toast}</div>
        </div>
      )}

      {seedBag && <SeedBag game={game} plotId={selected} onPlant={plant} onClose={() => setSeedBag(false)} />}
      {pending && <PreviewModal game={game} plotId={selected} practiceId={pending} onConfirm={confirm} onCancel={() => setPending(null)} />}
      {report && !over && <ReportModal report={report} onClose={() => setReport(null)} />}
      {over && <EndModal game={game} onRestart={restart} />}
      {showIntro && <IntroModal onClose={() => setShowIntro(false)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-muted">{label}</div>
      <div className="text-lg font-black">{value}</div>
    </div>
  );
}

function Check({ done, children }: { done: boolean; children: React.ReactNode }) {
  return (
    <span className={`flex items-center gap-1.5 font-semibold ${done ? "text-leaf" : ""}`}>
      <span className={`grid h-5 w-5 place-items-center rounded-full border-2 text-xs ${done ? "border-leaf bg-leaf text-white" : "border-muted"}`}>{done ? "✓" : ""}</span>
      {children}
    </span>
  );
}

function metricValue(plot: Plot, m: Metric): { pct: number; display: string } {
  if (m === "om") return { pct: plot.om, display: `${organicMatterPercent(plot.om)}%` };
  if (m === "ph") return { pct: ((plot.ph - 4.5) / 3.5) * 100, display: plot.ph.toFixed(1) };
  return { pct: plot[m], display: String(Math.round(plot[m])) };
}

function PlotPanel({ plot, winter, onOpenSeedBag }: { plot: Plot; winter: boolean; onOpenSeedBag: () => void }) {
  const crop = plot.crop ? CROPS[plot.crop] : null;
  const testedAll = fullyTested(plot);
  const status = crop ? `${crop.icon} ${crop.name} growing` : plot.weedy ? "🌿 Overgrown" : "🟫 Empty plot";
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-black">
          Plot {plot.id + 1} · {status}
        </h3>
        <span className="rounded-full bg-paper px-2 py-0.5 text-sm font-black" title={testedAll ? "Plot health" : "Run all three soil tests to see this plot's health"}>
          ❤️ {testedAll ? Math.round(plotHealth(plot)) : "?"}
        </span>
      </div>
      {!crop && !plot.weedy && (
        winter ? (
          <p className="mb-3 rounded-xl bg-paper px-3 py-2 text-sm">❄️ Too cold to plant crops in winter. A cover crop can still protect this soil.</p>
        ) : (
          <button onClick={onOpenSeedBag} className="btn btn-primary mb-3 w-full">
            🌱 Open the seed bag
          </button>
        )
      )}
      {crop && (
        <p className="mb-3 rounded-xl bg-leaf-light px-3 py-2 text-xs">
          <strong>Takes:</strong> {crop.takes} <strong>Gives back:</strong> {crop.givesText}
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {METRICS.map((m) => {
          const info = METRIC_INFO[m];
          if (!isKnown(plot, m)) {
            return (
              <div key={m} title={`Run a ${info.test} to find out`}>
                <div className="flex justify-between text-xs font-bold">
                  <span>{info.label}</span>
                  <span className="text-muted">?</span>
                </div>
                <div className="mt-0.5 h-2 rounded-full bg-[repeating-linear-gradient(45deg,#e3d6c1_0_4px,#efe5d3_4px_8px)]" />
                <div className="mt-0.5 text-[10px] text-muted">Needs a {info.test}</div>
              </div>
            );
          }
          const v = metricValue(plot, m);
          const color = m === "ph" ? (Math.abs(plot.ph - 6.5) < 0.5 ? "#3f7d4e" : "#c48a1c") : info.color;
          return (
            <div key={m}>
              <div className="flex justify-between text-xs font-bold">
                <span>{info.label}</span>
                <span className="text-muted">{v.display}</span>
              </div>
              <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${v.pct}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold">
        {plot.weedy && <Tag warn>🌿 Overgrown with weeds</Tag>}
        {plot.noTill && plot.noTillSeasons > 0 && <Tag>🚫 No-till · {plot.noTillSeasons} season{plot.noTillSeasons === 1 ? "" : "s"}</Tag>}
        {plot.hedgerow && <Tag>🌳 Hedgerow</Tag>}
        {plot.biochar && <Tag>⚫ Biochar</Tag>}
        {plot.lastFamily && (
          <Tag warn={plot.familyStreak >= 1}>
            Last grown: {FAMILY_LABEL[plot.lastFamily]}
            {plot.familyStreak >= 1 ? ` (${plot.familyStreak + 1} seasons in a row)` : ""}
          </Tag>
        )}
        {plot.applied.filter((a) => a !== "weed").map((a) => (
          <Tag key={a}>
            {PRACTICES[a].icon} {PRACTICES[a].name}
          </Tag>
        ))}
      </div>
    </div>
  );
}

function Tag({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return <span className={`rounded-full px-2 py-0.5 ${warn ? "bg-danger/15 text-danger" : "bg-leaf-light text-leaf"}`}>{children}</span>;
}

function Section({
  title, game, selected, kinds, onPick,
}: {
  title: string; game: GameState; selected: number; kinds: Practice["kind"][]; onPick: (id: PracticeId) => void;
}) {
  const plot = game.plots[selected];
  return (
    <div>
      <h3 className="mb-2 font-black">{title}</h3>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
        {PRACTICE_ORDER.filter((id) => kinds.includes(PRACTICES[id].kind)).map((id) => {
          const p = PRACTICES[id];
          const reason = canApply(game, selected, id);
          const done =
            plot.applied.includes(id) ||
            (id === "labTest" && plot.known.lab) || (id === "shovelTest" && plot.known.shovel) || (id === "waterTest" && plot.known.water) ||
            (id === "weed" && !plot.weedy);
          return (
            <button
              key={id}
              onClick={() => onPick(id)}
              title={reason ?? p.short}
              className={`relative flex flex-col items-center rounded-xl border-2 p-2 text-center transition ${
                done ? "border-leaf bg-leaf-light" :
                reason ? "border-line bg-white opacity-55" :
                p.kind === "conventional" ? "border-line bg-white hover:border-danger" : "border-line bg-white hover:border-leaf"
              }`}
            >
              {p.organic === false && (
                <span className="absolute -right-1 -top-1 rounded-full bg-danger px-1.5 text-[9px] font-black text-white">Not organic</span>
              )}
              <span className="text-2xl">{p.icon}</span>
              <span className="text-[11px] font-black leading-tight">{p.name}</span>
              <span className="text-[11px] font-semibold text-muted">{done ? "✓ done" : p.cost ? `🪙 ${p.cost}` : "Free"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PreviewModal({
  game, plotId, practiceId, onConfirm, onCancel,
}: {
  game: GameState; plotId: number; practiceId: PracticeId; onConfirm: (id: PracticeId) => void; onCancel: () => void;
}) {
  const p = PRACTICES[practiceId];
  const plot = game.plots[plotId];
  const reason = canApply(game, plotId, practiceId);
  const preview = previewPractice(game, plotId, practiceId);

  return (
    <Modal onClose={onCancel}>
      <div className="text-xs font-bold uppercase tracking-wider text-muted">Preview · Plot {plotId + 1}</div>
      <h2 className="mt-1 flex items-center gap-2 text-2xl font-black">
        <span className="text-4xl">{p.icon}</span> {p.name}
      </h2>
      <p className="mt-2 text-sm">{p.science}</p>

      {preview.reveals.length > 0 ? (
        <div className="mt-4 rounded-xl bg-sky/10 p-3">
          <div className="text-sm font-black">🔍 This test will reveal</div>
          <ul className="mt-1 flex flex-wrap gap-1.5">
            {preview.reveals.map((m) => (
              <li key={m} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold">{METRIC_INFO[m].label}</li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="mt-4">
          <PreviewEffects game={game} plot={plot} preview={preview} />
        </div>
      )}
      {preview.reveals.length > 0 && preview.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {preview.notes.map((n) => <li key={n} className="rounded-lg bg-paper px-3 py-1.5">• {n}</li>)}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Predictions assume the forecast ({EVENTS[game.forecast].name.toLowerCase()}) comes true.</p>

      <div className="mt-4 flex items-center gap-2">
        <button onClick={onCancel} className="btn btn-ghost flex-1">Cancel</button>
        <button onClick={() => onConfirm(practiceId)} disabled={!!reason} className="btn btn-primary flex-[2]">
          {reason ?? `${p.kind === "test" ? "Run test on" : "Apply to"} Plot ${plotId + 1}${p.cost ? ` · 🪙 ${p.cost}` : ""}`}
        </button>
      </div>
    </Modal>
  );
}

function ReportModal({ report, onClose }: { report: SeasonReport; onClose: () => void }) {
  const ev = EVENTS[report.event];
  const delta = Math.round((report.healthAfter - report.healthBefore) * 10) / 10;
  return (
    <Modal>
      <div className="text-xs font-bold uppercase tracking-wider text-muted">
        Season {report.season} report · {report.seasonName}
      </div>
      <h2 className="mt-1 flex items-center gap-2 text-2xl font-black">
        <span className="text-4xl">{ev.icon}</span> {ev.name}
      </h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-paper p-3 text-center">
          <div className="text-xs font-bold text-muted">Harvest</div>
          <div className="text-2xl font-black">
            {report.seasonName === "Winter" ? "None" : `+${report.harvest + report.grazingIncome} 🪙`}
          </div>
        </div>
        <div className="rounded-xl bg-paper p-3 text-center">
          <div className="text-xs font-bold text-muted">Soil health</div>
          <div className={`text-2xl font-black ${delta >= 0 ? "text-leaf" : "text-danger"}`}>
            {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}
          </div>
        </div>
      </div>
      <h3 className="mt-5 font-black">🔍 Why did that happen?</h3>
      <ul className="mt-2 space-y-2">
        {report.insights.map((i) => (
          <li key={i} className="rounded-xl border-l-4 border-sun bg-sun/10 p-3 text-sm">
            {i}
          </li>
        ))}
      </ul>
      <button onClick={onClose} className="btn btn-primary mt-5 w-full">
        On to the next season →
      </button>
    </Modal>
  );
}

function EndModal({ game, onRestart }: { game: GameState; onRestart: () => void }) {
  const stars = starsFor(game);
  const health = fieldHealth(game.plots);
  const start = game.history[0]?.healthBefore ?? health;
  return (
    <Modal>
      <div className="text-center">
        <div className="text-6xl">{game.status === "won" ? "🏆" : "🌱"}</div>
        <h2 className="mt-2 text-3xl font-black">{game.status === "won" ? "Garden restored!" : "The soil needs more time"}</h2>
        <div className="mt-2 text-4xl">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < stars ? "" : "opacity-20 grayscale"}>
              ⭐
            </span>
          ))}
        </div>
        <p className="mt-3 text-muted">
          You took the garden from a Soil Health Index of <strong>{start}</strong> to <strong>{health}</strong> and finished with{" "}
          <strong>{game.coins} coins</strong>{game.organic ? ", still certified organic" : ""}.
        </p>
        <p className="mt-2 text-sm text-muted">
          {game.status === "won"
            ? stars < 3
              ? "For 3 stars, reach 80 or more and finish with at least 100 coins."
              : "Amazing. You're a true soil steward!"
            : `Reach ${WIN_HEALTH} to restore the garden. Try keeping every plot covered and going no-till early.`}
        </p>
        <button onClick={onRestart} className="btn btn-primary mt-5">
          Play again
        </button>
      </div>
    </Modal>
  );
}

function IntroModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal>
      <div className="text-center text-5xl">🎉🌻</div>
      <h2 className="mt-2 text-center text-2xl font-black">Congratulations! You inherited an organic garden!</h2>
      <p className="mt-3">
        A relative left you their old organic garden. Nobody has looked after it in a long time. It&apos;s <strong>overgrown with weeds</strong>,
        and you have <strong>no idea what the soil is like</strong> in any of its 9 plots.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
        <li><strong>Pull the weeds.</strong> You can&apos;t plant or improve a plot until it&apos;s weeded.</li>
        <li><strong>Test the soil.</strong> A 🪱 shovel test, a 💧 infiltration test, and a 🧪 lab test each reveal different things about a plot.</li>
        <li><strong>Plant seeds.</strong> Weeded plots are empty. Open the 🌱 seed bag to choose a crop. Each packet tells you what the crop takes from the soil and what it gives back. Crops are harvested at the end of each season, so plan your rotation!</li>
        <li><strong>Pick practices.</strong> Take as many actions as you can afford. Tap one first to see exactly what it will do to that plot, then confirm.</li>
        <li><strong>Watch the forecast</strong> and <strong>end the season</strong> to harvest and see how your soil changed.</li>
      </ol>
      <p className="mt-4 rounded-xl bg-leaf-light p-3 text-sm">
        🎯 <strong>Goal:</strong> raise the Soil Health Index to <strong>{WIN_HEALTH}</strong> within 3 years (12 seasons).
        Stay <strong>certified organic</strong> and your harvests sell for {Math.round((ORGANIC_BONUS - 1) * 100)}% more.
      </p>
      <button onClick={onClose} className="btn btn-primary mt-5 w-full">
        Let&apos;s get gardening!
      </button>
    </Modal>
  );
}
