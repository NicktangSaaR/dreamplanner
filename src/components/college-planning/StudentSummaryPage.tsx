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
import SharedFolderSection from "./student-summary/SharedFolderSection";
import { Profile } from "@/types/profile";
import { Json } from "@/integrations/supabase/types";

export default function StudentSummaryPage() {
  const navigate = useNavigate();
  const params = useParams();
  const studentId = params.studentId;
  console.log("StudentSummaryPage - Received studentId:", studentId);

  // First check if the current user has access to this student
  const { data: hasAccess, isLoading: checkingAccess } = useQuery({
    queryKey: ["student-access", studentId],
    queryFn: async () => {
      if (!studentId) return false;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check for parent relationship
      const { data: parentRelationship } = await supabase
        .from("parent_student_relationships")
        .select("*")
        .eq("parent_id", user.id)
        .eq("student_id", studentId)
        .eq("confirmed", true)
        .maybeSingle();

      // Check for counselor relationship
      const { data: counselorRelationship } = await supabase
        .from("counselor_student_relationships")
        .select("*")
        .eq("counselor_id", user.id)
        .eq("student_id", studentId)
        .maybeSingle();

      return Boolean(parentRelationship || counselorRelationship || user.id === studentId);
    },
    enabled: !!studentId,
  });

  // Fetch student profile
  const { data: profileData } = useQuery({
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

      // Transform the data to match Profile type
      const profile: Profile = {
        ...data,
        social_media: data.social_media ? {
          linkedin: (data.social_media as any)?.linkedin || "",
          twitter: (data.social_media as any)?.twitter || "",
          instagram: (data.social_media as any)?.instagram || "",
        } : null,
        interested_majors: Array.isArray(data.interested_majors) ? data.interested_majors : [],
        career_interest_test: data.career_interest_test as Profile['career_interest_test']
      };

      return profile;
    },
    enabled: !!studentId && !!hasAccess,
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
    enabled: !!studentId && !!hasAccess,
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
    enabled: !!studentId && !!hasAccess,
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
    enabled: !!studentId && !!hasAccess,
  });

  const handleBack = () => {
    navigate('/counselor-dashboard');
  };

  if (checkingAccess) {
    return <div>Checking access...</div>;
  }

  if (!hasAccess) {
    toast.error("You don't have permission to view this student's profile");
    navigate('/');
    return null;
  }

  if (!studentId) {
    toast.error("No student ID provided");
    return null;
  }

  if (!profileData) {
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
            <ProfileSection profile={profileData} studentId={studentId} />
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <AcademicSection 
              courses={courses} 
              studentId={studentId}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm">
            <SharedFolderSection studentId={studentId} />
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
