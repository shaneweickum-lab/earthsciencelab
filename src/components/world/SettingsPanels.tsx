"use client";

import { cropDays } from "@/world/items";
import { daysPerSeason, seasonStartDay } from "@/world/clock";
import {
  MONTH_MAX, MONTH_MIN, PRESETS, presetOf, SCIENCE_FEATURES, SPEED_MAX, SPEED_MIN, SPEED_PRESETS, speedLabel,
  type FeatureCategory, type FeatureId, type GameSettings, type PresetId,
} from "@/world/settings";

const CATEGORIES: FeatureCategory[] = ["Soil", "Water", "Plants", "Weeds & pests", "Climate", "Daily life"];

/** Switch each science feature on or off, or pick a preset. */
export function SciencePanel({ science, onChange }: {
  science: GameSettings["science"]; onChange: (science: GameSettings["science"]) => void;
}) {
  const preset = presetOf(science);
  const count = Object.values(science).filter(Boolean).length;
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Science presets">
        {(Object.keys(PRESETS) as PresetId[]).map((id) => (
          <button
            key={id}
            role="radio"
            aria-checked={preset === id}
            onClick={() => onChange({ ...PRESETS[id].science })}
            className={`rounded-xl border-2 p-2.5 text-left transition ${preset === id ? "border-leaf bg-leaf-light" : "border-line bg-card hover:border-leaf/50"}`}
          >
            <span className="font-black">{PRESETS[id].icon} {PRESETS[id].label}</span>
            <span className="mt-0.5 block text-xs text-muted">{PRESETS[id].desc}</span>
          </button>
        ))}
      </div>
      <p className="text-xs font-bold text-muted">
        {preset === "custom" ? "Custom mix" : PRESETS[preset].label} · {count} of {SCIENCE_FEATURES.length} science features on
      </p>
      {CATEGORIES.map((cat) => (
        <fieldset key={cat}>
          <legend className="mb-1 text-xs font-black uppercase tracking-wider text-muted">{cat}</legend>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {SCIENCE_FEATURES.filter((f) => f.category === cat).map((f) => {
              const value = science[f.id as FeatureId];
              return (
                <label
                  key={f.id}
                  className={`flex cursor-pointer gap-2.5 rounded-xl border p-2.5 transition ${value ? "border-leaf/60 bg-leaf-light/60" : "border-line bg-card"}`}
                >
                  <input
                    type="checkbox"
                    role="switch"
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-leaf)]"
                    checked={value}
                    onChange={(e) => onChange({ ...science, [f.id]: e.target.checked })}
                    aria-label={f.label}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-black">{f.icon} {f.label}</span>
                    <span className="block text-xs">{value ? f.on : f.off}</span>
                    <span className="mt-0.5 block text-[11px] italic text-muted">{f.science}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}

/** How fast game time runs, and which temperature units to show. */
export function TimePanel({ settings, onChange }: { settings: GameSettings; onChange: (patch: Partial<GameSettings>) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="flex items-center justify-between text-sm font-black" htmlFor="speed">
          <span>⏱️ Time speed</span>
          <span className="tabular-nums">{settings.speed}×</span>
        </label>
        <input
          id="speed"
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          value={settings.speed}
          onChange={(e) => onChange({ speed: Number(e.target.value) })}
          className="mt-1 w-full accent-[var(--color-leaf)]"
          aria-label="Time speed"
        />
        <div className="mt-1 flex flex-wrap gap-1">
          {SPEED_PRESETS.map((v) => (
            <button key={v} onClick={() => onChange({ speed: v })} className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${settings.speed === v ? "bg-soil text-white" : "bg-paper hover:bg-line"}`}>
              {v}×
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">{speedLabel(settings.speed)}. A farm day runs 6 AM to 2 AM, so it lasts {dayLength(settings.speed)}.</p>
      </div>
      <div className="flex items-center gap-2 text-sm font-black">
        🌡️ Temperature
        {(["F", "C"] as const).map((u) => (
          <button key={u} onClick={() => onChange({ units: u })} className={`rounded-full px-3 py-0.5 text-xs font-bold ${settings.units === u ? "bg-soil text-white" : "bg-paper hover:bg-line"}`}>
            °{u}
          </button>
        ))}
      </div>
    </div>
  );
}

function dayLength(speed: number) {
  const minutes = (20 * 60) / speed;
  return minutes >= 60 ? `${(minutes / 60).toFixed(minutes % 60 ? 1 : 0)} real hours` : `${Math.round(minutes)} real minutes`;
}

/** Seasons and month length. Chosen when a farm is created. */
export function CalendarPanel({ settings, onChange, locked = false }: {
  settings: GameSettings; onChange?: (patch: Partial<GameSettings>) => void; locked?: boolean;
}) {
  const L = settings.daysPerMonth;
  return (
    <div className="space-y-3">
      <label className={`flex items-center gap-2 text-sm font-black ${locked ? "" : "cursor-pointer"}`}>
        <input
          type="checkbox"
          role="switch"
          disabled={locked}
          checked={settings.seasons}
          onChange={(e) => onChange?.({ seasons: e.target.checked })}
          className="h-4 w-4 accent-[var(--color-leaf)]"
          aria-label="Seasons"
        />
        🍂 Seasons
        <span className="text-xs font-normal text-muted">
          {settings.seasons ? "Spring, summer, fall, and winter, with cold, snow, and frost." : "An endless mild growing season (about 60–80°F), no frost or snow."}
        </span>
      </label>
      <div>
        <label className="flex items-center justify-between text-sm font-black" htmlFor="month">
          <span>📅 Days per month</span>
          <span className="tabular-nums">{L}</span>
        </label>
        <input
          id="month"
          type="range"
          min={MONTH_MIN}
          max={MONTH_MAX}
          disabled={locked}
          value={L}
          onChange={(e) => onChange?.({ daysPerMonth: Number(e.target.value) })}
          className="mt-1 w-full accent-[var(--color-leaf)]"
          aria-label="Days per month"
        />
        <p className="mt-1 text-xs text-muted">
          12 months a year{settings.seasons ? `, so each season lasts ${daysPerSeason(settings)} days. Seasons begin on the ${ordinal(seasonStartDay(L))} of March, June, September, and December` : ""}.
          {" "}Crops scale to fit: carrots take about {cropDays("carrot", L)} days, squash about {cropDays("squash", L)} (real seed packets: 70 and 100 days).
        </p>
        {locked && <p className="mt-1 text-xs font-bold text-muted">The calendar is set when a farm is created.</p>}
      </div>
    </div>
  );
}

function ordinal(n: number) {
  const s = n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th";
  return `${n}${s}`;
}
