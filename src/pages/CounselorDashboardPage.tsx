import { useProfile } from "@/hooks/useProfile";
import { useParams } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import CounselorView from "@/components/college-planning/CounselorView";

export default function CounselorDashboardPage() {
  const { profile } = useProfile();
  const { id } = useParams();

  if (!profile) return null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader />
      <CounselorView counselorId={id || profile.id} />
    </div>
  );
}