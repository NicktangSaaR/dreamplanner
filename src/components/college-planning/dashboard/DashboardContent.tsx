import { Toaster } from "@/components/ui/toaster";
import StudentHome from "@/features/student-home/StudentHome";

interface DashboardContentProps {
  studentId: string;
}

/** The student's dashboard: one simple page (see StudentHome). */
export default function DashboardContent({ studentId }: DashboardContentProps) {
  return (
    <>
      <Toaster />
      <StudentHome studentId={studentId} />
    </>
  );
}
