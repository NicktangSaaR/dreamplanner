import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { StudentProfile } from "./types/student-management";

interface StudentCardProps {
  student: StudentProfile;
}

export default function StudentCard({ student }: StudentCardProps) {
  const navigate = useNavigate();

  const handleViewStudent = () => {
    console.log("Navigating to student dashboard:", student.id);
    navigate(`/counselor/student/${student.id}`);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">{student.full_name}</h3>
            <p className="text-sm text-muted-foreground">
              {student.grade ? `Grade ${student.grade}` : 'Grade not set'} • {student.school || 'School not set'}
            </p>
            {student.interested_majors && student.interested_majors.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Interested in: {student.interested_majors.join(', ')}
              </p>
            )}
          </div>
          <Button onClick={handleViewStudent}>View Student</Button>
        </div>
      </CardContent>
    </Card>
  );
}