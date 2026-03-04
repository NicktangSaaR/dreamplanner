import StageEngine from "./StageEngine";
import QuarterEngine from "./QuarterEngine";
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
      <QuarterEngine studentId={studentId} readOnly={readOnly} />
      <SharedFolderSection studentId={studentId} />
    </div>
  );
}
