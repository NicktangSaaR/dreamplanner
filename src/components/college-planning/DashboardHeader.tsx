import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCircuit } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
export default function DashboardHeader() {
  const navigate = useNavigate();
  const {
    profile
  } = useProfile();
  const handleMockInterview = () => {
    navigate('/mock-interview');
  };
  const handleActivityBrainstorming = () => {
    window.open('https://tbox.alipay.com/pro/share/202503APVPPw00291117?platform=WebService', '_blank');
  };
  const handleProfile = () => {
    navigate('/student-profile');
  };
  const handleBack = () => {
    navigate('/counselor-dashboard');
  };
  const handleLogout = async () => {
    try {
      const {
        error
      } = await supabase.auth.signOut();
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
  return <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        {profile?.user_type === 'counselor' && <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>}
        <h1 className="text-2xl font-bold">
          {profile?.user_type === 'counselor' ? 'Student Profile Summary' : 'Student Dashboard'}
        </h1>
      </div>
      <div className="flex gap-2 items-center">
        {profile?.user_type === 'student' && <>
            <span className="text-lg">Hello, {profile?.full_name || 'Student'}</span>
            <Button onClick={handleProfile} variant="outline">
              My Profile
            </Button>
            <Button onClick={handleMockInterview} variant="outline" className="flex flex-col gap-0.5">
              <span>Mock Interview</span>
              <span className="text-[10px] text-muted-foreground leading-none">developing...</span>
            </Button>
            <Button onClick={handleActivityBrainstorming} variant="outline" className="flex items-center gap-1">
              <BrainCircuit className="h-4 w-4" />
              <span>AI Activity Brainstromer
          </span>
              <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded-full">Beta</span>
            </Button>
            <Button onClick={handleLogout} variant="outline">
              Log Out
            </Button>
          </>}
      </div>
    </div>;
}