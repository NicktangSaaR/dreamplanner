import { useNavigate, useLocation } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function DashboardHeader() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    navigate('/counselor-dashboard');
  };

  const showBackButton = location.pathname.includes('student-dashboard') || 
                        location.pathname.includes('student/');

  return (
    <div className="flex items-center gap-4 mb-6">
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
  );
}