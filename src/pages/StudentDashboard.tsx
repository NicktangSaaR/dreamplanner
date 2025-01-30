import { useNavigate, useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const { profile } = useProfile(studentId);

  const { data: relationship } = useQuery({
    queryKey: ["counselor-relationship", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("counselor_student_relationships")
        .select(`
          counselor_id,
          counselor:profiles!counselor_student_relationships_counselor_profiles_fkey(
            full_name
          )
        `)
        .eq("student_id", studentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const handleBack = () => {
    navigate("/");
  };

  const handleProfileClick = () => {
    navigate(`/student-profile`);
  };

  if (!profile) return null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
        </div>
        <Button onClick={handleProfileClick}>View Profile</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Name: {profile.full_name}</p>
            <p>Grade: {profile.grade}</p>
            <p>School: {profile.school}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Counselor Information</CardTitle>
          </CardHeader>
          <CardContent>
            {relationship ? (
              <p>Current Counselor: {relationship.counselor?.full_name}</p>
            ) : (
              <p>No counselor assigned</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              className="w-full"
              onClick={() => navigate("/mock-interview")}
            >
              Start Mock Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}