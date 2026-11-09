import { supabase } from "@/integrations/supabase/client";

// Newer tables/columns are not in the generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export {
  QUARTERS, PHASES, GRAD_PHASES, academicYear, currentQuarter, quarterEnd, previousQuarter, parseGoals, newGoalId, fmtDate, todayIso,
} from "@/shared/planning";
export type { QuarterKey, Goal, Phase } from "@/shared/planning";

// ---------------------------------------------------------------- plan documents

export type PlanDoc = {
  id: string;
  title: string;
  content: string | null;
  file_path: string | null;
  file_name: string | null;
  phase: string | null;
  is_primary: boolean | null;
  source_url: string | null;
  created_at: string;
  updated_at: string;
};

export class PlanDocError extends Error {}

/** Store a .docx/.txt plan, extract its text, and record it. Returns the new document id. */
export async function uploadPlanDocument(
  studentId: string,
  file: File,
  phase: string,
  drive?: { fileId: string; url: string; title: string },
): Promise<string> {
  const okTypes = ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
  if (!okTypes.includes(file.type)) throw new PlanDocError("type");
  if (file.size > 10 * 1024 * 1024) throw new PlanDocError("size");

  const ext = file.name.split(".").pop();
  const path = `${studentId}/${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("planning-documents").upload(path, file, { cacheControl: "3600", upsert: true });
  if (upErr) throw upErr;

  const { data: parsed, error: parseErr } = await supabase.functions.invoke("parse-document", { body: { filePath: path, studentId } });
  if (parseErr || parsed?.error) throw new PlanDocError("parse");
  const content: string = parsed?.content || "";

  const { data, error } = await db
    .from("planning_documents")
    .insert({
      student_id: studentId,
      title: drive?.title || file.name.replace(/\.[^/.]+$/, ""),
      file_path: path,
      file_name: file.name,
      content,
      google_doc_id: content,
      is_primary: false,
      phase,
      ...(drive ? { drive_file_id: drive.fileId, source_url: drive.url, last_synced_at: new Date().toISOString() } : {}),
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function setCurrentPlan(docId: string) {
  const { error } = await db.rpc("set_current_plan", { p_doc_id: docId });
  if (error) throw error;
}

export async function openPlanDocument(doc: PlanDoc) {
  if (doc.source_url) {
    window.open(doc.source_url, "_blank", "noopener,noreferrer");
    return;
  }
  if (!doc.file_path) throw new Error("no file");
  const { data, error } = await supabase.storage.from("planning-documents").download(doc.file_path);
  if (error) throw error;
  const url = URL.createObjectURL(data);
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.file_name || "plan";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
