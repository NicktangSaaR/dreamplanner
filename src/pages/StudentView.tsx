import { useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import CounselorStudentPage from "@/features/counselor/CounselorStudentPage";
import { useStudentRealtime } from "@/hooks/student/useStudentRealtime";

/** One student, as the service team sees it. */
export default function StudentView() {
  const { studentId } = useParams();
  const queryClient = useQueryClient();
  useStudentRealtime(studentId, queryClient);
  if (!studentId) return null;
  return <CounselorStudentPage key={studentId} studentId={studentId} />;
}
