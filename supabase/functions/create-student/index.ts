// Create a student account for someone who hasn't signed up themselves.
// Counselors (verified) and admins only.
//
// POST { full_name, username, password?, email?, grade?, counselor_id? }
//   -> { username, password? }   (password is returned only when generated here)
//
// The student logs in with the username; their auth email is
// <username>@student.dreamplaneredu.com, an internal address. A real email,
// if given, is kept in profiles.email for password reset. The student is
// linked to the counselor and asked to complete their profile on first login.
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

export const STUDENT_DOMAIN = "student.dreamplaneredu.com";
const USERNAME = /^[a-z0-9][a-z0-9._-]{2,29}$/;
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const GRADES = ["G7", "G8", "Pre-9", "G9", "G10", "G11", "G12", "Transfer"];

/** 10 characters, no look-alikes (0/O, 1/l/I). */
function makePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: { user: caller } } = await asCaller.auth.getUser();
  if (!caller) return json({ error: "请先登录" }, 401);
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data: me } = await admin.from("profiles").select("user_type, is_verified").eq("id", caller.id).maybeSingle();
  const isAdmin = me?.user_type === "admin";
  if (!isAdmin && !(me?.user_type === "counselor" && me.is_verified)) return json({ error: "只有顾问和管理员可以创建学生账号" }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  const fullName = String(body.full_name ?? "").trim();
  const username = String(body.username ?? "").trim().toLowerCase();
  const email = String(body.email ?? "").trim().toLowerCase();
  const grade = GRADES.includes(String(body.grade)) ? String(body.grade) : undefined;
  const given = String(body.password ?? "");
  if (!fullName) return json({ error: "请填写学生姓名" }, 400);
  if (!USERNAME.test(username)) return json({ error: "用户名需要 3–30 位，只能用小写字母、数字和 . _ -，并以字母或数字开头" }, 400);
  if (email && !EMAIL.test(email)) return json({ error: "邮箱格式不对" }, 400);
  if (given && given.length < 8) return json({ error: "密码至少 8 位" }, 400);

  // counselors create for themselves; admins may name a counselor
  let counselorId = caller.id;
  if (isAdmin && typeof body.counselor_id === "string" && body.counselor_id) {
    const { data: c } = await admin.from("profiles").select("id").eq("id", body.counselor_id).eq("user_type", "counselor").maybeSingle();
    if (!c) return json({ error: "找不到这位顾问" }, 400);
    counselorId = c.id;
  }

  const { data: taken } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (taken) return json({ error: "这个用户名已经有人用了，换一个吧" }, 409);
  if (email) {
    const { data: same } = await admin.from("profiles").select("id").ilike("email", email).maybeSingle();
    if (same) return json({ error: "这个邮箱已经有账号了。请让学生用这个邮箱登录，在主页选择你作为顾问。" }, 409);
  }

  const password = given || makePassword();
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: `${username}@${STUDENT_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { user_type: "student", full_name: fullName, ...(grade ? { grade } : {}) },
  });
  if (createErr || !created.user) {
    console.error("create-student createUser", createErr);
    const dup = /already|registered|exists/i.test(createErr?.message ?? "");
    return json({ error: dup ? "这个用户名已经有人用了，换一个吧" : "没能创建账号，请稍后再试" }, dup ? 409 : 500);
  }
  const id = created.user.id;

  // the sign-up trigger made the profile; add what only the server may set
  const { error: profErr } = await admin.from("profiles")
    .update({ username, email: email || null, must_complete_profile: true })
    .eq("id", id);
  const { error: linkErr } = await admin.from("counselor_student_relationships")
    .insert({ counselor_id: counselorId, student_id: id, added_by: caller.id });
  if (profErr || linkErr) {
    console.error("create-student follow-up", profErr, linkErr);
    await admin.auth.admin.deleteUser(id); // don't leave a half-made account
    return json({ error: "没能创建账号，请稍后再试" }, 500);
  }

  return json({ username, ...(given ? {} : { password }) });
});
