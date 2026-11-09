import { supabase } from "@/integrations/supabase/client";
import type { ResumeData } from "@/components/admin/resume/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export type ResumeContext = {
  applicantType: "undergrad" | "graduate";
  gradDegree: "masters" | "mba" | null;
  gradStatus: string | null;
  fullName: string;
  email: string;
  school: string;
  website: string;
};

export const emptyResume = (): ResumeData => ({
  full_name: "", email: "", phone: "", address: "", linkedin_url: "", personal_website: "",
  education: [], work_experience: [], activities: [], awards: [], skills: [], certifications: [], projects: [], languages: [],
});

/** What the system already knows about the student (from their profile). */
export async function loadResumeContext(studentId: string): Promise<ResumeContext> {
  const { data } = await db.from("profiles").select("*").eq("id", studentId).maybeSingle();
  const p = (data || {}) as Record<string, unknown>;
  const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : "");
  return {
    applicantType: p.applicant_type === "graduate" ? "graduate" : "undergrad",
    gradDegree: p.grad_degree === "mba" || p.grad_degree === "masters" ? (p.grad_degree as "mba" | "masters") : null,
    gradStatus: s("grad_status") || null,
    fullName: s("full_name"),
    email: s("email"),
    school: s("school"),
    website: s("personal_website"),
  };
}

/** Fill only the empty personal fields (and a first education row) from the profile. */
export function prefillFromProfile(form: ResumeData, ctx: ResumeContext): { form: ResumeData; filled: string[] } {
  const filled: string[] = [];
  const next = { ...form };
  if (!next.full_name && ctx.fullName) { next.full_name = ctx.fullName; filled.push("full_name"); }
  if (!next.email && ctx.email) { next.email = ctx.email; filled.push("email"); }
  if (!next.personal_website && ctx.website) { next.personal_website = ctx.website; filled.push("personal_website"); }
  if (next.education.length === 0 && ctx.school) {
    const degree = ctx.applicantType === "graduate"
      ? (ctx.gradStatus === "masters" ? "Master's (in progress)" : "Bachelor's")
      : "High School";
    next.education = [{ school: ctx.school, degree, field: "", startDate: "", endDate: "", gpa: "", description: "" }];
    filled.push("education");
  }
  return { form: next, filled };
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Coerce AI output into the form shape. */
export function normalizeImported(raw: Record<string, unknown>, graduate: boolean): ResumeData {
  const r = raw || {};
  const pick = <T,>(list: unknown, keys: string[]): T[] =>
    arr<Record<string, unknown>>(list).map((o) => Object.fromEntries(keys.map((k) => [k, str(o?.[k])])) as unknown as T);
  const projects = arr<Record<string, unknown>>(r.projects).map((o) => ({
    name: str(o.name), role: str(o.role), startDate: str(o.startDate), endDate: str(o.endDate),
    description: str(o.description), technologies: arr<string>(o.technologies).filter((t) => typeof t === "string"),
  }));
  const activities = pick<ResumeData["activities"][number]>(r.activities, ["name", "role", "startDate", "endDate", "description"]);
  return {
    full_name: str(r.full_name), email: str(r.email), phone: str(r.phone), address: str(r.address),
    linkedin_url: str(r.linkedin_url), personal_website: str(r.personal_website),
    education: pick<ResumeData["education"][number]>(r.education, ["school", "degree", "field", "startDate", "endDate", "gpa", "description"]),
    work_experience: pick<ResumeData["work_experience"][number]>(r.work_experience, ["company", "position", "startDate", "endDate", "description"]),
    // Graduate resumes have no activities section: anything the AI still put there becomes a project.
    activities: graduate ? [] : activities,
    projects: graduate
      ? [...projects, ...activities.map((a) => ({ name: a.name, role: a.role, startDate: a.startDate, endDate: a.endDate, description: a.description, technologies: [] }))]
      : projects,
    awards: pick<ResumeData["awards"][number]>(r.awards, ["name", "issuer", "date", "description"]),
    skills: arr<string>(r.skills).filter((x) => typeof x === "string" && x.trim()),
    certifications: arr<string>(r.certifications).filter((x) => typeof x === "string" && x.trim()),
    languages: pick<ResumeData["languages"][number]>(r.languages, ["language", "proficiency"]),
  };
}

/** Imported content wins; personal fields the resume lacks keep what the form/profile had. */
export function mergeImported(current: ResumeData, imported: ResumeData): ResumeData {
  const keep = (a: string, b: string) => a.trim() || b;
  return {
    ...imported,
    full_name: keep(imported.full_name, current.full_name),
    email: keep(imported.email, current.email),
    phone: keep(imported.phone, current.phone),
    address: keep(imported.address, current.address),
    linkedin_url: keep(imported.linkedin_url, current.linkedin_url),
    personal_website: keep(imported.personal_website, current.personal_website),
    education: imported.education.length ? imported.education : current.education,
  };
}

export class ResumeUploadError extends Error {}

/** Store the file under <student>/… and let the AI read it into form fields. */
export async function uploadAndImport(studentId: string, file: File, ctx: ResumeContext): Promise<{ path: string; data: ResumeData }> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (!["pdf", "docx", "txt"].includes(ext)) throw new ResumeUploadError("type");
  if (file.size > 10 * 1024 * 1024) throw new ResumeUploadError("size");
  const path = `${studentId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("resume-uploads").upload(path, file, { upsert: false });
  if (upErr) throw upErr;
  const { data, error } = await supabase.functions.invoke("resume-import", {
    body: { student_id: studentId, file_path: path, applicant_type: ctx.applicantType },
  });
  if (error || !data?.data) throw new ResumeUploadError(data?.error === "empty" ? "empty" : "read");
  return { path, data: normalizeImported(data.data, ctx.applicantType === "graduate") };
}

export async function optimizeResume(form: ResumeData, ctx: ResumeContext, language: "en" | "zh"): Promise<string> {
  const { data, error } = await supabase.functions.invoke("generate-resume", {
    body: { resumeData: form, applicantType: ctx.applicantType, gradDegree: ctx.gradDegree, language },
  });
  if (error || !data?.resume) throw new Error(data?.error || error?.message || "generate failed");
  return data.resume as string;
}

export async function downloadOriginal(path: string) {
  const { data, error } = await supabase.storage.from("resume-uploads").download(path);
  if (error) throw error;
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = `resume-original.${path.split(".").pop()}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
