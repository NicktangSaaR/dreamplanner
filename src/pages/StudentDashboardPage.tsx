import { useProfile } from "@/hooks/useProfile";
import { useParams } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import DashboardTabs from "@/components/college-planning/DashboardTabs";

export default function StudentDashboardPage() {
  const { profile } = useProfile();
  const { id } = useParams();

  if (!profile) return null;

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader />
      <DashboardTabs studentId={id || profile.id} />
    </div>
  );
}