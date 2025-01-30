import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

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
      <div className="flex gap-2">
        {profile?.user_type === 'student' && (
          <Button onClick={handleProfile} variant="outline">
            My Profile
          </Button>
        )}
        <Button onClick={handleMockInterview} variant="outline">
          Mock Interview
        </Button>
      </div>
    </div>
  );
}