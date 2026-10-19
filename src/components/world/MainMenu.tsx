"use client";

import { useState } from "react";
import { dayOf, formatDate, seasonLabel, yearOf } from "@/world/clock";
import { AVATARS, DEFAULT_AVATAR } from "@/world/avatars";
import { DEFAULT_SETTINGS, normalizeSettings, PRESETS, presetOf, type GameSettings } from "@/world/settings";
import { AvatarChoice, HubTabs } from "./Menus";
import { CalendarPanel, SciencePanel, TimePanel } from "./SettingsPanels";
import { useMulti } from "@/net/mp";
import { useWorld } from "./useWorld";
import { useFullscreen } from "./useFullscreen";

/** Rolling hills and a sunrise behind the menus. */
export function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-y-auto bg-gradient-to-b from-[#bfe3f2] via-[#f6e7c4] to-[#7fb069]">
      <div className="pointer-events-none absolute left-1/2 top-16 h-40 w-40 -translate-x-1/2 rounded-full bg-[#ffd27a] opacity-80 blur-[2px]" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-72 w-[70%] rounded-[50%] bg-[#6fa04a]" />
      <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-[75%] rounded-[50%] bg-[#5c8f3d]" />
      <div className="relative flex min-h-full items-center justify-center p-4">{children}</div>
    </div>
  );
}

export function MainMenu() {
  const saved = useWorld((s) => s.saved);
  const { startQuick, continueGame, openSetup } = useWorld.getState();
  const [confirm, setConfirm] = useState(false);
  const d = saved ? dayOf(saved.minute) : 0;
  return (
    <Backdrop>
      <div className="card w-full max-w-md space-y-4 p-6 text-center" role="dialog" aria-label="Main menu">
        <div>
          <p className="text-5xl" aria-hidden>🌱</p>
          <h2 className="font-display text-4xl font-black">Soil &amp; Sprout</h2>
          <p className="mt-1 text-sm text-muted">Grow a garden, care for the soil, and learn how the living world works.</p>
        </div>
        <div className="grid gap-2">
          <button className="btn btn-primary text-lg" onClick={() => (saved ? setConfirm(true) : startQuick())}>▶ Start</button>
          {confirm && (
            <div className="rounded-xl bg-paper p-3 text-left text-sm">
              <p className="font-bold">Start a new farm with the recommended settings? This replaces your saved farm.</p>
              <div className="mt-2 flex gap-2">
                <button className="btn btn-soil py-1 text-sm" onClick={startQuick}>Yes, start fresh</button>
                <button className="btn btn-ghost py-1 text-sm" onClick={() => setConfirm(false)}>Never mind</button>
              </div>
            </div>
          )}
          <button className="btn btn-soil flex-col gap-0 text-lg" onClick={continueGame} disabled={!saved}>
            <span>⏯ Continue</span>
            {saved && (
              <span className="text-xs font-semibold opacity-90">
                {formatDate(d, saved.settings)}, Year {yearOf(d, saved.settings)} · {seasonLabel(d, saved.settings)} · 🪙 {saved.coins.toLocaleString()}
              </span>
            )}
          </button>
          <button className="btn btn-ghost text-lg" onClick={openSetup}>✨ New Game</button>
          <button className="btn btn-ghost text-lg" onClick={() => useWorld.setState({ screen: "lobby" })}>👩‍🌾 Multiplayer</button>
        </div>
        <p className="text-xs text-muted">Your farm is saved in this browser.</p>
      </div>
    </Backdrop>
  );
}

const STEPS = ["Farmer", "Science", "Time", "Calendar"] as const;

export function NewGameSetup() {
  const saved = useWorld((s) => s.saved);
  const { startNew, backToMenu } = useWorld.getState();
  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const patch = (p: Partial<GameSettings>) => setSettings((s) => normalizeSettings({ ...s, ...p }));
  const preset = presetOf(settings.science);
  return (
    <Backdrop>
      <div className="card flex max-h-full w-full max-w-3xl flex-col overflow-hidden" role="dialog" aria-label="New game">
        <div className="border-b border-line bg-paper px-5 py-3">
          <h2 className="font-display text-2xl font-black">✨ New farm</h2>
          <nav className="mt-2 flex flex-wrap gap-1" aria-label="Setup steps">
            {STEPS.map((label, i) => (
              <button
                key={label}
                onClick={() => setStep(i)}
                aria-current={step === i ? "step" : undefined}
                className={`rounded-full px-3 py-1 text-xs font-bold ${step === i ? "bg-soil text-white" : "bg-card hover:bg-line"}`}
              >
                {i + 1}. {label}
              </button>
            ))}
          </nav>
        </div>
        <div className="overflow-y-auto p-5">
          {step === 0 && (
            <div className="space-y-2">
              <p className="text-sm font-black">Choose your farmer</p>
              <AvatarChoice value={avatar} onChange={setAvatar} />
              <p className="text-xs text-muted">{AVATARS.length} farmers to pick from. You can change your look later at home.</p>
            </div>
          )}
          {step === 1 && (
            <div className="space-y-2">
              <p className="text-sm">
                Turn science features on for a more realistic (and harder) farm, or off to just build and grow.
                You can change these any time from the pause menu.
              </p>
              <SciencePanel science={settings.science} onChange={(science) => patch({ science })} />
            </div>
          )}
          {step === 2 && <TimePanel settings={settings} onChange={patch} />}
          {step === 3 && <CalendarPanel settings={settings} onChange={patch} />}
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line bg-paper px-5 py-3">
          <button className="btn btn-ghost py-1.5" onClick={() => (step === 0 ? backToMenu() : setStep(step - 1))}>
            ← {step === 0 ? "Main menu" : "Back"}
          </button>
          <span className="ml-auto hidden text-xs text-muted sm:inline">
            {preset === "custom" ? "Custom science" : PRESETS[preset].label} · {settings.speed}× · {settings.seasons ? `${settings.daysPerMonth}-day months` : "No seasons"}
          </span>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-soil py-1.5" onClick={() => setStep(step + 1)}>Next →</button>
          ) : (
            <button className="btn btn-primary py-1.5" onClick={() => startNew(settings, avatar)}>
              🌱 Begin{saved ? " (replaces saved farm)" : ""}
            </button>
          )}
        </div>
      </div>
    </Backdrop>
  );
}

