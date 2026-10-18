"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { checkPassword, checkUsername, loginWords, PASSWORD_MAX, PASSWORD_MIN, USERNAME_MAX } from "@/lib/accounts";
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

/** What a student needs to sign in on another computer, shown big so they can copy it down. */
function WriteThisDown({ rows, note }: { rows: [string, string][]; note?: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-soil bg-paper p-4">
      <p className="text-sm font-bold">Write this down. You&apos;ll need it to sign in on another computer:</p>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted">{k}</dt>
            <dd className="break-all font-mono text-base font-black">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">{note ?? "Forgot your password later? Your teacher can give you new login words."}</p>
    </div>
  );
}

/** A password box with a button that fills in easy login words (and shows them). */
function PasswordField({ value, onChange, label = "Password", autoComplete }: { value: string; onChange: (v: string) => void; label?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Field label={label} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} required minLength={PASSWORD_MIN} maxLength={PASSWORD_MAX} />
      <div className="mt-1 flex gap-2 text-xs">
        <button type="button" className="font-bold text-soil underline" onClick={() => { onChange(loginWords()); setShow(true); }}>🎲 Use easy login words</button>
        <button type="button" className="text-muted underline" onClick={() => setShow((x) => !x)}>{show ? "Hide" : "Show"}</button>
      </div>
    </div>
  );
}

function StudentForms() {
  const [mode, setMode] = useState<"up" | "in" | "code">("up");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [made, setMade] = useState<{ username: string; password: string; className: string | null } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "up") {
      const bad = checkUsername(username) ?? checkPassword(password);
      if (bad) return setError(bad);
    }
    setBusy(true);
    setError("");
    try {
      const data = mode === "up"
        ? await post("/api/students/signup", { username, password, displayName, code })
        : mode === "in"
          ? await post("/api/students/login", { username, password })
          : await post("/api/students/login", { code, nickname, words: password });
      if (mode === "up") setMade({ username: data.username, password, className: data.className });
      await supabase()!.auth.setSession(data.session);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (made) {
    return (
      <div className="space-y-3">
        <p className="font-black text-leaf">Your account is ready{made.className ? `, and you joined ${made.className}` : ""}! 🎉</p>
        <WriteThisDown rows={[["Username", made.username], ["Password", made.password]]} />
      </div>
    );
  }
  const switchTo = (m: typeof mode) => {
    setMode(m);
    setError("");
    setPassword("");
  };
  const tab = (m: typeof mode, label: string) => (
    <button type="button" onClick={() => switchTo(m)} className={`btn py-1.5 text-sm ${mode === m || (m === "in" && mode === "code") ? "btn-soil" : "btn-ghost"}`}>{label}</button>
  );
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex gap-2">
        {tab("up", "Make an account")}
        {tab("in", "Sign in")}
      </div>
      {mode === "code" ? (
        <>
          <p className="text-xs text-muted">Joined with a class code before? Sign in the old way, then pick a username.</p>
          <Field label="Class code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC234" autoComplete="off" required maxLength={8} />
          <Field label="Your name in the class" value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="off" required maxLength={24} />
          <Field label="Login words" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="otter-maple-river-42" autoComplete="off" required />
        </>
      ) : (
        <>
          <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="sprout42" autoComplete="username" required maxLength={USERNAME_MAX} />
          {mode === "up" && (
            <Field label="Name other players see (optional)" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={username || "Your first name or a nickname"} autoComplete="off" maxLength={24} />
          )}
          <PasswordField value={password} onChange={setPassword} autoComplete={mode === "up" ? "new-password" : "current-password"} />
          {mode === "up" && (
            <>
              <Field label="Class code (optional)" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Add it now or later" autoComplete="off" maxLength={8} />
              <p className="text-xs text-muted">No email needed. Use a made-up username and only your first name or a nickname: never your last name, email, or anything private.</p>
            </>
          )}
        </>
      )}
      {error && <p className="rounded-xl bg-danger/10 p-2 text-sm font-bold text-danger">{error}</p>}
      <button className="btn btn-primary w-full" disabled={busy}>{busy ? "One moment…" : mode === "up" ? "Make my account" : "Sign in"}</button>
      {mode !== "up" && (
        <button type="button" className="w-full text-center text-xs text-muted underline" onClick={() => switchTo(mode === "code" ? "in" : "code")}>
          {mode === "code" ? "Sign in with a username instead" : "I joined with a class code"}
        </button>
      )}
    </form>
  );
}

