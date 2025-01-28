import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProfileSection from "@/components/college-planning/ProfileSection";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

export default function Profile() {
  const navigate = useNavigate();
  const { profile } = useProfile();

  const handleBack = () => {
    if (profile?.user_type === 'counselor') {
      navigate('/counselor-dashboard');
    } else {
      navigate('/college-planning');
    }
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
        <h1 className="text-3xl font-bold">Student Profile</h1>
      </div>
      <div className="bg-[#D3E4FD] p-4 rounded-lg">
        <ProfileSection />
      </div>
    </div>
  );
}