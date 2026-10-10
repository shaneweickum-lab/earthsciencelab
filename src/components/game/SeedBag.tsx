"use client";

import { useState } from "react";
import { CROP_ORDER, CROPS, FAMILY_LABEL, type CropId } from "@/game/crops";
import { canPlant, EVENTS, previewAction, type GameState } from "@/game/engine";
import { Modal, PreviewEffects } from "./previewParts";

function stars(value: number) {
  const n = value >= 1.4 ? 3 : value >= 1 ? 2 : 1;
  return "★".repeat(n) + "☆".repeat(3 - n);
}

/** Pick a seed packet, read what it takes from and gives back to the soil, then plant it. */
export function SeedBag({
  game, plotId, onPlant, onClose,
}: { game: GameState; plotId: number; onPlant: (crop: CropId) => void; onClose: () => void }) {
  const [chosen, setChosen] = useState<CropId | null>(null);
  const plot = game.plots[plotId];
  const last = plot.lastFamily;

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-muted">Seed bag · Plot {plotId + 1}</div>
          <h2 className="text-2xl font-black">🌱 What will you plant?</h2>
          <p className="mt-1 text-sm text-muted">
            Every crop takes something from the soil, and some give something back.
            {last && <> Last season this plot grew the <strong>{FAMILY_LABEL[last].toLowerCase()}</strong>.</>}
          </p>
        </div>
        <button onClick={onClose} className="rounded-full bg-paper px-3 py-1 text-lg" aria-label="Close seed bag">×</button>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CROP_ORDER.map((id) => {
          const c = CROPS[id];
          const sameFamily = last === c.family;
          const active = chosen === id;
          return (
            <li key={id}>
              <button
                onClick={() => setChosen(id)}
                aria-pressed={active}
                aria-label={`${c.name} seed packet`}
                className={`flex h-full w-full flex-col rounded-2xl border-2 bg-[#fbf3e1] p-3 text-left shadow-sm transition hover:-translate-y-0.5 ${
                  active ? "border-leaf ring-2 ring-leaf" : "border-[#e3cfa6]"
                }`}
              >
                {/* seed packet header */}
                <div className="flex items-center gap-2 rounded-xl bg-white/80 px-2 py-1.5">
                  <span className="text-3xl">{c.icon}</span>
                  <div className="flex-1">
                    <div className="font-black leading-tight">{c.name}</div>
                    <div className="text-[11px] font-semibold text-muted">{FAMILY_LABEL[c.family]}</div>
                  </div>
                  <div className="text-right text-[11px] font-bold">
                    <div>🪙 {c.seedCost}</div>
                    <div className="text-sun" title="How much the harvest sells for">{stars(c.value)}</div>
                  </div>
                </div>
                <p className="mt-2 text-xs">
                  <span className="font-black text-danger">Takes: </span>
                  {c.takes}
                </p>
                <p className="mt-1 text-xs">
                  <span className="font-black text-leaf">Gives back: </span>
                  {c.givesText}
                </p>
                {last && (
                  <p className={`mt-auto pt-2 text-[11px] font-bold ${sameFamily ? "text-danger" : "text-leaf"}`}>
                    {sameFamily ? "⚠️ Same family as last season" : "✓ Good rotation"}
                  </p>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {chosen && (
        <ChosenPreview game={game} plotId={plotId} crop={chosen} onPlant={onPlant} onCancel={() => setChosen(null)} />
      )}
    </Modal>
  );
}

function ChosenPreview({
  game, plotId, crop, onPlant, onCancel,
}: { game: GameState; plotId: number; crop: CropId; onPlant: (c: CropId) => void; onCancel: () => void }) {
  const c = CROPS[crop];
  const reason = canPlant(game, plotId, crop);
  const preview = previewAction(game, plotId, { plant: crop });
  return (
    <section className="animate-pop-in sticky bottom-0 mt-4 rounded-2xl border-2 border-leaf bg-card p-4 shadow-lg" aria-label="Planting preview">
      <h3 className="mb-2 text-lg font-black">{c.icon} Planting {c.name} in Plot {plotId + 1}</h3>
      <PreviewEffects game={game} plot={game.plots[plotId]} preview={preview} />
      <p className="mt-2 text-xs text-muted">Predictions assume the forecast ({EVENTS[game.forecast].name.toLowerCase()}) comes true.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={onCancel} className="btn btn-ghost flex-1">Back</button>
        <button onClick={() => onPlant(crop)} disabled={!!reason} className="btn btn-primary flex-[2]">
          {reason ?? `Plant in Plot ${plotId + 1} · 🪙 ${c.seedCost}`}
        </button>
      </div>
    </section>
  );
}
