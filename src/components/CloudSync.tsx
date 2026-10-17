"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAccount } from "@/store/account";

/** How often to look for changes to upload while someone is signed in. */
const EVERY_MS = 30_000;

/** Signs back in on page load and keeps the cloud save in step. Renders the "which farm?" question. */
export function CloudSync() {
  const conflict = useAccount((s) => s.conflict);
  const keep = useAccount((s) => s.keep);

  useEffect(() => {
    const db = supabase();
    if (!db) return;
    const { setSession, sync } = useAccount.getState();
    void db.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = db.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user.id !== useAccount.getState().session?.user.id) void setSession(session);
      if (event === "SIGNED_OUT") void setSession(null);
      if (event === "TOKEN_REFRESHED") useAccount.setState({ session });
    });
    const timer = setInterval(() => void sync(), EVERY_MS);
    const onHide = () => document.visibilityState === "hidden" && void sync();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      sub.subscription.unsubscribe();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  if (!conflict) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="cloud-conflict">
      <div className="card w-full max-w-md p-5">
        <h2 id="cloud-conflict" className="font-display text-xl font-black">Which farm do you want to keep?</h2>
        <p className="mt-1 text-sm text-muted">This device has a different farm than the one saved to your account.</p>
        <div className="mt-4 grid gap-2">
          <button className="btn btn-primary justify-between text-left" onClick={() => void keep("cloud")}>
            <span>☁️ Your account&apos;s farm</span>
            <span className="text-xs font-semibold opacity-90">{conflict.cloud}</span>
          </button>
          <button className="btn btn-ghost justify-between text-left" onClick={() => void keep("here")}>
            <span>💻 This device&apos;s farm</span>
            <span className="text-xs font-semibold text-muted">{conflict.here}</span>
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">The other one is replaced.</p>
      </div>
    </div>
  );
}
