"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAccount } from "@/store/account";

interface ClassRow {
  id: string;
  name: string;
  grade_level: string;
  join_code: string;
}

interface StudentRow {
  class_id: string;
  student_id: string;
  nickname: string;
  username: string | null;
  farm_day: number | null;
  coins: number | null;
  harvests: number | null;
  journal_pages: number | null;
  xp: number | null;
  updated_at: string | null;
}

const GRADES = [["elementary", "Elementary (K-5)"], ["middle", "Middle (6-8)"], ["high", "High (9-12)"]] as const;

function ago(iso: string | null) {
  if (!iso) return "never";
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 2) return "just now";
  if (min < 60) return `${min} min ago`;
  if (min < 60 * 36) return `${Math.round(min / 60)} h ago`;
  return new Date(iso).toLocaleDateString();
}

function ClassCard({ c, students, onChange }: { c: ClassRow; students: StudentRow[]; onChange: () => void }) {
  const session = useAccount((s) => s.session)!;
  const [words, setWords] = useState<Record<string, string>>({});

  const reset = async (s: StudentRow) => {
    if (!confirm(`Give ${s.nickname} new login words? Their old ones stop working.`)) return;
    const r = await fetch("/api/students/reset", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ classId: c.id, studentId: s.student_id }),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) setWords((w) => ({ ...w, [s.student_id]: data.words }));
    else alert(data.error ?? "Couldn't change the login words.");
  };
  const remove = async (s: StudentRow) => {
    if (!confirm(`Remove ${s.nickname} from ${c.name}? Their farm stays in their account.`)) return;
    await supabase()!.from("class_members").delete().eq("class_id", c.id).eq("student_id", s.student_id);
    onChange();
  };
  const removeClass = async () => {
    if (!confirm(`Delete ${c.name}? Students keep their accounts and farms, but leave the class.`)) return;
    await supabase()!.from("classes").delete().eq("id", c.id);
    onChange();
  };

  return (
    <section className="card p-5">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <h2 className="font-display text-2xl font-black">{c.name}</h2>
          <p className="text-sm text-muted">{GRADES.find(([g]) => g === c.grade_level)?.[1]} · {students.length} student{students.length === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-2xl bg-paper px-4 py-2 text-center">
          <p className="text-[10px] font-black uppercase tracking-wider text-muted">Join code</p>
          <p className="font-mono text-2xl font-black tracking-[0.25em]">{c.join_code}</p>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">
        Students make an account at <b>{typeof location !== "undefined" ? location.host : ""}/account</b> (a username and password, no email), then add this code under <b>Your classes</b>. They can also type it while making their account.
      </p>
      {students.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-muted">
              <tr><th className="py-1 pr-3">Student</th><th className="pr-3">XP</th><th className="pr-3">Farm day</th><th className="pr-3">Harvests</th><th className="pr-3">Journal</th><th className="pr-3">Last played</th><th /></tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student_id} className="border-t border-line align-top">
                  <td className="py-2 pr-3 font-bold">
                    {s.nickname}
                    {s.username && <span className="block font-mono text-xs font-normal text-muted">{s.username}</span>}
                    {words[s.student_id] && <p className="font-mono text-xs font-black text-soil">New words: {words[s.student_id]}</p>}
                  </td>
                  <td className="pr-3">{s.xp ?? "–"}</td>
                  <td className="pr-3">{s.farm_day ?? "–"}</td>
                  <td className="pr-3">{s.harvests ?? "–"}</td>
                  <td className="pr-3">{s.journal_pages ?? "–"}</td>
                  <td className="pr-3 text-muted">{ago(s.updated_at)}</td>
                  <td className="whitespace-nowrap py-1 text-right">
                    <button className="btn btn-ghost px-2 py-0.5 text-xs" onClick={() => void reset(s)}>New login words</button>
                    <button className="btn btn-ghost ml-1 px-2 py-0.5 text-xs" onClick={() => void remove(s)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button className="mt-4 text-xs font-bold text-muted underline" onClick={() => void removeClass()}>Delete this class</button>
    </section>
  );
}

export function TeacherDashboard() {
  const session = useAccount((s) => s.session);
  const profile = useAccount((s) => s.profile);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("middle");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const db = supabase();
    if (!db || !session) return;
    const [c, s] = await Promise.all([
      db.from("classes").select("id, name, grade_level, join_code").eq("teacher_id", session.user.id).order("created_at"),
      db.from("class_progress").select("*").order("nickname"),
    ]);
    setClasses((c.data as ClassRow[]) ?? []);
    setStudents((s.data as StudentRow[]) ?? []);
  }, [session]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const { error: err } = await supabase()!.from("classes").insert({ teacher_id: session!.user.id, name: name.trim(), grade_level: grade });
    if (err) setError(err.message);
    else {
      setName("");
      void load();
    }
  };

  if (!session || profile?.role !== "teacher") {
    return (
      <div className="card p-6">
        <h1 className="font-display text-3xl font-black">Your classes</h1>
        <p className="mt-2 text-muted">{session ? "This page is for teacher accounts." : "Sign in with your teacher account to see your classes."}</p>
        <Link href="/account" className="btn btn-primary mt-4">Go to sign in</Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.2em] text-soil">Teacher</p>
        <h1 className="font-display text-4xl font-black">Your classes</h1>
        <p className="text-muted">Make a class, share its join code, and watch everyone&apos;s progress. Students never need an email address.</p>
      </header>
      <form onSubmit={create} className="card flex flex-wrap items-end gap-3 p-5">
        <label className="block flex-1 text-sm font-bold">
          New class
          <input className="mt-1 w-full rounded-xl border-2 border-line bg-card px-3 py-2 font-semibold outline-none focus:border-sky" value={name} onChange={(e) => setName(e.target.value)} placeholder="3rd period Earth Science" required maxLength={80} />
        </label>
        <label className="block text-sm font-bold">
          Grade level
          <select className="mt-1 block rounded-xl border-2 border-line bg-card px-3 py-2 font-semibold" value={grade} onChange={(e) => setGrade(e.target.value)}>
            {GRADES.map(([g, label]) => <option key={g} value={g}>{label}</option>)}
          </select>
        </label>
        <button className="btn btn-primary">Make class</button>
        {error && <p className="w-full text-sm font-bold text-danger">{error}</p>}
      </form>
      {classes.length === 0 && <p className="text-center text-muted">No classes yet.</p>}
      {classes.map((c) => <ClassCard key={c.id} c={c} students={students.filter((s) => s.class_id === c.id)} onChange={() => void load()} />)}
    </div>
  );
}
