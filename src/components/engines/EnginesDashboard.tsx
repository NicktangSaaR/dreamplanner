import StageEngine from "./StageEngine";
import QuarterEngine from "./QuarterEngine";
import EvaluationEngine from "./EvaluationEngine";
import SharedFolderSection from "@/components/college-planning/student-summary/SharedFolderSection";

interface EnginesDashboardProps {
  studentId: string;
  grade?: string | null;
  readOnly?: boolean;
}

export default function EnginesDashboard({ studentId, grade, readOnly = false }: EnginesDashboardProps) {
  return (
    <div className="space-y-6">
      <StageEngine studentId={studentId} grade={grade} readOnly={readOnly} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuarterEngine studentId={studentId} readOnly={readOnly} />
        <EvaluationEngine studentId={studentId} readOnly={readOnly} />
      </div>
      <SharedFolderSection studentId={studentId} />
    </div>
  );
}
