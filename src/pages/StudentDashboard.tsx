
import { Navigate, useParams } from "react-router-dom";
import { useProfile as useAuthProfile } from "@/hooks/auth/useProfile";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useStudentData } from "@/hooks/student/useStudentData";
import { useStudentRealtime } from "@/hooks/student/useStudentRealtime";
import AuthCheck from "@/components/college-planning/dashboard/AuthCheck";
import CounselorCheck from "@/components/college-planning/dashboard/CounselorCheck";
import ProfileWarnings from "@/components/college-planning/dashboard/ProfileWarnings";
import DashboardContent from "@/components/college-planning/dashboard/DashboardContent";
import CompleteProfile from "@/features/accounts/CompleteProfile";

export default function StudentDashboard() {
  const { studentId } = useParams();
  const { data: me } = useAuthProfile();
  const queryClient = useQueryClient();
  const [counselorRelationship, setCounselorRelationship] = useState(null);

  // Set up real-time subscriptions
  useStudentRealtime(studentId, queryClient);

  // Fetch student data
  const {
    profile,
    courses,
    activities,
    notes,
    isLoading,
  } = useStudentData(studentId);

  const handleCounselorCheck = (relationship: any) => {
    setCounselorRelationship(relationship);
  };

  // A student opening someone else's dashboard address goes to their own.
  if (me?.user_type === "student" && studentId && me.id !== studentId) {
    return <Navigate to={`/student-dashboard/${me.id}`} replace />;
  }

  // Accounts a counselor created: the student fills in their details first.
  if (profile && (profile as { must_complete_profile?: boolean }).must_complete_profile) {
    return (
      <AuthCheck queryClient={queryClient}>
        <CompleteProfile profile={profile} />
      </AuthCheck>
    );
  }

  return (
    <AuthCheck queryClient={queryClient}>
      {/* Profile warnings for incomplete information */}
      <ProfileWarnings profile={profile} isLoading={isLoading} />
      
      {/* Counselor relationship check */}
      {studentId && (
        <CounselorCheck 
          studentId={studentId} 
          onCounselorCheck={handleCounselorCheck} 
        />
      )}
      
      {/* Main dashboard content */}
      {!isLoading && (
        <DashboardContent studentId={studentId || ''} />
      )}
    </AuthCheck>
  );
}
