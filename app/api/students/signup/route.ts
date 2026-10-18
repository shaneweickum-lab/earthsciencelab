import { randomUUID } from "node:crypto";
import { checkPassword, checkUsername, normalizeUsername } from "@/lib/accounts";
import { adminClient, anonClient, json, normalizeCode, normalizeNickname, NOT_SET_UP } from "@/lib/supabaseServer";

/**
 * A student makes an account with a username and password (no email). A class code is optional:
 * classes can be added later from the account page. Returns a session.
 */
export async function POST(req: Request) {
  const admin = adminClient();
  const anon = anonClient();
  if (!admin || !anon) return json(NOT_SET_UP, 503);
  const body = await req.json().catch(() => ({}));
  const username = normalizeUsername(String(body.username ?? ""));
  const password = String(body.password ?? "");
  const displayName = normalizeNickname(String(body.displayName ?? "")) || username;
  const code = normalizeCode(String(body.code ?? ""));
  const bad = checkUsername(username) ?? checkPassword(password);
  if (bad) return json({ error: bad }, 400);

  const { data: taken } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken) return json({ error: `“${username}” is taken. Try adding a number.` }, 409);
  let cls: { id: string; name: string } | null = null;
  if (code) {
    const { data } = await admin.from("classes").select("id, name").eq("join_code", code).maybeSingle();
    if (!data) return json({ error: "No class has that code. Check it with your teacher, or leave it empty and add it later." }, 404);
    cls = data;
    const { data: nick } = await admin.from("class_members").select("student_id").eq("class_id", cls.id).ilike("nickname", displayName).maybeSingle();
    if (nick) return json({ error: `Someone in ${cls.name} already goes by “${displayName}”. Change the name others see.` }, 409);
  }

  const email = `u-${randomUUID()}@students.earthsciencelab.app`;
  const made = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    app_metadata: { role: "student" }, user_metadata: { display_name: displayName },
  });
  if (made.error || !made.data.user) return json({ error: "Couldn't make your account. Try again." }, 500);
  const id = made.data.user.id;
  const profile = await admin.from("profiles").upsert({ id, role: "student", display_name: displayName, username });
  if (profile.error) {
    await admin.auth.admin.deleteUser(id);
    return json({ error: profile.error.code === "23505" ? `“${username}” is taken. Try adding a number.` : "Couldn't make your account. Try again." }, profile.error.code === "23505" ? 409 : 500);
  }
  if (cls) await admin.from("class_members").insert({ class_id: cls.id, student_id: id, nickname: displayName });

  const { data, error } = await anon.auth.signInWithPassword({ email, password });
  if (error || !data.session) return json({ error: "Your account is ready, but signing in failed. Try signing in." }, 500);
  return json({ username, displayName, className: cls?.name ?? null, session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
}
