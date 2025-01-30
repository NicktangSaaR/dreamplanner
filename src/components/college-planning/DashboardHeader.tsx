import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

    console.log("Navigating to profile page for user type:", profile.user_type);
    
    if (profile.user_type === 'counselor') {
      navigate('/counselor-profile');
    } else {
      navigate('/student-profile');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const handleMockInterview = () => {
    navigate("/mock-interview");
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">My Dashboard</h1>
      <div className="flex gap-2">
        <Button onClick={handleMockInterview} variant="outline">
          Mock Interview
        </Button>
        <Button onClick={handleProfile} variant="outline">
          View Profile
        </Button>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}