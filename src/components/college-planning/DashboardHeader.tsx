import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export default function DashboardHeader() {
  const { profile, isLoading, error } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleProfile = () => {
    if (isLoading) {
      toast.info("Loading profile data...");
      return;
    }

    if (error) {
      console.error("Error accessing profile:", error);
      toast.error("Unable to access profile: " + error.message);
      return;
    }

    if (!profile) {
      console.error("Profile data is not available");
      toast.error("Unable to access profile data. Please try logging in again.");
      return;
    }

    const isStudentRoute = location.pathname.includes("student-dashboard");
    if (isStudentRoute) {
      navigate(`/student-profile/${profile.id}`);
    } else {
      navigate(`/counselor-profile/${profile.id}`);
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <Button onClick={handleProfile} variant="outline">
        View Profile
      </Button>
    </div>
  );
}