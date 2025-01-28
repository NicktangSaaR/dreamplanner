import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

interface StudentCardProps {
  student: {
    id: string;
    full_name: string | null;
    grade: string | null;
    school: string | null;
    interested_majors: string[] | null;
  };
}

export default function StudentCard({ student }: StudentCardProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{student.full_name}</h3>
              <p className="text-sm text-muted-foreground">
                {student.grade || "Grade not set"} • {student.school || "School not set"}
              </p>
              {student.interested_majors && student.interested_majors.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Interested in: {student.interested_majors.join(", ")}
                </p>
              )}
            </div>
          </div>
          <Button 
            onClick={() => navigate(`/counselor-dashboard/student/summary/${student.id}`)}
          >
            View Summary
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}