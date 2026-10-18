import { normalizeUsername } from "@/lib/accounts";
import { adminClient, anonClient, json, normalizeCode, normalizeNickname, normalizeWords, NOT_SET_UP } from "@/lib/supabaseServer";

/**
 * A student signs in with their username and password, or (if they joined the older way) with
 * their class code, nickname, and login words. Returns a session.
 */
export async function POST(req: Request) {
  const admin = adminClient();
  const anon = anonClient();
  if (!admin || !anon) return json(NOT_SET_UP, 503);
  const body = await req.json().catch(() => ({}));

  let studentId: string | null = null;
  let password = "";
  if (body.username !== undefined) {
    const wrong = json({ error: "That username and password don't match. Your teacher can give you new login words." }, 401);
    const username = normalizeUsername(String(body.username ?? ""));
    password = String(body.password ?? "");
    if (!username || !password) return wrong;
    const { data: profile } = await admin.from("profiles").select("id").eq("username", username).eq("role", "student").maybeSingle();
    if (!profile) return wrong;
    studentId = profile.id;
  } else {
    const wrong = json({ error: "That doesn't match. Check your class code, name, and login words." }, 401);
    const code = normalizeCode(String(body.code ?? ""));
    const nickname = normalizeNickname(String(body.nickname ?? ""));
    password = normalizeWords(String(body.words ?? ""));
    if (!code || !nickname || !password) return wrong;
    const { data: cls } = await admin.from("classes").select("id").eq("join_code", code).maybeSingle();
    if (!cls) return wrong;
    const { data: member } = await admin.from("class_members").select("student_id").eq("class_id", cls.id).ilike("nickname", nickname).maybeSingle();
    if (!member) return wrong;
    studentId = member.student_id;
  }

  const fail = json({ error: "That doesn't match. Check what you typed and try again." }, 401);
  const { data: user } = await admin.auth.admin.getUserById(studentId!);
  if (!user.user?.email) return fail;
  let { data, error } = await anon.auth.signInWithPassword({ email: user.user.email, password });
  // Login words are forgiving about case and spaces; try them tidied up too.
  if ((error || !data.session) && body.username !== undefined && /\s|[A-Z]/.test(password)) {
    ({ data, error } = await anon.auth.signInWithPassword({ email: user.user.email, password: normalizeWords(password) }));
  }
  if (error || !data.session) return fail;
  return json({ session: { access_token: data.session.access_token, refresh_token: data.session.refresh_token } });
}
