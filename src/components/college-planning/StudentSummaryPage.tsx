import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, GraduationCap, BookOpen, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StudentSummaryPage() {
  const navigate = useNavigate();
  const { studentId = '' } = useParams<{ studentId: string }>();
  console.log("StudentSummaryPage - Received studentId:", studentId);

  // Fetch student profile
  const { data: profile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) {
        console.error("No student ID provided");
        throw new Error("No student ID provided");
      }
      
      console.log("Fetching student profile data for ID:", studentId);
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
    enabled: !!studentId,
  });

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) {
        console.log("No student ID available for courses query");
        return [];
      }
      
      console.log("Fetching courses for student:", studentId);
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching courses:", error);
        throw error;
      }

      console.log("Fetched courses:", data);
      return data;
    },
    enabled: !!studentId,
  });

  const { data: applications = [] } = useQuery({
    queryKey: ["student-applications", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("college_applications")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        throw error;
      }

      return data;
    },
    enabled: !!studentId,
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["student-activities", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("extracurricular_activities")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching activities:", error);
        throw error;
      }

      return data;
    },
    enabled: !!studentId,
  });

  const handleViewDashboard = () => {
    console.log("View Dashboard clicked - studentId:", studentId);
    if (!studentId) {
      toast.error("Student ID is missing");
      return;
    }
    navigate(`/student-dashboard/${studentId}`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!studentId) {
    toast.error("No student ID provided");
    return null;
  }

  if (!profile) {
    return <div>Loading...</div>;
  }

  const calculateCurrentGPA = () => {
    if (courses.length === 0) return "0.00";
    const validCourses = courses.filter(course => course.gpa_value !== null);
    if (validCourses.length === 0) return "0.00";
    const totalGPA = validCourses.reduce((sum, course) => sum + (course.gpa_value || 0), 0);
    return (totalGPA / validCourses.length).toFixed(2);
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Student Summary</h1>
        </div>
        <Button onClick={handleViewDashboard}>View Dashboard</Button>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><span className="font-medium">Name:</span> {profile.full_name}</p>
          <p><span className="font-medium">Grade:</span> {profile.grade || "Not set"}</p>
          <p><span className="font-medium">School:</span> {profile.school || "Not set"}</p>
          {profile.interested_majors && profile.interested_majors.length > 0 && (
            <p><span className="font-medium">Interested Majors:</span> {profile.interested_majors.join(", ")}</p>
          )}
        </CardContent>
      </Card>

      {/* Academic Records Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>Academic Records</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">Current GPA</p>
              <p className="text-2xl font-bold text-blue-700">{calculateCurrentGPA()}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600">Total Courses</p>
              <p className="text-2xl font-bold text-green-700">{courses.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Recent Courses:</p>
            <div className="space-y-2">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span>{course.name}</span>
                  <span className="font-medium">{course.grade}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Extracurricular Activities Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <CardTitle>Extracurricular Activities</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex flex-col p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{activity.name}</p>
                    <p className="text-sm text-gray-600">{activity.role}</p>
                  </div>
                  {activity.time_commitment && (
                    <Badge variant="secondary">{activity.time_commitment}</Badge>
                  )}
                </div>
                {activity.description && (
                  <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
                )}
              </div>
            ))}
            {activities.length === 0 && (
              <p className="text-gray-500 text-center">No extracurricular activities recorded</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* College Applications Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <CardTitle>College Applications</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {applications.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{app.college_name}</p>
                  <p className="text-sm text-gray-600">{app.major} • {app.degree}</p>
                </div>
                <Badge className="bg-blue-500">{app.category}</Badge>
              </div>
            ))}
            {applications.length === 0 && (
              <p className="text-gray-500 text-center">No college applications yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} // Added missing closing brace