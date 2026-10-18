"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloudSetupNote } from "@/lib/supabase";
import { useMulti } from "@/net/mp";
import type { WorldInfo } from "@/net/lobby";
import { Backdrop } from "./MainMenu";
import { useWorld } from "./useWorld";

/** Multiplayer: start a world for up to 8 farmers, join one with its code, or go back to one. */
export function Lobby() {
  const { lobby, me, init, open, status, stopReason } = useMulti();
  const [worlds, setWorlds] = useState<WorldInfo[] | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (!lobby || !me) return;
    lobby.list().then(setWorlds, () => setWorlds([]));
  }, [lobby, me]);

  const attempt = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const back = () => useWorld.setState({ screen: "menu" });

  return (
    <Backdrop>
      <div className="card w-full max-w-lg space-y-4 p-6" role="dialog" aria-label="Multiplayer">
        <div className="text-center">
          <p className="text-4xl" aria-hidden>👩‍🌾🧑‍🌾</p>
          <h2 className="font-display text-3xl font-black">Farm together</h2>
          <p className="mt-1 text-sm text-muted">
            Up to 8 farmers share a town and the old mine. Everyone gets their own garden off Garden Lane, can lend a hand in each other&apos;s, and sells at the market stalls.
          </p>
        </div>

        {stopReason && <p className="rounded-xl bg-sun/30 p-3 text-sm font-bold">{stopReason}</p>}
        {status === "connecting" && <p className="rounded-xl bg-paper p-3 text-sm">Connecting to the world…</p>}

        {!lobby ? (
          <CloudSetupNote what="Multiplayer" />
        ) : !me ? (
          <p className="rounded-xl bg-paper p-3 text-sm">
            Sign in to play with friends. <Link href="/account" className="font-bold underline">Sign in or make an account</Link>
          </p>
        ) : (
          <>
            <section className="space-y-2">
              <h3 className="font-black">Join a friend&apos;s world</h3>
              <form className="flex gap-2" onSubmit={(e) => {
                e.preventDefault();
                void attempt(async () => open(await lobby.join(code)));
              }}>
                <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="FARM-XXXXXX" aria-label="World code" className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2 font-mono uppercase" />
                <button className="btn btn-primary" disabled={busy || code.trim().length < 4}>Join</button>
              </form>
            </section>
            <section className="space-y-2">
              <h3 className="font-black">Start a world (you&apos;ll host it)</h3>
              <form className="flex gap-2" onSubmit={(e) => {
                e.preventDefault();
                void attempt(async () => open(await lobby.create(name)));
              }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Our farm town" maxLength={40} aria-label="World name" className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2" />
                <button className="btn btn-soil" disabled={busy}>Start</button>
              </form>
              <p className="text-xs text-muted">The world runs while you play. Your friends can join with its code whenever you&apos;re in it.</p>
            </section>
            {worlds && worlds.length > 0 && (
              <section className="space-y-2">
                <h3 className="font-black">Your worlds</h3>
                <ul className="space-y-1.5">
                  {worlds.map((w) => (
                    <li key={w.id} className="flex items-center gap-2 rounded-xl bg-paper p-2 text-sm">
                      <span className="mr-auto">
                        <b>{w.name}</b> <span className="font-mono text-xs text-muted">{w.code}</span>
                        <span className="block text-xs text-muted">{w.hostId === me.pid ? "You host this world" : `Hosted by ${w.hostName}`}</span>
                      </span>
                      <button className="btn btn-primary py-1 text-sm" disabled={busy} onClick={() => void attempt(() => open(w))}>
                        {w.hostId === me.pid ? "Open" : "Join"}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <p className="text-xs text-muted">Playing as <b>{me.name}</b>. World chat is filtered for bad language and contact details, and the host can turn it off. Be kind!</p>
          </>
        )}
        {error && <p className="text-sm font-bold text-danger">{error}</p>}
        <button className="btn btn-ghost w-full" onClick={back}>← Back</button>
      </div>
    </Backdrop>
  );
}
