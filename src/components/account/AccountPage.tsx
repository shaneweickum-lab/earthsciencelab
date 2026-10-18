"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloudSetupNote, cloudEnabled, supabase } from "@/lib/supabase";
import { useAccount } from "@/store/account";

const field = "w-full rounded-xl border-2 border-line bg-card px-3 py-2 font-semibold outline-none focus:border-sky";

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input className={`${field} mt-1`} {...props} />
    </label>
  );
}

async function post(path: string, body: unknown) {
  const r = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
  return data;
}

/** The words a student uses to sign in on another computer, shown big so they can copy them down. */
function LoginWords({ code, nickname, words }: { code: string; nickname: string; words: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-soil bg-paper p-4">
      <p className="text-sm font-bold">Write these down. You&apos;ll need them to sign in on another computer:</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted">Class code</dt><dd className="font-black tracking-widest">{code}</dd>
        <dt className="text-muted">Name</dt><dd className="font-black">{nickname}</dd>
        <dt className="text-muted">Login words</dt><dd className="font-mono text-lg font-black">{words}</dd>
      </dl>
      <p className="mt-2 text-xs text-muted">Forgot them later? Your teacher can give you new ones.</p>
    </div>
  );
}

function StudentForms() {
  const [mode, setMode] = useState<"join" | "login">("join");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [words, setWords] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState<{ words: string; nickname: string; className: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await post(mode === "join" ? "/api/students/join" : "/api/students/login", { code, nickname, words });
      if (mode === "join") setJoined({ words: data.words, nickname: data.nickname, className: data.className });
      await supabase()!.auth.setSession(data.session);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (joined) {
    return (
      <div className="space-y-3">
        <p className="font-black text-leaf">You joined {joined.className}! 🎉</p>
        <LoginWords code={code.toUpperCase()} nickname={joined.nickname} words={joined.words} />
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("join")} className={`btn py-1.5 text-sm ${mode === "join" ? "btn-soil" : "btn-ghost"}`}>Join my class</button>
        <button type="button" onClick={() => setMode("login")} className={`btn py-1.5 text-sm ${mode === "login" ? "btn-soil" : "btn-ghost"}`}>I already joined</button>
      </div>
      <Field label="Class code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC234" autoComplete="off" required maxLength={8} />
      <Field label="Your first name or a nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="off" required maxLength={24} />
      {mode === "login" && (
        <Field label="Login words" value={words} onChange={(e) => setWords(e.target.value)} placeholder="otter-maple-river-42" autoComplete="off" required />
      )}
      {mode === "join" && <p className="text-xs text-muted">Use only your first name or a made-up name. Don&apos;t type your last name, email, or anything private.</p>}
      {error && <p className="rounded-xl bg-danger/10 p-2 text-sm font-bold text-danger">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "One moment…" : mode === "join" ? "Join class" : "Sign in"}</button>
    </form>
  );
}

function TeacherForms() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const db = supabase()!;
    setBusy(true);
    setError("");
    setNote("");
    const r = mode === "in"
      ? await db.auth.signInWithPassword({ email, password })
      : await db.auth.signUp({ email, password, options: { data: { display_name: name }, emailRedirectTo: `${location.origin}/teacher` } });
    setBusy(false);
    if (r.error) setError(r.error.message);
    else if (mode === "up" && !r.data.session) setNote("Check your email for a link to finish making your account.");
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("in")} className={`btn py-1.5 text-sm ${mode === "in" ? "btn-soil" : "btn-ghost"}`}>Sign in</button>
        <button type="button" onClick={() => setMode("up")} className={`btn py-1.5 text-sm ${mode === "up" ? "btn-soil" : "btn-ghost"}`}>New teacher account</button>
      </div>
      {mode === "up" && <Field label="Your name (students see it)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ms. Rivera" required />}
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={8} required />
      {error && <p className="rounded-xl bg-danger/10 p-2 text-sm font-bold text-danger">{error}</p>}
      {note && <p className="rounded-xl bg-leaf-light p-2 text-sm font-bold">{note}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "One moment…" : mode === "in" ? "Sign in" : "Make my account"}</button>
    </form>
  );
}

function SignedIn() {
  const profile = useAccount((s) => s.profile);
  const session = useAccount((s) => s.session)!;
  const status = useAccount((s) => s.status);
  const lastSync = useAccount((s) => s.lastSync);
  const sync = useAccount((s) => s.sync);
  const signOut = useAccount((s) => s.signOut);
  const [classes, setClasses] = useState<{ name: string; nickname: string }[]>([]);

  useEffect(() => {
    if (profile?.role !== "student") return;
    void supabase()!.from("class_members").select("nickname, classes(name)").eq("student_id", session.user.id)
      .then(({ data }) => setClasses((data ?? []).map((m) => ({ nickname: m.nickname, name: (m.classes as unknown as { name: string } | null)?.name ?? "" }))));
  }, [profile, session]);

  const statusText = { off: "Not syncing", syncing: "Saving…", saved: "Saved to your account", error: "Couldn't reach the cloud. We'll try again." }[status];
  return (
    <div className="card space-y-4 p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-muted">{profile?.role === "teacher" ? "Teacher" : "Student"}</p>
        <p className="font-display text-2xl font-black">{profile?.display_name || session.user.email}</p>
      </div>
      {classes.length > 0 && (
        <p className="text-sm">Class: {classes.map((c) => <b key={c.name}>{c.name}</b>)}</p>
      )}
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-paper p-3 text-sm">
        <span className={status === "error" ? "font-bold text-danger" : "font-bold"}>☁️ {statusText}</span>
        {lastSync && <span className="text-muted">Last checked {new Date(lastSync).toLocaleTimeString()}</span>}
        <button className="btn btn-ghost ml-auto py-1 text-sm" onClick={() => void sync()}>Sync now</button>
      </div>
      <p className="text-sm text-muted">Your farm, XP, badges, and grade level are saved to your account, so you can keep playing on any computer.</p>
      <div className="flex flex-wrap gap-2">
        {profile?.role === "teacher" && <Link href="/teacher" className="btn btn-primary">Your classes →</Link>}
        <Link href="/soil/game" className="btn btn-ghost">Play Soil &amp; Sprout</Link>
        <button className="btn btn-ghost ml-auto" onClick={() => void signOut()}>Sign out</button>
      </div>
      <p className="text-xs text-muted">Signing out saves one last time and removes the farm from this computer, so the next person starts fresh.</p>
    </div>
  );
}

export function AccountPage() {
  const session = useAccount((s) => s.session);
  if (!cloudEnabled) {
    return (
      <div className="card p-6">
        <h1 className="font-display text-3xl font-black">Accounts</h1>
        <p className="mt-2 text-muted">Cloud accounts aren&apos;t turned on for this site yet. Your progress is saved in this browser.</p>
        <div className="mt-3"><CloudSetupNote what="Signing in" /></div>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-soil">Your account</p>
        <h1 className="font-display text-4xl font-black">Save your progress everywhere</h1>
      </header>
      {session ? <SignedIn /> : (
        <div className="grid gap-6 md:grid-cols-2">
          <section className="card p-6">
            <h2 className="mb-3 font-display text-xl font-black">🎒 Students</h2>
            <StudentForms />
          </section>
          <section className="card p-6">
            <h2 className="mb-3 font-display text-xl font-black">🍎 Teachers</h2>
            <TeacherForms />
          </section>
        </div>
      )}
    </div>
  );
}
