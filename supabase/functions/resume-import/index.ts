// Read an uploaded resume (PDF / Word / text) and turn it into the structured
// fields of the resume form.
//
// POST { student_id, file_path, applicant_type?: "undergrad" | "graduate" }
//   file_path is an object in the resume-uploads bucket under <student_id>/.
//   Returns { data: ResumeFields }. Nothing is saved here; the page saves the
//   result into resume_data (so the student or teacher can review it).
//
// Caller must be the student or on the student's service team (or an admin).
import { createClient } from "npm:@supabase/supabase-js@2.49.1";
import JSZip from "npm:jszip@3.10.1";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function docxText(buf: ArrayBuffer): Promise<string> {
  const zip = await JSZip.loadAsync(buf);
  const xml = await zip.file("word/document.xml")?.async("string");
  if (!xml) throw new Error("not a Word document");
  const paras: string[] = [];
  for (const m of xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) {
    const text = [...m[0].matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((t) => t[1]).join("");
    paras.push(text);
  }
  return paras.join("\n")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/\n{3,}/g, "\n\n").trim();
}

function instructions(grad: boolean): string {
  return `You extract resume content into JSON. Copy facts exactly as written (keep the original language, do not invent, translate or embellish anything). Dates as "YYYY-MM" when month is known, "YYYY" otherwise, "" if unknown; use "Present" for ongoing roles.
Return a JSON object with exactly these keys:
{
  "full_name": string, "email": string, "phone": string, "address": string, "linkedin_url": string, "personal_website": string,
  "education": [{ "school": string, "degree": string, "field": string, "startDate": string, "endDate": string, "gpa": string, "description": string }],
  "work_experience": [{ "company": string, "position": string, "startDate": string, "endDate": string, "description": string }],
  ${grad ? "" : `"activities": [{ "name": string, "role": string, "startDate": string, "endDate": string, "description": string }],\n  `}"projects": [{ "name": string, "role": string, "startDate": string, "endDate": string, "description": string, "technologies": string[] }],
  "awards": [{ "name": string, "issuer": string, "date": string, "description": string }],
  "skills": string[], "certifications": string[],
  "languages": [{ "language": string, "proficiency": string }]
}
Put each role's bullet points into its "description", one bullet per line starting with "- ".
${grad
    ? `This is a graduate (master's / MBA) applicant. Jobs and internships go in "work_experience". Research, projects, case competitions, volunteering and leadership roles go in "projects". There is no activities section.`
    : `Jobs and internships go in "work_experience"; research and technical projects in "projects"; clubs, sports, volunteering and other extracurriculars in "activities".`}
Use empty strings / empty arrays for anything not in the resume.`;
}

async function extract(file: { bytes: Uint8Array; name: string; kind: "pdf" | "docx" | "txt" }, grad: boolean): Promise<Record<string, unknown>> {
  const openai = Deno.env.get("OPENAI_API_KEY");
  const deepseek = Deno.env.get("DEEPSEEK_API_KEY");
  const system = instructions(grad);

  if (file.kind === "pdf") {
    if (!openai) throw new Error("PDF reading needs the OpenAI key");
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openai}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: [
              { type: "file", file: { filename: file.name || "resume.pdf", file_data: `data:application/pdf;base64,${toBase64(file.bytes)}` } },
              { type: "text", text: "Extract this resume into the JSON format." },
            ],
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`AI error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const data = await res.json();
    return JSON.parse(data.choices?.[0]?.message?.content || "{}");
  }

  const text = file.kind === "docx"
    ? await docxText(file.bytes.buffer.slice(file.bytes.byteOffset, file.bytes.byteOffset + file.bytes.byteLength) as ArrayBuffer)
    : new TextDecoder("utf-8").decode(file.bytes);
  if (text.trim().length < 20) throw new Error("empty");

  const [url, key, model] = deepseek
    ? ["https://api.deepseek.com/v1/chat/completions", deepseek, "deepseek-chat"]
    : ["https://api.openai.com/v1/chat/completions", openai || "", "gpt-4o-mini"];
  if (!key) throw new Error("No AI API key configured");
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: `Resume text:\n\n${text.slice(0, 20000)}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: userData } = await admin.auth.getUser(token);
  const caller = userData?.user?.id;
  if (!caller) return json({ error: "not signed in" }, 401);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid body" }, 400);
  }
  const studentId = typeof body.student_id === "string" ? body.student_id : "";
  const filePath = typeof body.file_path === "string" ? body.file_path : "";
  if (!studentId || !filePath) return json({ error: "student_id and file_path required" }, 400);
  if (!filePath.startsWith(`${studentId}/`) || filePath.includes("..")) return json({ error: "bad path" }, 400);

  if (caller !== studentId) {
    const [{ data: team }, { data: isAdmin }] = await Promise.all([
      admin.rpc("can_manage_student_team", { viewer_id: caller, p_student_id: studentId }),
      admin.rpc("is_admin", { user_id: caller }),
    ]);
    if (team !== true && isAdmin !== true) return json({ error: "forbidden" }, 403);
  }

  const { data: blob, error: dlErr } = await admin.storage.from("resume-uploads").download(filePath);
  if (dlErr || !blob) return json({ error: "file not found" }, 404);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const lower = filePath.toLowerCase();
  const kind = lower.endsWith(".pdf") ? "pdf" : lower.endsWith(".docx") ? "docx" : lower.endsWith(".txt") ? "txt" : null;
  if (!kind) return json({ error: "unsupported type" }, 400);

  try {
    const data = await extract({ bytes, name: filePath.split("/").pop() || "resume", kind }, body.applicant_type === "graduate");
    return json({ data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("resume-import:", msg);
    return json({ error: msg === "empty" ? "empty" : "read_failed" }, 422);
  }
});
