import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, MessageSquare, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DashboardHeader() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate('/counselor-dashboard');
  };

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

  const handleMockInterview = () => {
    navigate('/mock-interview');
  };

  const handleProfile = () => {
    navigate('/profile');
  };

  const showBackButton = location.pathname.includes('student-dashboard') || 
                        location.pathname.includes('student/');

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
            className="hover:bg-secondary"
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
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleProfile}
          className="hover:bg-secondary"
        >
          <UserRound className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="hover:bg-secondary"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}