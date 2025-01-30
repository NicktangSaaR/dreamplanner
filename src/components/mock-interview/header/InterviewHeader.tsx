import { Home, LogOut, Settings, ArrowLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Profile } from "@/types/profile";

interface InterviewHeaderProps {
  profile: Profile | null;
  showBackButton: boolean;
  onBackToSettings: () => void;
  onShowDeviceSetup: () => void;
  onLogout: () => void;
  onCleanupMedia?: () => void;
}

const InterviewHeader = ({
  profile,
  showBackButton,
  onBackToSettings,
  onShowDeviceSetup,
  onLogout,
  onCleanupMedia,
}: InterviewHeaderProps) => {
  const handleBackClick = () => {
    console.log("Cleaning up media streams before going back to settings");
    if (onCleanupMedia) {
      onCleanupMedia();
    }
    onBackToSettings();
  };

  const handleHomeClick = () => {
    console.log("Cleaning up media streams before navigating home");
    if (onCleanupMedia) {
      onCleanupMedia();
    }
  };

  return (
    <div className="flex justify-between items-center mb-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-center">Mock Interview Practice</h1>
        <p className="text-gray-600 text-lg">
          Hi, {profile?.full_name || '同学'}
        </p>
      </div>
      <div className="flex gap-4">
        {showBackButton && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-10 h-10"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Link to="/" onClick={handleHomeClick}>
          <Button variant="ghost" size="icon" className="w-10 h-10">
            <Home className="h-5 w-5" />
          </Button>
        </Link>
        <Link to={`/student-dashboard/${profile?.id}`}>
          <Button variant="ghost" size="icon" className="w-10 h-10">
            <LayoutDashboard className="h-5 w-5" />
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-10 h-10"
          onClick={onShowDeviceSetup}
        >
          <Settings className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-10 h-10"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default InterviewHeader;