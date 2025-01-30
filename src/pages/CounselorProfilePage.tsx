import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ProfileSection from "@/components/college-planning/ProfileSection";
import { useEffect } from "react";

export default function CounselorProfilePage() {
  const navigate = useNavigate();
  const { profile, isLoading } = useProfile();

  useEffect(() => {
    if (!isLoading && profile && profile.user_type !== 'counselor') {
      console.log("Redirecting non-counselor user from counselor profile page", {
        userType: profile.user_type,
        profileId: profile.id
      });
      navigate('/student-profile');
    }
  }, [profile, isLoading, navigate]);

  // Show nothing while loading to prevent flash of content
  if (isLoading) {
    return null;
  }

  // If not a counselor, useEffect will handle redirect
  if (!profile || profile.user_type !== 'counselor') {
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