import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { LogOut, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function DashboardHeader() {
  const { profile, isLoading, error } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

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

  const handleBack = () => {
    navigate("/counselor-dashboard");
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleBack}
          className="hover:bg-accent"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
      </div>
      <div className="flex gap-2">
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