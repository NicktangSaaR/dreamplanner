import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import StudentSummaryPage from "@/components/college-planning/StudentSummaryPage";
import { toast } from "sonner";

export default function StudentView() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  console.log("StudentView - Current user profile:", profile);

  const handleProfile = () => {
    if (!profile) {
      console.error("No profile found");
      toast.error("Unable to determine user type");
      return;
    }

    console.log("Handling profile navigation for user type:", profile.user_type);
    
    if (profile.user_type === "counselor") {
      navigate("/counselor-profile");
    } else if (profile.user_type === "student") {
      navigate("/student-profile");
    } else {
      console.error("Unknown user type:", profile.user_type);
      toast.error("Unknown user type");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/counselor-dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Student Details</h1>
        </div>
        <Button
          variant="outline"
          onClick={handleProfile}
        >
          <User className="mr-2 h-4 w-4" />
          My Profile
        </Button>
      </div>
      <StudentSummaryPage />
    </div>
  );
}