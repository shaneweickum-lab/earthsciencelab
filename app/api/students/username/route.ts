import { checkUsername, normalizeUsername } from "@/lib/accounts";
import { adminClient, json, NOT_SET_UP } from "@/lib/supabaseServer";

/** A student who joined with a class code picks a username, to sign in without the class code. */
export async function POST(req: Request) {
  const admin = adminClient();
  if (!admin) return json(NOT_SET_UP, 503);
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return json({ error: "Sign in first." }, 401);
  const { data: me } = await admin.auth.getUser(token);
  if (!me.user) return json({ error: "Sign in first." }, 401);
  const body = await req.json().catch(() => ({}));
  const username = normalizeUsername(String(body.username ?? ""));
  const bad = checkUsername(username);
  if (bad) return json({ error: bad }, 400);
  const { data: profile } = await admin.from("profiles").select("role, username").eq("id", me.user.id).maybeSingle();
  if (profile?.role !== "student") return json({ error: "Teachers sign in with their email." }, 403);
  if (profile.username) return json({ error: `You already have the username “${profile.username}”.` }, 409);
  const { error } = await admin.from("profiles").update({ username }).eq("id", me.user.id);
  if (error) return json({ error: error.code === "23505" ? `“${username}” is taken. Try adding a number.` : "Couldn't save your username. Try again." }, error.code === "23505" ? 409 : 500);
  return json({ username });
}
