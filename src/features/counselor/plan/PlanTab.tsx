import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStudentPhase } from "@/components/engines/hooks/useStudentPhase";
import QuarterCard from "./QuarterCard";
import ReportsTimeline, { type ReportRequest } from "./ReportsTimeline";
import StageRow from "./StageRow";
import { db, type PlanDoc } from "./planData";

/**
 * Counselor "规划" tab, ordered by how the work happens:
 * this quarter (goals + meetings) → current stage and plan → reports.
 */
export default function PlanTab({ studentId, studentName }: { studentId: string; studentName: string }) {
  const { phase } = useStudentPhase(studentId);
  const phaseKey = phase?.current_phase || "exploration";
  const [reportRequest, setReportRequest] = useState<ReportRequest>(null);

  const docsQuery = useQuery({
    queryKey: ["plan-docs", studentId],
    queryFn: async () => {
      const { data, error } = await db
        .from("planning_documents")
        .select("id, title, content, file_path, file_name, phase, is_primary, source_url, created_at, updated_at")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as PlanDoc[];
    },
  });
  const docs = docsQuery.data || [];
  const currentDoc = docs.find((d) => d.is_primary) || docs[0] || null;

  return (
    <div className="space-y-5">
      <QuarterCard
        studentId={studentId}
        phase={phaseKey}
        docs={docs}
        currentDoc={currentDoc}
        onWriteQuarterlyReport={(q) => setReportRequest({ kind: "quarterly", quarter: q, nonce: Date.now() })}
      />
      <StageRow studentId={studentId} docs={docs} currentDoc={currentDoc} onDocsChanged={() => docsQuery.refetch()} />
      <ReportsTimeline studentId={studentId} studentName={studentName} phase={phaseKey} request={reportRequest} />
    </div>
  );
}
