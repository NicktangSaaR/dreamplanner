import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, GraduationCap, BookOpen, Activity, School } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface StudentSummaryPageProps {
  studentId: string;
}

export default function StudentSummaryPage({ studentId }: StudentSummaryPageProps) {
  const navigate = useNavigate();

  // Fetch student profile
  const { data: profile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      console.log("Fetching student profile for summary:", studentId);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching student profile:", error);
        throw error;
      }

      console.log("Student profile data:", data);
      return data;
    },
  });

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      console.log("Fetching student courses for summary");
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching courses:", error);
        throw error;
      }

      console.log("Student courses:", data);
      return data;
    },
  });

  // Fetch college applications
  const { data: applications } = useQuery({
    queryKey: ["student-applications", studentId],
    queryFn: async () => {
      console.log("Fetching student college applications");
      const { data, error } = await supabase
        .from("college_applications")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }

      console.log("Student applications:", data);
      return data;
    },
  });

  const calculateGPA = () => {
    if (!courses || courses.length === 0) return "N/A";
    const validGrades = courses.filter(course => course.gpa_value !== null);
    if (validGrades.length === 0) return "N/A";
    const totalGPA = validGrades.reduce((sum, course) => sum + (course.gpa_value || 0), 0);
    return (totalGPA / validGrades.length).toFixed(2);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/counselor-dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Student Summary</h1>
        </div>
        <Button 
          onClick={() => navigate(`/counselor-dashboard/student/${studentId}`)}
          className="flex items-center gap-2"
        >
          View Dashboard
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <School className="h-5 w-5" />
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {profile?.full_name}</p>
            <p><strong>Grade:</strong> {profile?.grade || "Not set"}</p>
            <p><strong>School:</strong> {profile?.school || "Not set"}</p>
            <p><strong>Interested Majors:</strong> {profile?.interested_majors?.join(", ") || "Not set"}</p>
          </CardContent>
        </Card>

        {/* Academic Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>Academic Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Current GPA:</strong> {calculateGPA()}</p>
            <p><strong>Total Courses:</strong> {courses?.length || 0}</p>
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Recent Courses</h4>
              <div className="space-y-2">
                {courses?.slice(0, 3).map((course) => (
                  <div key={course.id} className="text-sm">
                    {course.name} - Grade: {course.grade}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* College Applications */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <CardTitle>College Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {applications?.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-semibold">{app.college_name}</p>
                    <p className="text-sm text-muted-foreground">{app.major} • {app.degree}</p>
                  </div>
                  <Badge>{app.category}</Badge>
                </div>
              ))}
              {(!applications || applications.length === 0) && (
                <p className="text-muted-foreground">No college applications yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}