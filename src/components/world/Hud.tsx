"use client";

import { CROPS } from "@/game/crops";
import { dayOf, formatDate, formatTime, seasonLabel, seasonOf, timeOfDay, yearOf } from "@/world/clock";
import { buildingAt, facingTile, growthFactor, HOTBAR_SIZE, knownSoil, pickUpBuilding, soilHealth, tileAt, todayClimate } from "@/world/engine";
import { cropDays, ITEMS, WORLD_CROPS } from "@/world/items";
import { formatTemp, on } from "@/world/settings";
import { expectedGrade } from "@/world/grades";
import { previewAction } from "@/world/preview";
import { NPC_BY_ID } from "@/world/town";
import { TOWN_KINDS, type Tile, type WorldState } from "@/world/types";
import { tempAt, WEATHER } from "@/world/weather";
import { GradeBadge, ItemIcon } from "./ItemIcon";
import { useWorld } from "./useWorld";

const SEASON_ICON = { Spring: "🌸", Summer: "☀️", Fall: "🍂", Winter: "❄️" };

export function StatusBar() {
  const w = useWorld((s) => s.world!);
  const d = dayOf(w.minute);
  const cal = w.settings;
  const climate = todayClimate(w);
  const weather = WEATHER[climate.kind];
  const units = w.settings.units;
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1.5">
      <div className="rounded-2xl border-2 border-soil-dark/20 bg-card/95 px-3 py-2 text-right shadow-lg">
        <div className="text-xs font-black uppercase tracking-wider text-muted">
          {cal.seasons ? SEASON_ICON[seasonOf(d, cal)] : "🌱"} {seasonLabel(d, cal)} · {formatDate(d, cal, true)} · Year {yearOf(d, cal)}
        </div>
        <div className="flex items-center justify-end gap-2 font-display text-xl font-black tabular-nums">
          <span title={weather.name} aria-label={`Weather: ${weather.name}`}>{weather.icon}</span>
          <span aria-label="Temperature" title={`High ${formatTemp(climate.high, units)}, low ${formatTemp(climate.low, units)}`}>
            {formatTemp(tempAt(climate, timeOfDay(w.minute)), units)}
          </span>
          <span aria-label="Time">{formatTime(w.minute)}</span>
        </div>
        <div className="text-[11px] font-bold text-muted">
          High {formatTemp(climate.high, units)} · Low {formatTemp(climate.low, units)}
        </div>
      </div>
      <div className="flex gap-1.5">
        <div className="rounded-full bg-card/95 px-3 py-1 text-sm font-black shadow" aria-label="Coins">🪙 {w.coins.toLocaleString()}</div>
        {w.organic && <div className="rounded-full bg-leaf px-2.5 py-1 text-xs font-black text-white shadow" title="Certified organic: produce sells for 25% more">🌿 Organic</div>}
      </div>
      {on(w, "energy") && <Meter label="Energy" icon="⚡" value={w.energy} max={w.maxEnergy} color={w.energy < 20 ? "bg-danger" : "bg-sun"} />}
      <Meter label="Watering can" icon="💧" value={w.water} max={w.canSize} color="bg-sky" />
    </div>
  );
}

function Meter({ label, icon, value, max, color }: { label: string; icon: string; value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-card/95 px-2 py-1 shadow" title={`${label}: ${Math.round(value)}/${max}`}>
      <span className="text-xs" aria-hidden>{icon}</span>
      <div className="h-2 w-24 overflow-hidden rounded-full bg-line" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
        <div className={`h-full ${color} transition-all`} style={{ width: `${(value / max) * 100}%` }} />
      </div>
    </div>
  );
}

