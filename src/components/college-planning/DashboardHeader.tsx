import { GraduationCap, User, LogOut, Video } from "lucide-react";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DashboardHeader() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId } = useParams();
  const isCounselorDashboard = location.pathname.includes('counselor-dashboard');

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">
              {isCounselorDashboard ? "Counselor Dashboard" : `${profile?.full_name || 'User'}'s Dashboard`}
            </h1>
          </div>
          <p className="text-lg text-gray-600">
            Hi, {profile?.full_name || "there"}
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Link to="/mock-interview">
            <Button variant="default" className="w-full sm:w-auto flex items-center justify-center gap-2">
              <Video className="h-4 w-4" />
              Mock Interview
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="default" className="w-full sm:w-auto flex items-center justify-center gap-2">
              <User className="h-4 w-4" />
              My Profile
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}