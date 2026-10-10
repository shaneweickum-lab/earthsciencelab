"use client";

import { isKnown, seasonName, type GameState, type Metric, type Plot, type Preview } from "@/game/engine";

export const METRIC_INFO: Record<Metric, { label: string; color: string; test: string }> = {
  om: { label: "Organic matter", color: "#3d2716", test: "🧪 lab soil test" },
  life: { label: "Soil life", color: "#d98c8c", test: "🪱 shovel test" },
  structure: { label: "Structure", color: "#9a5733", test: "🪱 shovel test" },
  water: { label: "Water holding", color: "#3f86b0", test: "💧 infiltration test" },
  nutrients: { label: "Nutrients (N-P-K)", color: "#e0a83a", test: "🧪 lab soil test" },
  ph: { label: "pH", color: "#3f7d4e", test: "🧪 lab soil test" },
};
export const METRICS = Object.keys(METRIC_INFO) as Metric[];

export function formatDelta(m: Metric, d: number): string {
  const sign = d > 0 ? "+" : "";
  if (m === "om") return `${sign}${(d * 0.08).toFixed(1)}%`;
  if (m === "ph") return `${sign}${d.toFixed(1)}`;
  return `${sign}${Math.round(d)}`;
}

/** The predicted soil changes, harvest change, and notes for one action on one plot. */
export function PreviewEffects({ game, plot, preview }: { game: GameState; plot: Plot; preview: Preview }) {
  const winter = seasonName(game.season) === "Winter";
  const changes = METRICS.filter((m) => Math.abs(preview.deltas[m]) >= (m === "ph" ? 0.05 : 0.5));
  return (
    <>
      <div className="text-sm font-black">What it will do to this plot by the end of the {seasonName(game.season).toLowerCase()}</div>
      {changes.length === 0 ? (
        <p className="mt-1 text-sm text-muted">No big change to the soil numbers this season.</p>
      ) : (
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {changes.map((m) => {
            const d = preview.deltas[m];
            // pH moving toward 6.5 is good, everything else is good when it goes up.
            const good = m === "ph" ? Math.abs(plot.ph + d - 6.5) < Math.abs(plot.ph - 6.5) : d > 0;
            return (
              <li key={m} className={`rounded-xl px-3 py-2 text-sm font-bold ${good ? "bg-leaf-light text-leaf" : "bg-danger/10 text-danger"}`}>
                {d > 0 ? "▲" : "▼"} {METRIC_INFO[m].label}
                <span className="ml-1 font-black">{isKnown(plot, m) ? formatDelta(m, d) : ""}</span>
              </li>
            );
          })}
        </ul>
      )}
      {changes.some((m) => !isKnown(plot, m)) && (
        <p className="mt-1 text-xs text-muted">Run soil tests on this plot to see exact numbers.</p>
      )}
      {!winter && preview.harvestDelta !== 0 && (
        <p className={`mt-2 text-sm font-bold ${preview.harvestDelta > 0 ? "text-leaf" : "text-danger"}`}>
          {preview.harvestDelta > 0 ? "▲" : "▼"} Harvest from this plot: {preview.harvestDelta > 0 ? "+" : ""}
          {preview.harvestDelta} 🪙 this season
        </p>
      )}
      {preview.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {preview.notes.map((n) => {
            const warn = /not organic|⚠️/i.test(n);
            return (
              <li key={n} className={`rounded-lg px-3 py-1.5 ${warn ? "bg-danger/10 font-bold text-danger" : "bg-paper"}`}>
                {warn ? (n.startsWith("⚠️") ? "" : "⚠️ ") : "• "}
                {n}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function Modal({ children, onClose, wide }: { children: React.ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`card animate-pop-in max-h-[90vh] w-full overflow-y-auto p-6 ${wide ? "max-w-3xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
