"use client";

import { useState } from "react";
import { CROPS } from "@/game/crops";
import { dayOf, seasonOf } from "@/world/clock";
import { buy, lockedInShop, owns, sellNow, ship } from "@/world/engine";
import { cropDays, ITEMS, sellPrice, SHOP_UNLOCKS, UPGRADES, WORLD_CROPS, type ItemDef } from "@/world/items";
import { QUEST_BY_ID } from "@/world/quests";
import { NPC_BY_ID } from "@/world/town";
import { on } from "@/world/settings";
import type { WorldState } from "@/world/types";
import { Modal } from "./Menus";
import { ItemIcon } from "./ItemIcon";
import { useWorld } from "./useWorld";


export function StoreMenu() {
  const w = useWorld((s) => s.world!);
  const update = useWorld((s) => s.update);
  const close = useWorld((s) => s.close);
  const [tab, setTab] = useState<"seeds" | "tools" | "soil" | "build" | "sell">("seeds");
  const season = seasonOf(dayOf(w.minute), w.settings);
  const seasonal = w.settings.seasons && on(w, "plantingSeasons");
  const hasGreenhouse = w.buildings.some((b) => b.kind === "greenhouse");
  const all = Object.values(ITEMS);
  const seeds = all.filter((i) => i.kind === "seed" && (!seasonal || hasGreenhouse || WORLD_CROPS[i.crop!].seasons.includes(season)));
  const science = (i: ItemDef) => i.id in SHOP_UNLOCKS;
  const farmTools = all.filter((i) => i.kind === "tool" && i.price && !science(i));
  const scienceTools = all.filter(science);
  const soil = all.filter((i) => i.kind === "amendment" && !science(i));
  const kits = all.filter((i) => i.kind === "kit");
  const sellable = w.inventory.map((s, i) => ({ s, i })).filter(({ s }) => s && ITEMS[s.item].sell);

  return (
    <Modal title="Seed & Soil Co." icon="🌱" onClose={close} wide>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {([["seeds", "🌱 Seeds"], ["tools", "🛠️ Tools"], ["soil", "🧪 Soil care"], ["build", "🔨 Build"], ["sell", "🪙 Sell"]] as const).map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`btn py-1.5 text-sm ${tab === id ? "btn-soil" : "btn-ghost"}`}>{label}</button>
        ))}
        <span className="ml-auto rounded-full bg-paper px-3 py-1 text-sm font-black">🪙 {w.coins.toLocaleString()}</span>
      </div>
      {tab === "seeds" && (
        <>
          <p className="mb-2 text-sm text-muted">
            {!seasonal
              ? "Every seed is for sale. Cool-season crops like it mild; warm-season crops like it hot."
              : hasGreenhouse
                ? "You have a greenhouse, so every seed is for sale. Out-of-season seeds only grow inside it."
                : `In stock for ${season}. Build a greenhouse to grow crops in any season!`}
          </p>
          <ItemList items={seeds} w={w} onBuy={(id, n) => update((s) => buy(s, id, n))} extra={(i) => {
            const wc = WORLD_CROPS[i.crop!];
            const inSeason = wc.seasons.includes(season);
            return (
              <>
                <span className="text-[11px] font-bold text-muted">
                  {wc.type === "cool" ? "Cool" : "Warm"}-season · about {cropDays(wc.id, w.settings.daysPerMonth)} days{wc.regrowDays ? " · keeps producing" : ""}
                  {wc.cover ? " · cover crop" : ` · sells ${wc.sellPrice}`}
                  {on(w, "frost") && (wc.killF >= 30 ? " · frost-tender" : " · frost-hardy")}
                </span>
                {seasonal && !inSeason && <span className="ml-1 rounded-full bg-sky/20 px-1.5 text-[10px] font-black text-sky">greenhouse only</span>}
                <span className="block text-[11px]"><b>Takes:</b> {CROPS[i.crop!].takes} <b>Gives back:</b> {CROPS[i.crop!].givesText}</span>
              </>
            );
          }} />
        </>
      )}
      {tab === "tools" && (
        <>
          <p className="mb-2 text-sm text-muted">Tools wear out with use. Buy a new one here, or craft a better one at a workbench.</p>
          <p className="mb-1.5 text-xs font-black uppercase tracking-wider text-muted">Farm tools</p>
          <ItemList items={farmTools} w={w} onBuy={(id, n) => update((s) => buy(s, id, n))} />
          <p className="mb-1.5 mt-3 text-xs font-black uppercase tracking-wider text-muted">Science tools</p>
          <ItemList items={scienceTools} w={w} onBuy={(id, n) => update((s) => buy(s, id, n))} />
        </>
      )}
      {tab === "soil" && (
        <>
          <ItemList items={soil} w={w} onBuy={(id, n) => update((s) => buy(s, id, n))} />
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-line p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={UPGRADES.bigCan.image} alt="" aria-hidden className="h-8 w-8 object-contain" draggable={false} />
            <div className="flex-1">
              <p className="font-bold">{UPGRADES.bigCan.name}</p>
              <p className="text-xs text-muted">{UPGRADES.bigCan.desc}</p>
            </div>
            <button
              className="btn btn-primary py-1 text-sm"
              disabled={w.canSize >= 40 || w.coins < UPGRADES.bigCan.price}
              onClick={() => update((s) => buy(s, "bigCan"))}
            >
              {w.canSize >= 40 ? "Owned" : `🪙 ${UPGRADES.bigCan.price}`}
            </button>
          </div>
        </>
      )}
      {tab === "build" && (
        <>
          <p className="mb-2 text-sm text-muted">Buy a kit, put it in your hotbar, face an open spot, and press Space to build. Face it and press P to pick it back up.</p>
          <ItemList items={kits} w={w} onBuy={(id, n) => update((s) => buy(s, id, n))} />
        </>
      )}
      {tab === "sell" && (
        <>
          <p className="mb-2 text-sm text-muted">
            Sell right now, or use the shipping bin by your house. {w.organic ? "Your organic produce earns 25% extra!" : "Your farm lost its organic certification, so no bonus."}
          </p>
          {sellable.length === 0 && <p className="rounded-xl bg-paper p-4 text-center text-muted">Nothing to sell yet. Go grow something!</p>}
          <ul className="space-y-1.5">
            {sellable.map(({ s, i }) => {
              const def = ITEMS[s!.item];
              const each = sellPrice(def, s!.grade, w.organic);
              return (
                <li key={i} className="flex items-center gap-3 rounded-xl border border-line p-2">
                  <ItemIcon id={s!.item} grade={s!.grade} className="text-2xl" />
                  <span className="flex-1 font-bold">{def.name}{s!.grade ? ` (grade ${s!.grade})` : ""} ×{s!.qty}</span>
                  <span className="text-sm text-muted">🪙 {each} each</span>
                  <button className="btn btn-ghost py-1 text-sm" onClick={() => update((x) => sellNow(x, i, 1))}>Sell 1</button>
                  <button className="btn btn-primary py-1 text-sm" onClick={() => update((x) => sellNow(x, i, s!.qty))}>All · {each * s!.qty}</button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Modal>
  );
}

function ItemList({ items, w, onBuy, extra }: {
  items: ItemDef[]; w: WorldState; onBuy: (id: string, n: number) => void; extra?: (i: ItemDef) => React.ReactNode;
}) {
  return (
    <ul className="space-y-1.5">
      {items.map((i) => {
        const locked = lockedInShop(w, i.id);
        const quest = locked ? QUEST_BY_ID[SHOP_UNLOCKS[i.id]] : null;
        const owned = i.kind === "tool" && owns(w, i.id);
        return (
        <li key={i.id} className={`flex items-center gap-3 rounded-xl border border-line p-2 ${locked ? "opacity-60" : ""}`}>
          <ItemIcon id={i.id} className="text-2xl" />
          <div className="min-w-0 flex-1">
            <p className="font-bold">
              {i.name}
              {i.notOrganic && <span className="ml-1 rounded-full bg-danger/15 px-1.5 text-[10px] font-black text-danger">not organic</span>}
            </p>
            {extra ? extra(i) : <p className="text-xs text-muted">{i.desc}</p>}
            {quest && (
              <p className="mt-0.5 text-xs font-bold text-soil">
                🔒 Not in stock yet. Finish &ldquo;{quest.title}&rdquo; for {NPC_BY_ID[quest.giver]?.short ?? quest.giver} to unlock it.
              </p>
            )}
          </div>
          {locked ? (
            <span className="shrink-0 rounded-full bg-paper px-3 py-1 text-sm font-black text-muted">🔒 {i.price}</span>
          ) : owned ? (
            <span className="shrink-0 rounded-full bg-leaf-light px-3 py-1 text-sm font-black">Owned</span>
          ) : (
          <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
            <button className="btn btn-primary px-3 py-1 text-sm" disabled={w.coins < i.price!} onClick={() => onBuy(i.id, 1)} aria-label={`Buy ${i.name}`}>
              🪙 {i.price}
            </button>
            {i.kind !== "tool" && (i.kind !== "kit" || i.price! < 50) ? (
              <button className="btn btn-ghost px-3 py-1 text-sm" disabled={w.coins < i.price! * 5} onClick={() => onBuy(i.id, 5)} aria-label={`Buy 5 ${i.name}`}>
                ×5
              </button>
            ) : null}
          </div>
          )}
        </li>
        );
      })}
    </ul>
  );
}

export function ShippingMenu() {
  const w = useWorld((s) => s.world!);
  const update = useWorld((s) => s.update);
  const close = useWorld((s) => s.close);
  const sellable = w.inventory.map((s, i) => ({ s, i })).filter(({ s }) => s && ITEMS[s.item].sell);
  const payout = w.shipping.reduce((n, s) => n + sellPrice(ITEMS[s.item], s.grade, w.organic) * s.qty, 0);
  return (
    <Modal title="Shipping bin" icon="📦" onClose={close}>
      <p className="mb-3 text-sm text-muted">Put things in the bin. The truck picks them up overnight and you&apos;re paid in the morning.</p>
      <div className="mb-3 rounded-xl bg-paper p-3">
        <p className="text-xs font-black uppercase tracking-wider text-muted">In the bin</p>
        {w.shipping.length === 0 ? <p className="text-sm text-muted">Empty</p> : (
          <p className="text-sm">{w.shipping.map((s) => `${ITEMS[s.item].icon} ${ITEMS[s.item].name}${s.grade ? ` (${s.grade})` : ""} ×${s.qty}`).join(" · ")}</p>
        )}
        <p className="mt-1 font-black">Tomorrow&apos;s payout: 🪙 {payout}</p>
      </div>
      {sellable.length === 0 ? (
        <p className="text-center text-sm text-muted">Nothing in your bag can be shipped.</p>
      ) : (
        <ul className="space-y-1.5">
          {sellable.map(({ s, i }) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-line p-2">
              <ItemIcon id={s!.item} grade={s!.grade} className="text-2xl" />
              <span className="flex-1 font-bold">{ITEMS[s!.item].name}{s!.grade ? ` (grade ${s!.grade})` : ""} ×{s!.qty}</span>
              <button className="btn btn-primary py-1 text-sm" onClick={() => update((x) => ship(x, i))}>Ship all</button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
