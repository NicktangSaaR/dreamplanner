
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

import AddCollaboratorDialog from "./AddCollaboratorDialog";
import EnginesDashboard from "@/components/engines/EnginesDashboard";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";

export default function StudentSummaryPage() {
  const navigate = useNavigate();
  const params = useParams();
  const studentId = params.studentId;
  const { profile } = useProfile();
  const [showCollaboratorDialog, setShowCollaboratorDialog] = useState(false);

  // Fetch student profile
  const { data: studentProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("No student ID provided");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
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
      if (error) throw error;
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
      if (error) throw error;
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

  if (!studentProfile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">
            {studentProfile.full_name || 'Student'} - 规划总览
          </h1>
        </div>
        {profile?.user_type === 'counselor' && (
          <Button
            variant="outline"
            onClick={() => setShowCollaboratorDialog(true)}
          >
            Add Collaborator
          </Button>
        )}
      </div>

      {/* Profile Summary */}
      <div className="bg-card rounded-lg shadow-sm p-6">
        <ProfileSection profile={studentProfile} />
      </div>

      {/* Planning Engines - Core Section */}
      <EnginesDashboard 
        studentId={studentId} 
        grade={studentProfile.grade} 
        readOnly={false} 
      />

      {/* Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow-sm">
            <AcademicSection courses={courses} studentId={studentId} />
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-card rounded-lg shadow-sm">
            <ActivitiesSection activities={activities} />
          </div>
          <div className="bg-card rounded-lg shadow-sm">
            <ApplicationsSection applications={applications} />
          </div>
        </div>
      </div>

      {studentId && (
        <AddCollaboratorDialog
          studentId={studentId}
          open={showCollaboratorDialog}
          onOpenChange={setShowCollaboratorDialog}
        />
      )}
    </div>
  );
}
