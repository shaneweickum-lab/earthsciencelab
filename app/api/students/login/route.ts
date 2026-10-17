import { adminClient, anonClient, json, normalizeCode, normalizeNickname, normalizeWords, NOT_SET_UP } from "@/lib/supabaseServer";

/** A student signs in with their class code, nickname, and login words. Returns a session. */
export async function POST(req: Request) {
  const admin = adminClient();
  const anon = anonClient();
  if (!admin || !anon) return json(NOT_SET_UP, 503);
  const body = await req.json().catch(() => ({}));
  const code = normalizeCode(String(body.code ?? ""));
  const nickname = normalizeNickname(String(body.nickname ?? ""));
  const words = normalizeWords(String(body.words ?? ""));
  const wrong = json({ error: "That doesn't match. Check your class code, name, and login words." }, 401);
  if (!code || !nickname || !words) return wrong;

  const { data: cls } = await admin.from("classes").select("id").eq("join_code", code).maybeSingle();
  if (!cls) return wrong;
  const { data: member } = await admin.from("class_members").select("student_id").eq("class_id", cls.id).ilike("nickname", nickname).maybeSingle();
  if (!member) return wrong;
  const { data: user } = await admin.auth.admin.getUserById(member.student_id);
  if (!user.user?.email) return wrong;
  const { data, error } = await anon.auth.signInWithPassword({ email: user.user.email, password: words });
  if (error || !data.session) return wrong;
  return json({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
}
