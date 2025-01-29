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
  const params = useParams();
  const studentId = params.studentId;
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
        console.error("Error fetching profile:", error);
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

  const handleBack = () => {
    navigate('/counselor-dashboard');
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
      {/* Header with back button */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Student Summary</h1>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Profile and Academics */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <ProfileSection profile={profile} />
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <AcademicSection courses={courses} />
          </div>
        </div>

        {/* Right column - Activities and Applications */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm">
            <ActivitiesSection activities={activities} />
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <ApplicationsSection applications={applications} />
          </div>
        </div>
      </div>
    </div>
  );
}