export function Hotbar() {
  const inv = useWorld((s) => s.world!.inventory);
  const selected = useWorld((s) => s.world!.selected);
  const update = useWorld((s) => s.update);
  const sel = inv[selected];
  return (
    <div className="pointer-events-auto flex flex-col items-center gap-1">
      <div className="rounded-full bg-soil-dark/80 px-3 py-0.5 text-xs font-bold text-white">
        {sel ? ITEMS[sel.item].name : "Empty hands"}
      </div>
      <div className="flex gap-0.5 rounded-2xl bg-soil-dark/70 p-1 shadow-xl sm:gap-1 sm:p-1.5" role="toolbar" aria-label="Hotbar">
        {inv.slice(0, HOTBAR_SIZE).map((s, i) => (
          <button
            key={i}
            tabIndex={-1}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => update((w) => ({ ...w, selected: i }))}
            aria-label={`Slot ${(i + 1) % 10}: ${s ? ITEMS[s.item].name : "empty"}`}
            aria-pressed={i === selected}
            title={s ? `${ITEMS[s.item].name}: ${ITEMS[s.item].desc}` : "Empty"}
            className={`relative grid h-[30px] w-[30px] place-items-center rounded-lg text-lg transition sm:h-12 sm:w-12 sm:rounded-xl sm:text-2xl ${
              i === selected ? "bg-sun ring-2 ring-white" : "bg-card/90 hover:bg-white"
            }`}
          >
            {s && <ItemIcon id={s.item} grade={s.grade} />}
            <span className="absolute left-1 top-0 text-[10px] font-black text-muted">{(i + 1) % 10}</span>
            {s && s.qty > 1 && <span className="absolute bottom-0 right-1 text-[11px] font-black text-ink">{s.qty}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Messages() {
  const messages = useWorld((s) => s.world!.messages);
  const minute = useWorld((s) => s.world!.minute);
  const recent = messages.filter((m) => m.at >= minute - 45).slice(-4);
  return (
    <div className="flex max-w-[45vw] flex-col gap-1 sm:max-w-xs" aria-live="polite">
      {recent.map((m, i) => (
        <div key={`${m.at}-${i}-${m.text}`} className="rounded-xl bg-soil-dark/80 px-2 py-1 text-xs font-semibold text-white shadow sm:px-3 sm:py-1.5 sm:text-sm">
          {m.text}
        </div>
      ))}
    </div>
  );
}

const GROUND_NAME: Record<Tile["ground"], string> = {
  grass: "Grass", farm: "Garden soil", path: "Path", water: "Pond", sand: "Sandy shore", forest: "Forest",
};

function SoilRow({ label, value, known, unit = "", tip }: { label: string; value: number; known: boolean; unit?: string; tip: string }) {
  const color = value >= 60 ? "bg-leaf" : value >= 35 ? "bg-sun" : "bg-danger";
  return (
    <div className="flex items-center gap-2 text-xs" title={tip}>
      <span className="w-24 shrink-0 font-semibold text-muted">{label}</span>
      {known ? (
        unit === "pH" ? (
          <span className="font-black">{value.toFixed(1)}</span>
        ) : (
          <>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"><div className={`h-full ${color}`} style={{ width: `${value}%` }} /></div>
            <span className="w-6 text-right font-black tabular-nums">{Math.round(value)}</span>
          </>
        )
      ) : (
        <span className="flex-1 font-bold text-muted">? <span className="font-normal">{tip}</span></span>
      )}
    </div>
  );
}

/** What's in front of you, its hidden soil (until tested), and what your next action will do. */
export function TileInspector() {
  const w = useWorld((s) => s.world!);
  const update = useWorld((s) => s.update);
  const { x, y } = facingTile(w);
  const t = tileAt(w, x, y);
  if (!t) return null;
  const b = buildingAt(w, x, y);
  const preview = previewAction(w);
  const garden = t.ground === "farm" || t.greenhouse;
  const known = knownSoil(w, t);
  const critter = w.critters.find((c) => c.x === x && c.y === y);
  const pickable = b && !TOWN_KINDS.includes(b.kind) && !b.data.owner;
  return (
    <div className="pointer-events-auto w-64 space-y-2 rounded-2xl border-2 border-soil-dark/20 bg-card/95 p-3 shadow-lg" aria-label="Tile inspector">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display font-black">{b ? b.data.sign ?? (b.data.owner ? `${NPC_BY_ID[b.data.owner]?.short ?? ""}'s ` : "") + (ITEMS[`kit_${b.kind}`]?.name ?? labelFor(b.kind)) : t.greenhouse ? "Greenhouse bed" : GROUND_NAME[t.ground]}</h3>
        {garden && t.tilled && <span className="text-[10px] font-black uppercase text-soil">Tilled</span>}
      </div>
      <Status w={w} t={t} x={x} y={y} critter={!!critter} />
      {garden && !b && (
        <div className="space-y-1 border-t border-line pt-2">
          <SoilRow label="Moisture" value={t.moisture} known tip="" />
          <SoilRow label="Organic matter" value={t.soil.om} known={known.lab} tip="Lab test 🧪" />
          <SoilRow label="Nutrients" value={t.soil.nutrients} known={known.lab} tip="Lab test 🧪" />
          <SoilRow label="pH" value={t.soil.ph} known={known.lab} unit="pH" tip="Lab test 🧪" />
          <SoilRow label="Soil life" value={t.soil.life} known={known.shovel} tip="Shovel test 🕳️" />
          <SoilRow label="Structure" value={t.soil.structure} known={known.shovel} tip="Shovel test 🕳️" />
          <SoilRow label="Water holding" value={t.soil.water} known={known.water} tip="Ring test 💧" />
          {known.lab && known.shovel && known.water && (
            <div className="text-xs font-black">Soil health: {soilHealth(t)}</div>
          )}
        </div>
      )}
      {preview.label && (
        <div className={`rounded-xl px-2.5 py-1.5 text-xs ${preview.ok ? "bg-leaf-light" : "bg-paper"}`}>
          <span className="font-black">
            <kbd className="mr-1 rounded bg-white px-1 font-mono text-[10px] shadow-sm">Space</kbd>
            {preview.label}:
          </span>{" "}
          {preview.text}
        </div>
      )}
      {pickable && (
        <button className="btn btn-ghost w-full py-1 text-xs" onClick={() => update((s) => pickUpBuilding(s, b.id))}>
          Pick up <kbd className="rounded bg-white px-1 font-mono text-[10px] shadow-sm">P</kbd>
        </button>
      )}
    </div>
  );
}

function labelFor(kind: string) {
  return {
    house: "Farmhouse", store: "Seed & Soil Co.", shippingBin: "Shipping Bin", chest: "Tool Chest", extension: "Extension Office", cottage: "Cottage",
    fountain: "Fountain", noticeBoard: "Notice board", field: "Cornfield", lamp: "Street lamp", prop: "Market cart",
  }[kind] ?? kind;
}

function Status({ w, t, x, y, critter }: { w: WorldState; t: Tile; x: number; y: number; critter: boolean }) {
  const lines: string[] = [];
  if (critter) lines.push("Something is here! Press Space to take a closer look.");
  if (t.obstacle) lines.push(`A ${t.obstacle} is in the way.`);
  if (t.weeds) lines.push("Weeds are growing here.");
  if (t.mulch) lines.push("Covered with straw mulch.");
  if ((t.boost ?? 0) > 0 && !t.crop) lines.push(`🏅 Amendments: grade bonus +${t.boost} for the next crop here.`);
  const c = t.crop;
  if (c) {
    const crop = CROPS[c.id];
    if (c.dead) return <p className="text-xs">💀 This {crop.name.toLowerCase()} plant died. Clear it with the scythe or your hands.</p>;
    const { reasons } = growthFactor(w, x, y);
    const wc = WORLD_CROPS[c.id];
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span aria-hidden>{crop.icon}</span>
          {crop.name}
          <span className="ml-auto text-xs text-muted">{c.growth >= 1 ? "Ready!" : `${Math.round(c.growth * 100)}%`}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full bg-leaf" style={{ width: `${c.growth * 100}%` }} /></div>
        <p className="text-[11px] text-muted">
          {wc.type === "cool" ? "Cool" : "Warm"}-season · about {cropDays(c.id, w.settings.daysPerMonth, c.harvests > 0)} days to grow
        </p>
        {!c.dead && wc.yield[1] > 0 && <GradeLine w={w} t={t} />}
        {c.growth < 1 && reasons.map((r) => <p key={r} className="text-xs">• {r}</p>)}
        {lines.map((l) => <p key={l} className="text-xs">{l}</p>)}
      </div>
    );
  }
  if (!lines.length) return null;
  return <div className="space-y-0.5">{lines.map((l) => <p key={l} className="text-xs">{l}</p>)}</div>;
}

/** The grade this crop would get if harvested now, and why. */
function GradeLine({ w, t }: { w: WorldState; t: Tile }) {
  const est = expectedGrade(w, t);
  const known = knownSoil(w, t);
  const tested = known.lab && known.shovel && known.water;
  const parts = est.parts.map((p) => (p.startsWith("Soil health") && !tested ? "Soil health: run all three soil tests to see it" : p));
  return (
    <div className="flex items-start gap-2 rounded-lg bg-paper px-2 py-1 text-xs">
      <GradeBadge grade={est.grade} className="mt-0.5 shrink-0" />
      <span>
        <b>Expected grade {est.grade}</b>
        <span className="block text-[11px] text-muted">{parts.join(" · ")}</span>
      </span>
    </div>
  );
}
