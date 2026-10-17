import { randomUUID } from "node:crypto";
import { adminClient, anonClient, json, loginWords, normalizeCode, normalizeNickname, NOT_SET_UP } from "@/lib/supabaseServer";

/**
 * A student joins a class with its join code and a nickname. The server makes their account
 * (no email needed) and signs them in. Returns the session and their login words.
 */
export async function POST(req: Request) {
  const admin = adminClient();
  const anon = anonClient();
  if (!admin || !anon) return json(NOT_SET_UP, 503);
  const body = await req.json().catch(() => ({}));
  const code = normalizeCode(String(body.code ?? ""));
  const nickname = normalizeNickname(String(body.nickname ?? ""));
  if (code.length !== 6) return json({ error: "Class codes have 6 letters and numbers." }, 400);
  if (!nickname) return json({ error: "Type your first name or a nickname." }, 400);

  const { data: cls } = await admin.from("classes").select("id, name").eq("join_code", code).maybeSingle();
  if (!cls) return json({ error: "No class has that code. Check it with your teacher." }, 404);
  const { data: taken } = await admin.from("class_members").select("student_id").eq("class_id", cls.id).ilike("nickname", nickname).maybeSingle();
  if (taken) return json({ error: `Someone in ${cls.name} already uses “${nickname}”. Add your last initial, or sign in instead.` }, 409);

  const words = loginWords();
  const email = `s-${randomUUID()}@students.earthsciencelab.app`;
  const made = await admin.auth.admin.createUser({
    email, password: words, email_confirm: true,
    app_metadata: { role: "student" }, user_metadata: { display_name: nickname },
  });
  if (made.error || !made.data.user) return json({ error: "Couldn't make your account. Try again." }, 500);
  const id = made.data.user.id;
  // The profile comes from the sign-up trigger; make sure it exists before joining.
  await admin.from("profiles").upsert({ id, role: "student", display_name: nickname });
  const joined = await admin.from("class_members").insert({ class_id: cls.id, student_id: id, nickname });
  if (joined.error) {
    await admin.auth.admin.deleteUser(id);
    return json({ error: "Couldn't join the class. Try again." }, 500);
  }
  const { data, error } = await anon.auth.signInWithPassword({ email, password: words });
  if (error || !data.session) return json({ error: "Your account is ready, but signing in failed. Sign in with your login words." }, 500);
  return json({ className: cls.name, nickname, words, session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
}
