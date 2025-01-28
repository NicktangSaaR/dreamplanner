import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import CounselorView from "@/components/college-planning/CounselorView";
import DashboardHeader from "@/components/college-planning/DashboardHeader";

export default function CounselorDashboard() {
  const { profile } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && profile.user_type !== 'counselor') {
      console.log("Non-counselor attempting to access counselor dashboard");
      navigate('/college-planning');
    }
  }, [profile, navigate]);

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader />
      <CounselorView />
    </div>
  );
}