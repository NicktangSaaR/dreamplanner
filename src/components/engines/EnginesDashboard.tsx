import StageEngine from "./StageEngine";
import QuarterEngine from "./QuarterEngine";
import PlanningReports from "./PlanningReports";
import SharedFolderSection from "@/components/college-planning/student-summary/SharedFolderSection";
import { PlanningDocumentSection } from "@/components/college-planning/google-drive";
import { useStudentPhase } from "./hooks/useStudentPhase";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EnginesDashboardProps {
  studentId: string;
  grade?: string | null;
  readOnly?: boolean;
}

export default function EnginesDashboard({ studentId, grade, readOnly = false }: EnginesDashboardProps) {
  const { phase } = useStudentPhase(studentId);
  const currentPhase = phase?.current_phase || "exploration";

  const { data: studentProfile } = useQuery({
    queryKey: ["student-name", studentId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("id", studentId).single();
      return data;
    },
    enabled: !!studentId,
  });

  return (
    <div className="space-y-6">
      <StageEngine studentId={studentId} grade={grade} readOnly={readOnly} />
      
      {/* Planning Documents */}
      <PlanningDocumentSection studentId={studentId} currentPhase={currentPhase} />
      
      {/* Quarter Engine */}
      <QuarterEngine studentId={studentId} currentPhase={currentPhase} readOnly={readOnly} />

      {/* Planning Reports */}
      <PlanningReports
        studentId={studentId}
        studentName={studentProfile?.full_name || undefined}
        currentPhase={currentPhase}
      />

      <SharedFolderSection studentId={studentId} />
    </div>
  );
}
