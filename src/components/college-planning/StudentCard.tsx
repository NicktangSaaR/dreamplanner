import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, School, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  const handleViewDashboard = () => {
    console.log("Navigating to student dashboard:", student.id);
    navigate(`/college-planning/student/${student.id}`);
  };

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{student.full_name}</span>
          <Button variant="default" onClick={handleViewDashboard}>
            View Dashboard
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Grade: {student.grade || 'Not set'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <School className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              School: {student.school || 'Not set'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Interested in: {student.interested_majors?.join(', ') || 'Not set'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}