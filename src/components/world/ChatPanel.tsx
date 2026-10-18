"use client";

import { useEffect, useRef, useState } from "react";
import { useMulti } from "@/net/mp";
import { CHAT_MAX, cleanChat } from "@/world/chatFilter";
import type { ChatMessage } from "@/world/multi";
import { useWorld } from "./useWorld";

const QUICK = ["Hi!", "Want to trade?", "Come to my garden!", "Need a hand?", "Thanks!", "Good night!"];
const EMOTES = ["👋", "🌱", "👍", "❤️", "😄", "🥕"];
/** How long a new message stays in the feed while chat is closed. */
const FEED_MS = 8000;

const send = (op: string, args: unknown[]) => useWorld.getState().remote?.(op, args);

/** A farmer's name in their garden's color, so it's easy to tell who's talking. */
const NAME_COLORS = ["#2f6f3e", "#9a4b1f", "#2e5c8a", "#7a3f8f", "#8a6d1a", "#1f7a76", "#a33a4f", "#4f5a1f"];

function Line({ c, mine, hostView, menu, setMenu }: {
  c: ChatMessage; mine: boolean; hostView: boolean; menu: number | null; setMenu: (id: number | null) => void;
}) {
  const world = useMulti((s) => s.world)!;
  const me = useMulti((s) => s.me)!;
  const muted = useMulti((s) => s.muted);
  const toggleMute = useMulti((s) => s.toggleMute);
  const garden = world.players[c.pid]?.garden ?? 0;
  const reported = c.reports?.includes(me.pid);
  return (
    <li className="group relative rounded-lg px-2 py-0.5 hover:bg-paper">
      <b style={{ color: NAME_COLORS[garden % NAME_COLORS.length] }}>{c.name}</b>
      {c.pid === world.hostId && <span className="ml-1 text-[10px] font-black text-muted">HOST</span>}
      : {cleanChat(c.text)}
      {!mine && (
        <button className="absolute right-1 top-0.5 hidden rounded px-1 text-muted hover:bg-line group-hover:block" aria-label={`Options for ${c.name}'s message`} onClick={() => setMenu(menu === c.id ? null : c.id)}>…</button>
      )}
      {menu === c.id && (
        <div className="absolute right-1 top-6 z-10 grid w-40 rounded-xl bg-card p-1 text-xs shadow-lg">
          <button className="rounded-lg px-2 py-1 text-left hover:bg-paper" onClick={() => { toggleMute(c.pid); setMenu(null); }}>
            {muted.includes(c.pid) ? `🔊 Unmute ${c.name}` : `🔇 Mute ${c.name}`}
          </button>
          <button className="rounded-lg px-2 py-1 text-left hover:bg-paper disabled:opacity-50" disabled={reported} onClick={() => { send("report", [c.id]); setMenu(null); }}>
            {reported ? "Reported" : "🚩 Report to the host"}
          </button>
          {hostView && (
            <button className="rounded-lg px-2 py-1 text-left hover:bg-paper" onClick={() => { send("hideChat", [c.id, true]); setMenu(null); }}>🙈 Hide for everyone</button>
          )}
        </div>
      )}
    </li>
  );
}

/**
 * The world's chat, bottom left in a shared world. New messages show for a few seconds; press
 * Enter (or the 💬 button) to open it, type, and send. Messages are cleaned by the host's chat
 * filter (and again here); mute and report are a click away.
 */
export function ChatPanel() {
  const world = useMulti((s) => s.world);
  const me = useMulti((s) => s.me);
  const muted = useMulti((s) => s.muted);
  const chatSeen = useMulti((s) => s.chatSeen);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [menu, setMenu] = useState<number | null>(null);
  const [, setNow] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLUListElement>(null);

  // Re-draw once a second so new messages fade from the feed.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Enter opens chat (when you're not typing somewhere else or in a menu).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || open) return;
      const el = e.target as HTMLElement | null;
      if (el && (["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName) || el.isContentEditable)) return;
      const st = useWorld.getState();
      if (st.screen !== "playing" || st.menu) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const log = (world?.chat ?? []).filter((c) => !c.hidden && !muted.includes(c.pid));
  useEffect(() => {
    if (open && list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [open, log.length]);

  if (!world || !me || !world.players[me.pid]) return null;
  const hostView = world.hostId === me.pid;
  const recent = log.filter((c) => Date.now() - (chatSeen[c.id] ?? 0) < FEED_MS).slice(-4);
  const say = (t: string) => {
    if (!t.trim()) return;
    send("chat", [t.slice(0, CHAT_MAX)]);
    setText("");
  };
  const close = () => {
    setOpen(false);
    setMenu(null);
    input.current?.blur();
  };

  if (!open) {
    return (
      <div className="pointer-events-auto flex w-80 max-w-[70vw] flex-col items-start gap-1">
        {recent.length > 0 && (
          <ul className="w-full space-y-0.5 rounded-xl bg-soil-dark/70 p-1.5 text-xs text-white shadow" aria-label="New chat messages">
            {recent.map((c) => (
              <li key={c.id}><b>{c.name}:</b> {cleanChat(c.text)}</li>
            ))}
          </ul>
        )}
        <button onClick={() => setOpen(true)} className="rounded-full bg-card/90 px-3 py-1.5 text-sm font-bold shadow hover:bg-white" aria-label="Open chat">
          💬 Chat <kbd className="text-xs text-muted">Enter</kbd>
        </button>
      </div>
    );
  }

  return (
    <section className="pointer-events-auto w-80 max-w-[85vw] rounded-2xl bg-card/95 p-2 text-sm shadow-lg" aria-label="Chat">
      <div className="mb-1 flex items-center gap-2 px-1">
        <b>💬 World chat</b>
        <button onClick={close} className="ml-auto rounded-full px-2 text-lg leading-none text-muted hover:bg-line" aria-label="Close chat">×</button>
      </div>
      <ul ref={list} className="max-h-48 space-y-0.5 overflow-y-auto text-xs" aria-live="polite">
        {log.length === 0 ? <li className="px-2 py-1 text-muted">No messages yet. Say hi!</li> : log.map((c) => (
          <Line key={c.id} c={c} mine={c.pid === me.pid} hostView={hostView} menu={menu} setMenu={setMenu} />
        ))}
      </ul>
      {world.chatOff ? (
        <p className="mt-2 rounded-xl bg-paper p-2 text-xs font-bold">The host has turned chat off.</p>
      ) : (
        <>
          <div className="mt-2 flex flex-wrap gap-1">
            {QUICK.map((q) => <button key={q} onClick={() => say(q)} className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold hover:bg-line">{q}</button>)}
            {EMOTES.map((e) => <button key={e} onClick={() => say(e)} className="rounded-full px-1 text-base hover:bg-line" aria-label={`Send ${e}`}>{e}</button>)}
          </div>
          <form className="mt-2 flex gap-1" onSubmit={(e) => { e.preventDefault(); say(text); }}>
            <input
              ref={input}
              value={text}
              maxLength={CHAT_MAX}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); } }}
              placeholder="Say something kind…"
              aria-label="Chat message"
              className="min-w-0 flex-1 rounded-xl border border-line px-2 py-1"
            />
            <button className="btn btn-primary px-3 py-1 text-xs" disabled={!text.trim()}>Send</button>
          </form>
          <p className="mt-1 px-1 text-[10px] text-muted">{CHAT_MAX - text.length} left · Be kind. No links, emails, numbers, or usernames.</p>
        </>
      )}
    </section>
  );
}
