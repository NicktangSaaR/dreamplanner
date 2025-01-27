import { useProfile } from "@/hooks/useProfile";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, UserPlus, GraduationCap, School, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudentProfile {
  id: string;
  full_name: string | null;
  grade: string | null;
  school: string | null;
  interested_majors: string[] | null;
}

export default function CounselorView() {
  const { profile } = useProfile();
  const { data: students, isLoading } = useCounselorStudents();
  const navigate = useNavigate();

  if (!profile || profile.user_type !== 'counselor') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Students</h2>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="grid grid-cols-1 gap-4">
            {students?.map((relationship) => (
              <Card 
                key={relationship.student_id}
                className="hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/student/${relationship.student_id}/college-planning`)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{relationship.students?.full_name}</span>
                    <Button variant="ghost">View Dashboard</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Grade: {relationship.students?.grade || 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <School className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        School: {relationship.students?.school || 'Not set'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Interested in: {relationship.students?.interested_majors?.join(', ') || 'Not set'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
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