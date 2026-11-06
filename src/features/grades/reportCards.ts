import { supabase } from "@/integrations/supabase/client";

export const REPORT_CARD_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];
export const REPORT_CARD_ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp";
export const REPORT_CARD_MAX_BYTES = 15 * 1024 * 1024;

export type ReportCard = {
  id: string;
  student_id: string;
  uploaded_by: string | null;
  file_path: string | null;
  file_name: string | null;
  mime_type: string | null;
  source: "upload" | "manual";
  period_label: string | null;
  status: "processing" | "ready" | "failed";
  created_at: string;
};

export type UploadRequest = {
  id: string;
  student_id: string;
  due_date: string;
  message: string | null;
  fulfilled_at: string | null;
  created_at: string;
};

// New tables are not in the generated types yet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

export class ReportCardError extends Error {}

/** Store a report card, record it, and ask the server to write the brief. */
export async function uploadReportCard(studentId: string, file: File, periodLabel?: string) {
  if (!REPORT_CARD_TYPES.includes(file.type)) throw new ReportCardError("type");
  if (file.size > REPORT_CARD_MAX_BYTES) throw new ReportCardError("size");

  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${studentId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("academic-reports").upload(path, file, { contentType: file.type });
  if (upErr) throw upErr;

  const { data: row, error } = await db
    .from("academic_reports")
    .insert({
      student_id: studentId,
      file_path: path,
      file_name: file.name.slice(0, 200),
      mime_type: file.type,
      period_label: periodLabel?.trim() || null,
    })
    .select("id")
    .single();
  if (error) {
    await supabase.storage.from("academic-reports").remove([path]);
    throw error;
  }

  // The brief is written in the background; the list refreshes when it is ready.
  void supabase.functions.invoke("academic-report", { body: { action: "analyze", report_id: row.id } });
  return row.id as string;
}

export async function openReportCard(path: string) {
  const { data, error } = await supabase.storage.from("academic-reports").createSignedUrl(path, 120);
  if (error || !data?.signedUrl) throw error || new Error("no url");
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}
