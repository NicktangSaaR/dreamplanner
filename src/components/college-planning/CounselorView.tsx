import { useProfile } from "@/hooks/useProfile";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import AddStudentDialog from "./AddStudentDialog";
import StudentCard from "./StudentCard";

export default function CounselorView() {
  const { profile } = useProfile();
  const { data: students, isLoading, refetch } = useCounselorStudents();
  const navigate = useNavigate();

  console.log("Counselor profile:", profile);
  console.log("Students data:", students);

  if (!profile || profile.user_type !== 'counselor') {
    console.log("Not a counselor or no profile found");
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Students</h2>
        <AddStudentDialog counselorId={profile.id} onStudentAdded={refetch} />
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 gap-4">
            {students?.map((relationship) => (
              <StudentCard
                key={relationship.student_id}
                student={relationship.students!}
                onClick={() => navigate(`/student/${relationship.student_id}/college-planning`)}
              />
            ))}
            {students?.length === 0 && (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">
                    No students found. Add students to get started.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}