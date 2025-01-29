import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import ProfileSection from "./student-summary/ProfileSection";
import AcademicSection from "./student-summary/AcademicSection";
import ActivitiesSection from "./student-summary/ActivitiesSection";
import ApplicationsSection from "./student-summary/ApplicationsSection";

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

      <ProfileSection profile={profile} />
      <AcademicSection courses={courses} />
      <ActivitiesSection activities={activities} />
      <ApplicationsSection applications={applications} />
    </div>
  );
}