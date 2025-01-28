import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function StudentSummaryPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  console.log("StudentSummaryPage - Received studentId:", studentId);

  // Fetch student profile
  const { data: profile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("No student ID provided");
      
      console.log("Fetching student profile data");
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
  const { data: courses } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching courses:", error);
        throw error;
      }

      return data;
    },
    enabled: !!studentId,
  });

  // Fetch college applications
  const { data: applications } = useQuery({
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

  const handleViewDashboard = () => {
    console.log("View Dashboard clicked - studentId:", studentId);
    if (!studentId) {
      toast.error("Student ID is missing");
      return;
    }
    navigate(`/student-dashboard/${studentId}`);
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Student Summary</h1>
        <Button onClick={handleViewDashboard}>View Dashboard</Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Name:</span> {profile.full_name}</p>
            <p><span className="font-medium">Grade:</span> {profile.grade || "Not set"}</p>
            <p><span className="font-medium">School:</span> {profile.school || "Not set"}</p>
            {profile.interested_majors && profile.interested_majors.length > 0 && (
              <p><span className="font-medium">Interested Majors:</span> {profile.interested_majors.join(", ")}</p>
            )}
          </div>
        </div>

        {/* Academic Records Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Academic Records</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Total Courses:</span> {courses?.length || 0}</p>
            {/* Add more academic statistics as needed */}
          </div>
        </div>

        {/* College Applications Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">College Applications</h2>
          <div className="space-y-2">
            <p><span className="font-medium">Total Applications:</span> {applications?.length || 0}</p>
            {/* Add more application statistics as needed */}
          </div>
        </div>
      </div>
    </div>
  );
}
