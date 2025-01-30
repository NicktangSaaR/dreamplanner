import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProfileSection from "@/components/college-planning/ProfileSection";

export default function CounselorProfilePage() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  if (!profile || profile.user_type !== 'counselor') {
    navigate('/student-profile');
    return null;
  }

  const handleBack = () => {
    navigate('/counselor-dashboard');
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">My Profile</h1>
      </div>

      <div className="bg-[#D3E4FD] p-4 rounded-lg">
        <ProfileSection />
      </div>
    </div>
  );
}