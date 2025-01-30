import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { LogOut, UserRound, Video, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DashboardHeader() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
      toast.success("Successfully logged out");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const handleProfile = () => {
    // Update the navigation based on user type
    if (profile?.user_type === 'student') {
      navigate('/student-profile');
    } else if (profile?.user_type === 'counselor') {
      navigate('/counselor-profile');
    }
  };

  const handleMockInterview = () => {
    navigate('/mock-interview');
  };

  const handleBack = () => {
    navigate('/counselor-dashboard');
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {location.pathname.includes('/counselor-dashboard/student/') && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="hover:bg-secondary"
            title="Back to My Students"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold">
            {profile?.user_type === 'counselor' ? "Counselor Dashboard" : "My Dashboard"}
          </h1>
          {profile?.full_name && (
            <p className="text-muted-foreground mt-1">
              {profile.full_name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleMockInterview}
          className="hover:bg-secondary"
          title="Mock Interview"
        >
          <Video className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleProfile}
          className="hover:bg-secondary"
          title="Profile"
        >
          <UserRound className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="hover:bg-secondary"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}