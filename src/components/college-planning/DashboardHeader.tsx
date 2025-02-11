
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DashboardHeader() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const handleMockInterview = () => {
    navigate('/mock-interview');
  };

  const handleProfile = () => {
    navigate('/student-profile');
  };

  const handleBack = () => {
    navigate('/counselor-dashboard');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
        toast.error("Error logging out");
      } else {
        toast.success("Logged out successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        {profile?.user_type === 'counselor' && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <h1 className="text-2xl font-bold">
          {profile?.user_type === 'counselor' ? 'Student Profile Summary' : 'Student Dashboard'}
        </h1>
      </div>
      <div className="flex gap-2 items-center">
        {profile?.user_type === 'student' && (
          <>
            <span className="text-lg">Hello, {profile?.full_name || 'Student'}</span>
            <Button onClick={handleProfile} variant="outline">
              My Profile
            </Button>
            <Button onClick={handleMockInterview} variant="outline" className="flex flex-col gap-0.5">
              <span>Mock Interview</span>
              <span className="text-[10px] text-muted-foreground leading-none">developing...</span>
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Log Out
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
