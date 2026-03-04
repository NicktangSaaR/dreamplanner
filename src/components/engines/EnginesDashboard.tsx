import StageEngine from "./StageEngine";
import QuarterEngine from "./QuarterEngine";
import SharedFolderSection from "@/components/college-planning/student-summary/SharedFolderSection";
import { PlanningDocumentSection } from "@/components/college-planning/google-drive";
import { useStudentPhase } from "./hooks/useStudentPhase";

interface EnginesDashboardProps {
  studentId: string;
  grade?: string | null;
  readOnly?: boolean;
}

export default function EnginesDashboard({ studentId, grade, readOnly = false }: EnginesDashboardProps) {
  const { phase } = useStudentPhase(studentId);
  const currentPhase = phase?.current_phase || "exploration";

  return (
    <div className="space-y-6">
      <StageEngine studentId={studentId} grade={grade} readOnly={readOnly} />
      
      {/* Planning Documents + Quarter Engine side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlanningDocumentSection studentId={studentId} currentPhase={currentPhase} />
        <QuarterEngine studentId={studentId} currentPhase={currentPhase} readOnly={readOnly} />
      </div>

      <SharedFolderSection studentId={studentId} />
    </div>
  );
}