/** A student's classes: add one with its code, or leave one. */
function StudentClasses() {
  const session = useAccount((s) => s.session)!;
  const [classes, setClasses] = useState<{ id: string; name: string; nickname: string }[]>([]);
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(async () => {
    const { data } = await supabase()!.from("class_members").select("class_id, nickname, classes(name)").eq("student_id", session.user.id);
    setClasses((data ?? []).map((m) => ({ id: m.class_id as string, nickname: m.nickname as string, name: (m.classes as unknown as { name: string } | null)?.name ?? "" })));
  }, [session]);
  useEffect(() => {
    void load();
  }, [load]);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase()!.rpc("join_class", { p_code: code, p_nickname: nickname || null });
    if (error) {
      const m = error.message;
      setMsg({ ok: false, text: m.includes("no such class") ? "No class has that code. Check it with your teacher." : m.includes("nickname taken") ? "Someone in that class already uses that name. Type a different name to use there." : m.includes("teachers") ? "Teacher accounts make classes instead of joining them." : "Couldn't add the class. Try again." });
      return;
    }
    setMsg({ ok: true, text: `You joined ${(data as { name: string }).name}! 🎉` });
    setCode("");
    setNickname("");
    void load();
  };
  const leave = async (c: { id: string; name: string }) => {
    if (!confirm(`Leave ${c.name}? Your farm stays in your account.`)) return;
    await supabase()!.from("class_members").delete().eq("class_id", c.id).eq("student_id", session.user.id);
    void load();
  };
  return (
    <section className="space-y-2 rounded-xl bg-paper p-3">
      <h3 className="font-black">🏫 Your classes</h3>
      {classes.length ? (
        <ul className="space-y-1 text-sm">
          {classes.map((c) => (
            <li key={c.id} className="flex items-center gap-2">
              <span className="mr-auto"><b>{c.name}</b> <span className="text-muted">as {c.nickname}</span></span>
              <button className="btn btn-ghost px-2 py-0.5 text-xs" onClick={() => void leave(c)}>Leave</button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">You&apos;re not in a class yet. Got a code from your teacher? Add it here.</p>}
      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-bold">Class code<input className={`${field} mt-0.5 w-28 py-1 uppercase`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC234" maxLength={8} required /></label>
        <label className="min-w-0 flex-1 text-xs font-bold">Name in the class (optional)<input className={`${field} mt-0.5 py-1`} value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={24} /></label>
        <button className="btn btn-primary py-1.5 text-sm">Add class</button>
      </form>
      {msg && <p className={`text-sm font-bold ${msg.ok ? "text-leaf" : "text-danger"}`}>{msg.text}</p>}
    </section>
  );
}

/** Older class-code accounts pick a username, so they can sign in without the class code. */
function PickUsername() {
  const session = useAccount((s) => s.session)!;
  const refreshProfile = useAccount((s) => s.refreshProfile);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bad = checkUsername(username);
    if (bad) return setError(bad);
    const r = await fetch("/api/students/username", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ username }) });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return setError(data.error ?? "Couldn't save your username.");
    setError("");
    await refreshProfile();
  };
  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border-2 border-sun bg-sun/10 p-3">
      <p className="text-sm font-bold">Pick a username, so you can sign in without your class code. Your password stays your login words.</p>
      <div className="flex gap-2">
        <input className={`${field} py-1`} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="sprout42" maxLength={USERNAME_MAX} aria-label="New username" />
        <button className="btn btn-primary py-1.5 text-sm">Save</button>
      </div>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </form>
  );
}

/** Change your password (students can use new easy login words). */
function ChangePassword() {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!open) return <button className="text-xs text-muted underline" onClick={() => setOpen(true)}>Change password</button>;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bad = checkPassword(password);
    if (bad) return setMsg({ ok: false, text: bad });
    const { error } = await supabase()!.auth.updateUser({ password });
    setMsg(error ? { ok: false, text: "Couldn't change it. Try again." } : { ok: true, text: `Saved! Your new password is: ${password}` });
  };
  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl bg-paper p-3">
      <PasswordField value={password} onChange={setPassword} label="New password" autoComplete="new-password" />
      <button className="btn btn-primary py-1.5 text-sm">Save new password</button>
      {msg && <p className={`text-sm font-bold ${msg.ok ? "text-leaf" : "text-danger"}`}>{msg.text}</p>}
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
  const statusText = { off: "Not syncing", syncing: "Saving…", saved: "Saved to your account", error: "Couldn't reach the cloud. We'll try again." }[status];
  return (
    <div className="card space-y-4 p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-muted">{profile?.role === "teacher" ? "Teacher" : "Student"}</p>
        <p className="font-display text-2xl font-black">{profile?.display_name || session.user.email}</p>
      </div>
      {profile?.role === "student" && (
        <>
          {profile.username ? <p className="text-sm text-muted">Username: <b className="font-mono text-ink">{profile.username}</b></p> : <PickUsername />}
          <StudentClasses />
        </>
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
      <ChangePassword />
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
