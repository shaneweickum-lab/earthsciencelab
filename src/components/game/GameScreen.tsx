"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  advanceSeason, applyPractice, canApply, CROPS, EVENTS, fieldHealth, newGame, organicMatterPercent,
  plotHealth, seasonName, starsFor, TOTAL_SEASONS, WIN_HEALTH, type GameState, type SeasonReport,
} from "@/game/engine";
import { PRACTICE_ORDER, PRACTICES, type PracticeId } from "@/game/practices";
import { useProgress } from "@/store/progress";

const FieldBoard3D = dynamic(() => import("./FieldBoard3D"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-muted">Preparing the field…</div>,
});

const SAVE_KEY = "earthsciencelab-field-game";

function loadSaved(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? (JSON.parse(raw) as GameState) : null;
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
  const [selected, setSelected] = useState<number | null>(0);
  const [report, setReport] = useState<SeasonReport | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [inspect, setInspect] = useState<PracticeId | null>(null);
  const [showIntro, setShowIntro] = useState(false);
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

  if (!game) return <div className="card grid h-96 place-items-center text-muted">Loading farm…</div>;

  const season = seasonName(game.season);
  const year = Math.ceil(game.season / 4);
  const health = fieldHealth(game.plots);
  const plot = selected !== null ? game.plots[selected] : null;
  const over = game.status !== "playing";

  function act(id: PracticeId) {
    if (!game || selected === null) {
      setToast("Tap a plot first.");
      return;
    }
    const r = applyPractice(game, selected, id);
    if (!r.ok) setToast(r.reason);
    else setGame(r.state);
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
  }

  const forecast = EVENTS[game.forecast];

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <Stat label={`Year ${year}`} value={`${season === "Winter" ? "❄️" : season === "Summer" ? "☀️" : season === "Fall" ? "🍁" : "🌷"} ${season}`} />
        <Stat label="Season" value={`${game.season} / ${TOTAL_SEASONS}`} />
        <Stat label="Coins" value={`🪙 ${game.coins}`} />
        <Stat label="Actions left" value={`⚡ ${game.ap} / ${game.maxAp}`} />
        <div className="min-w-48 flex-1">
          <div className="flex justify-between text-xs font-bold text-muted">
            <span>Soil Health Index</span>
            <span>Goal {WIN_HEALTH}</span>
          </div>
          <div className="relative mt-1 h-4 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${health}%`, background: health >= WIN_HEALTH ? "#3f7d4e" : health >= 45 ? "#c48a1c" : "#b8432f" }}
            />
            <div className="absolute inset-y-0 w-0.5 bg-ink" style={{ left: `${WIN_HEALTH}%` }} />
          </div>
          <div className="mt-0.5 text-right text-sm font-black">{health}</div>
        </div>
      </div>

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
          {plot && <PlotPanel plot={plot} />}
          <div className="card p-4">
            <h3 className="mb-2 font-black">🌿 Regenerative practices</h3>
            <PracticeGrid game={game} selected={selected} kind="regenerative" onAct={act} onInspect={setInspect} />
            <h3 className="mb-2 mt-4 font-black">🏭 Conventional shortcuts</h3>
            <PracticeGrid game={game} selected={selected} kind="conventional" onAct={act} onInspect={setInspect} />
            <div className="mt-3 min-h-16 rounded-xl bg-paper p-3 text-sm">
              {inspect ? (
                <>
                  <strong>
                    {PRACTICES[inspect].icon} {PRACTICES[inspect].name}
                  </strong>{" "}
                  · {PRACTICES[inspect].cost} coins
                  <p className="mt-1 text-muted">{PRACTICES[inspect].science}</p>
                </>
              ) : (
                <span className="text-muted">Hover or long-press a practice to see what it does to the soil.</span>
              )}
            </div>
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

function Meter({ label, value, display, color }: { label: string; value: number; display?: string; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs font-bold">
        <span>{label}</span>
        <span className="text-muted">{display ?? Math.round(value)}</span>
      </div>
      <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function PlotPanel({ plot }: { plot: GameState["plots"][number] }) {
  const crop = CROPS[plot.crop];
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-black">
          Plot {plot.id + 1} · {crop.icon} {crop.name}
        </h3>
        <span className="rounded-full bg-paper px-2 py-0.5 text-sm font-black">❤️ {Math.round(plotHealth(plot))}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Meter label="Organic matter" value={plot.om} display={`${organicMatterPercent(plot.om)}%`} color="#3d2716" />
        <Meter label="Soil life" value={plot.life} color="#d98c8c" />
        <Meter label="Structure" value={plot.structure} color="#9a5733" />
        <Meter label="Water holding" value={plot.water} color="#3f86b0" />
        <Meter label="Nutrients (N-P-K)" value={plot.nutrients} color="#e0a83a" />
        <Meter label="pH" value={((plot.ph - 4.5) / 3.5) * 100} display={plot.ph.toFixed(1)} color={Math.abs(plot.ph - 6.5) < 0.5 ? "#3f7d4e" : "#c48a1c"} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold">
        {plot.noTill && plot.noTillSeasons > 0 && <Tag>🚫 No-till · {plot.noTillSeasons} season{plot.noTillSeasons === 1 ? "" : "s"}</Tag>}
        {plot.hedgerow && <Tag>🌳 Hedgerow</Tag>}
        {plot.biochar && <Tag>⚫ Biochar</Tag>}
        {plot.seasonsSameCrop >= 2 && <Tag warn>⚠️ Same crop {plot.seasonsSameCrop + 1} seasons</Tag>}
        {plot.applied.map((a) => (
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

function PracticeGrid({
  game, selected, kind, onAct, onInspect,
}: {
  game: GameState; selected: number | null; kind: "regenerative" | "conventional";
  onAct: (id: PracticeId) => void; onInspect: (id: PracticeId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PRACTICE_ORDER.filter((id) => PRACTICES[id].kind === kind).map((id) => {
        const p = PRACTICES[id];
        const reason = selected === null ? "Pick a plot" : canApply(game, selected, id);
        const done = selected !== null && game.plots[selected].applied.includes(id);
        return (
          <button
            key={id}
            onClick={() => onAct(id)}
            onMouseEnter={() => onInspect(id)}
            onFocus={() => onInspect(id)}
            onContextMenu={(e) => { e.preventDefault(); onInspect(id); }}
            title={reason ?? p.short}
            className={`flex flex-col items-center rounded-xl border-2 p-2 text-center transition ${
              done ? "border-leaf bg-leaf-light" :
              reason ? "border-line bg-white opacity-50" :
              kind === "regenerative" ? "border-line bg-white hover:border-leaf" : "border-line bg-white hover:border-danger"
            }`}
          >
            <span className="text-2xl">{p.icon}</span>
            <span className="text-[11px] font-black leading-tight">{p.name}</span>
            <span className="text-[11px] font-semibold text-muted">{done ? "✓ done" : `🪙 ${p.cost}`}</span>
          </button>
        );
      })}
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="card animate-pop-in max-h-[90vh] w-full max-w-lg overflow-y-auto p-6">{children}</div>
    </div>
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
        <h2 className="mt-2 text-3xl font-black">{game.status === "won" ? "Field restored!" : "The soil needs more time"}</h2>
        <div className="mt-2 text-4xl">
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < stars ? "" : "opacity-20 grayscale"}>
              ⭐
            </span>
          ))}
        </div>
        <p className="mt-3 text-muted">
          You took the field from a Soil Health Index of <strong>{start}</strong> to <strong>{health}</strong> and finished with{" "}
          <strong>{game.coins} coins</strong>.
        </p>
        <p className="mt-2 text-sm text-muted">
          {game.status === "won"
            ? stars < 3
              ? "For 3 stars, reach 80 or more and finish with at least 100 coins."
              : "Amazing. You're a true soil steward!"
            : `Reach ${WIN_HEALTH} to restore the field. Try keeping every plot covered and going no-till early.`}
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
      <h2 className="text-2xl font-black">🚜 Regenerate the Field</h2>
      <p className="mt-2">
        You&apos;ve inherited a farm whose soil has been plowed and left bare for years. It&apos;s pale, hard, and nearly lifeless.
        You have <strong>3 years (12 seasons)</strong> to bring it back.
      </p>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm">
        <li><strong>Tap a plot</strong> to see its soil: organic matter, life, structure, water, nutrients, and pH.</li>
        <li><strong>Choose practices.</strong> Each costs coins and one action. Hover a practice to learn what it does.</li>
        <li><strong>Check the forecast.</strong> Storms wash away bare soil. Droughts punish soil that can&apos;t hold water.</li>
        <li><strong>End the season</strong> to harvest crops, earn coins, and see how your soil changed.</li>
      </ol>
      <p className="mt-4 rounded-xl bg-leaf-light p-3 text-sm">
        🎯 <strong>Goal:</strong> raise the Soil Health Index to <strong>{WIN_HEALTH}</strong> by the end of year 3. Shortcuts like plowing and synthetic fertilizer boost
        harvests now, but watch what they do to your soil later…
      </p>
      <button onClick={onClose} className="btn btn-primary mt-5 w-full">
        Let&apos;s farm!
      </button>
    </Modal>
  );
}
