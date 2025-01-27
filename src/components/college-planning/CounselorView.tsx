import { useProfile } from "@/hooks/useProfile";
import { useCounselorStudents } from "@/hooks/useCounselorStudents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students?.map((relationship) => (
            <Card key={relationship.student_id}>
              <CardHeader>
                <CardTitle>{relationship.students?.full_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Grade: {relationship.students?.grade || 'Not set'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    School: {relationship.students?.school || 'Not set'}
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/student/${relationship.student_id}/college-planning`)}
                  >
                    View Dashboard
                  </Button>
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
      )}
    </div>
  );
}