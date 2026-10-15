"use client";

import { useState } from "react";
import { dayOf, formatDate, seasonLabel, timeOfDay } from "@/world/clock";
import { HOTBAR_SIZE, sleep, swapSlots, todayClimate, tomorrowClimate } from "@/world/engine";
import { formatTemp } from "@/world/settings";
import { ITEMS } from "@/world/items";
import { AVATARS, DEFAULT_AVATAR } from "@/world/avatars";
import { GRADE_INFO } from "@/world/grades";
import { WEATHER } from "@/world/weather";
import { ItemIcon } from "./ItemIcon";
import { useWorld } from "./useWorld";

export function Modal({ title, icon, children, onClose, wide = false }: {
  title: string; icon: string; children: React.ReactNode; onClose?: () => void; wide?: boolean;
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-soil-dark/50 p-3 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`card flex max-h-full w-full flex-col overflow-hidden ${wide ? "max-w-3xl" : "max-w-lg"}`}>
        <div className="flex items-center gap-2 border-b border-line bg-paper px-5 py-3">
          <span className="text-2xl" aria-hidden>{icon}</span>
          <h2 className="font-display text-xl font-black">{title}</h2>
          {onClose && (
            <button onClick={onClose} className="ml-auto rounded-full px-2 text-2xl leading-none text-muted hover:bg-line" aria-label="Close">
              ×
            </button>
          )}
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

/** Pick how your farmer looks, for the farm you're playing. */
export function AvatarPicker() {
  const avatar = useWorld((s) => s.world!.avatar ?? DEFAULT_AVATAR);
  const update = useWorld((s) => s.update);
  return <AvatarChoice value={avatar} onChange={(a) => update((w) => ({ ...w, avatar: a }))} />;
}

export function AvatarChoice({ value: avatar, onChange }: { value: string; onChange: (avatar: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Choose your farmer" className="grid grid-cols-6 gap-1.5">
      {AVATARS.map((a) => (
        <button
          key={a}
          role="radio"
          aria-checked={a === avatar}
          aria-label={`Farmer ${a}`}
          onClick={() => onChange(a)}
          className={`aspect-square rounded-xl p-0.5 transition ${a === avatar ? "bg-sun ring-2 ring-soil" : "bg-paper hover:bg-white"}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/icons/avatar_${a}.png`} alt="" className="h-full w-full object-contain" draggable={false} />
        </button>
      ))}
    </div>
  );
}

export function IntroLetter() {
  const update = useWorld((s) => s.update);
  const close = useWorld((s) => s.close);
  const start = () => {
    update((w) => ({ ...w, introSeen: true }));
    close();
  };
  return (
    <Modal title="A letter for you" icon="✉️">
      <div className="space-y-3 rounded-xl bg-[#fdf6e3] p-4 font-serif leading-relaxed shadow-inner">
        <p className="font-display text-2xl font-black text-leaf">Congratulations! You inherited an organic garden!</p>
        <p>
          My dear grandchild, the farm is yours now. I&apos;m sorry to say it&apos;s grown wild. Weeds, sticks, and stones are everywhere, and I
          never did test the soil. Treat it kindly and it will feed you for a lifetime.
        </p>
        <p>
          Clear the weeds, test the soil, and feed it with compost and cover crops. Watch the sky, too: the weather decides more than
          you&apos;d think. Keep an eye out for the little creatures. Most of them are friends.
        </p>
        <p>
          I left you carrot and clover seeds. They don&apos;t mind a chilly spring night. Save the beans and tomatoes for when the
          nights stay above freezing.
        </p>
        <p>The folks at Seed &amp; Soil Co. will buy what you grow. Remember, organic produce sells for more.</p>
        <p className="text-right italic">Love, Grandma Rosa 🌻</p>
      </div>
      <p className="mt-4 mb-1.5 text-sm font-black">Choose your farmer:</p>
      <AvatarPicker />
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        <Tip k="W A S D" text="Walk (or arrow keys)" />
        <Tip k="Space" text="Use the item in your hand" />
        <Tip k="1 – 0" text="Pick a hotbar item" />
        <Tip k="E" text="Talk, open, and harvest" />
        <Tip k="I" text="Open your bag" />
        <Tip k="J" text="Open your Nature Journal" />
      </div>
      <p className="mt-3 text-xs text-muted">
        Time passes only while you play. Each crop takes a few in-game days to grow. Sleep in your house to start a new day and save.
      </p>
      <button onClick={start} className="btn btn-primary mt-4 w-full text-lg">
        Let&apos;s get gardening! 🌱
      </button>
    </Modal>
  );
}

function Tip({ k, text }: { k: string; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <kbd className="rounded-md border border-line bg-white px-2 py-0.5 font-mono text-xs font-bold shadow-sm">{k}</kbd>
      <span>{text}</span>
    </div>
  );
}

export function HouseMenu() {
  const { update, open, close, save } = useWorld.getState();
  const minute = useWorld((s) => s.world!.minute);
  const h = timeOfDay(minute) / 60;
  const goToBed = () => {
    update(sleep);
    save();
    open("summary");
  };
  return (
    <Modal title="Your farmhouse" icon="🏠" onClose={close}>
      <div className="grid gap-2">
        <button className="btn btn-soil justify-start text-left" onClick={goToBed}>
          🛏️ Go to bed {h < 18 ? "(skip the rest of today)" : ""}
        </button>
        <button className="btn btn-ghost justify-start" onClick={() => open("tv")}>📺 Watch the weather channel</button>
        <button className="btn btn-ghost justify-start" onClick={() => open("journal")}>📓 Read your Nature Journal</button>
        <details className="rounded-xl border border-line px-3 py-2 text-sm">
          <summary className="cursor-pointer font-bold">👕 Change your look</summary>
          <div className="mt-2"><AvatarPicker /></div>
        </details>
        <p className="px-1 text-xs text-muted">Your farm saves itself every in-game hour and whenever you sleep.</p>
        <button className="btn btn-ghost justify-start" onClick={() => open("pause")}>⚙️ Game settings &amp; main menu</button>
      </div>
    </Modal>
  );
}

export function TvForecast() {
  const w = useWorld((s) => s.world!);
  const open = useWorld((s) => s.open);
  const todayC = todayClimate(w);
  const tomorrowC = tomorrowClimate(w);
  const today = WEATHER[todayC.kind];
  const tomorrow = WEATHER[tomorrowC.kind];
  const u = w.settings.units;
  return (
    <Modal title="Weather Channel 4" icon="📺" onClose={() => open("house")}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-[#1f3550] p-4 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-sky-200">Tomorrow&apos;s forecast · {formatDate(dayOf(w.minute) + 1, w.settings)} · {seasonLabel(dayOf(w.minute) + 1, w.settings)}</p>
          <p className="mt-1 flex items-center gap-3 font-display text-3xl font-black">
            <span aria-hidden>{tomorrow.icon}</span> {tomorrow.name}
          </p>
          <p className="mt-1 font-display text-xl font-black">High {formatTemp(tomorrowC.high, u)} · Low {formatTemp(tomorrowC.low, u)}</p>
          <p className="mt-1 text-sky-100">{tomorrow.tv}</p>
        </div>
        <div className="rounded-xl bg-leaf-light p-3 text-sm">
          <p className="font-black">🔬 Weather science: {tomorrow.name.toLowerCase()}</p>
          <p className="mt-1">{tomorrow.science}</p>
        </div>
        <p className="text-sm text-muted">Today: {today.icon} {today.name}, high {formatTemp(todayC.high, u)}. {today.science}</p>
        {w.settings.seasons && (
          <p className="rounded-xl bg-paper p-3 text-sm">
            <b>🌍 Why seasons?</b> Earth&apos;s axis is tilted. In summer your part of the world leans toward the Sun, so sunlight hits
            more directly and days are longer. In winter sunlight comes in at a low slant and days are short, so it gets cold.
          </p>
        )}
      </div>
    </Modal>
  );
}

export function DaySummary() {
  const w = useWorld((s) => s.world!);
  const close = useWorld((s) => s.close);
  const log = w.log;
  const d = dayOf(w.minute);
  const climate = todayClimate(w);
  const weather = WEATHER[climate.kind];
  return (
    <Modal title={`Good morning! Day ${d}`} icon="🌅">
      <div className="space-y-3">
        <p className="text-sm font-bold text-muted">
          {formatDate(d, w.settings)} · {seasonLabel(d, w.settings)} · Today: {weather.icon} {weather.name}, high {formatTemp(climate.high, w.settings.units)}
        </p>
        {log && log.earned > 0 && (
          <div className="rounded-xl bg-sun/20 p-3 text-center font-display text-2xl font-black">🪙 +{log.earned}</div>
        )}
        <ul className="space-y-1.5 text-sm">
          {(log?.notes ?? []).map((n) => <li key={n} className="rounded-lg bg-paper px-3 py-1.5">{n}</li>)}
        </ul>
        <button onClick={close} className="btn btn-primary w-full">Start the day</button>
      </div>
    </Modal>
  );
}

/** Your bag. Click one slot, then another, to swap them. The top row is your hotbar. */
export function Bag() {
  const inv = useWorld((s) => s.world!.inventory);
  const update = useWorld((s) => s.update);
  const close = useWorld((s) => s.close);
  const [held, setHeld] = useState<number | null>(null);
  const [look, setLook] = useState<number | null>(null);
  const click = (i: number) => {
    setLook(i);
    if (held === null) {
      if (inv[i]) setHeld(i);
      return;
    }
    if (held !== i) update((w) => swapSlots(w, held, i));
    setHeld(null);
  };
  const shown = look !== null ? inv[look] : null;
  return (
    <Modal title="Your bag" icon="🎒" onClose={close}>
      <p className="mb-2 text-xs text-muted">Click an item, then another slot, to move it. The top row is your hotbar.</p>
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {inv.map((s, i) => (
          <button
            key={i}
            onClick={() => click(i)}
            aria-label={s ? `${ITEMS[s.item].name}${s.grade ? ` grade ${s.grade}` : ""} ×${s.qty}` : `Empty slot ${i + 1}`}
            className={`relative grid aspect-square place-items-center rounded-xl text-2xl transition ${
              held === i ? "bg-sun ring-2 ring-soil" : i < HOTBAR_SIZE ? "bg-leaf-light hover:bg-white" : "bg-paper hover:bg-white"
            }`}
          >
            {s && <ItemIcon id={s.item} grade={s.grade} />}
            {s && s.qty > 1 && <span className="absolute bottom-0 right-1 text-[11px] font-black">{s.qty}</span>}
          </button>
        ))}
      </div>
      <div className="mt-3 min-h-16 rounded-xl bg-paper p-3 text-sm">
        {shown ? (
          <>
            <p className="flex items-center gap-2.5 font-black"><ItemIcon id={shown.item} grade={shown.grade} /> {ITEMS[shown.item].name} ×{shown.qty}</p>
            {shown.grade && (
              <p className="mt-1 text-xs font-bold">
                Grade {shown.grade}: sells for ×{GRADE_INFO[shown.grade].price} the normal price. Healthier soil and good care grow higher grades.
              </p>
            )}
            <p className="mt-1 text-muted">{ITEMS[shown.item].desc}</p>
          </>
        ) : (
          <p className="text-muted">Click an item to read about it.</p>
        )}
      </div>
    </Modal>
  );
}
