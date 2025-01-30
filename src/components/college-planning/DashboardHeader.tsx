import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardHeader() {
  const { profile, isLoading, error } = useProfile();
  const navigate = useNavigate();

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

  const handleProfile = () => {
    navigate("/student-profile");
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">Student Dashboard</h1>
      <div className="flex gap-2">
        <Button onClick={handleProfile} variant="outline">
          My Profile
        </Button>
        <Button onClick={handleMockInterview} variant="outline">
          Mock Interview
        </Button>
        <Button onClick={handleLogout} variant="outline">
          <LogOut className="mr-2" />
          Log Out
        </Button>
      </div>
    </div>
  );
}