/** In-game pause: resume, change settings, or save and quit. */
/** Full screen on or off (also the F key). */
function FullscreenToggle() {
  const full = useFullscreen((s) => s.full);
  const toggle = useFullscreen((s) => s.toggle);
  return (
    <button className="btn btn-ghost py-1.5" onClick={toggle}>
      {full ? "🗗 Exit full screen" : "⛶ Full screen"} <kbd className="text-xs text-muted">F</kbd>
    </button>
  );
}

export function PauseMenu() {
  const w = useWorld((s) => s.world!);
  const multi = useWorld((s) => s.remote !== null);
  const { close, updateSettings, quitToMenu } = useWorld.getState();
  const [tab, setTab] = useState<"science" | "time" | "calendar">("science");
  // A shared world keeps going while your menu is open, and its settings are the host's.
  if (multi) {
    return (
      <div className="absolute inset-0 z-40 grid place-items-center bg-soil-dark/50 p-3 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="card w-full max-w-3xl overflow-hidden">
          <HubTabs />
          <div className="mx-auto max-w-sm space-y-3 p-5 text-center">
          <h2 className="font-display text-xl font-black">⚙️ Game</h2>
          <p className="text-sm text-muted">The world keeps going while this is open.</p>
          <div className="grid gap-2">
            <button className="btn btn-primary" onClick={close}>▶ Back to the farm</button>
            <FullscreenToggle />
            <button className="btn btn-ghost" onClick={() => void useMulti.getState().leave()}>🚪 Leave this world</button>
          </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-soil-dark/50 p-3 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Paused">
      <div className="card flex max-h-full w-full max-w-3xl flex-col overflow-hidden">
        <HubTabs />
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-paper px-5 py-3">
          <h2 className="mr-auto font-display text-xl font-black">⏸ Paused</h2>
          <button className="btn btn-primary py-1.5" onClick={close}>▶ Resume</button>
          <FullscreenToggle />
          <button className="btn btn-ghost py-1.5" onClick={quitToMenu}>💾 Save &amp; quit to menu</button>
        </div>
        <div className="flex gap-1 px-5 pt-3">
          {([["science", "🔬 Science"], ["time", "⏱️ Time & units"], ["calendar", "📅 Calendar"]] as const).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`rounded-full px-3 py-1 text-xs font-bold ${tab === id ? "bg-soil text-white" : "bg-paper hover:bg-line"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto p-5">
          {tab === "science" && <SciencePanel science={w.settings.science} onChange={(science) => updateSettings({ science })} />}
          {tab === "time" && <TimePanel settings={w.settings} onChange={(p) => updateSettings(normalizeSettings({ ...w.settings, ...p }))} />}
          {tab === "calendar" && <CalendarPanel settings={w.settings} locked />}
        </div>
      </div>
    </div>
  );
}
