import { adminClient, json, loginWords, NOT_SET_UP } from "@/lib/supabaseServer";

/** A teacher gives one of their students new login words (for a forgotten password). */
export async function POST(req: Request) {
  const admin = adminClient();
  if (!admin) return json(NOT_SET_UP, 503);
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return json({ error: "Sign in first." }, 401);
  const { data: me } = await admin.auth.getUser(token);
  if (!me.user) return json({ error: "Sign in first." }, 401);
  const body = await req.json().catch(() => ({}));
  const studentId = String(body.studentId ?? "");
  const classId = String(body.classId ?? "");
  const { data: cls } = await admin.from("classes").select("id").eq("id", classId).eq("teacher_id", me.user.id).maybeSingle();
  if (!cls) return json({ error: "That isn't one of your classes." }, 403);
  const { data: member } = await admin.from("class_members").select("student_id").eq("class_id", classId).eq("student_id", studentId).maybeSingle();
  if (!member) return json({ error: "That student isn't in this class." }, 404);
  const words = loginWords();
  const { error } = await admin.auth.admin.updateUserById(studentId, { password: words });
  if (error) return json({ error: "Couldn't change the login words. Try again." }, 500);
  return json({ words });
}
