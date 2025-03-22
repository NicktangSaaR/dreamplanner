
import { useEffect } from "react";
import { Profile } from "@/types/profile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface ProfileWarningsProps {
  profile: Profile | null;
  isLoading: boolean;
}

export default function ProfileWarnings({ profile, isLoading }: ProfileWarningsProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Show toasts for incomplete profile information
  useEffect(() => {
    if (!isLoading && profile) {
      const showProfileWarnings = () => {
        // 检查学校信息是否为空
        if (!profile.school || profile.school.trim() === '') {
          toast({
            variant: "destructive",
            title: "信息未完善",
            description: (
              <div className="flex flex-col gap-4">
                <p>请完善学校信息，这对于您的规划非常重要</p>
                <Button 
                  onClick={() => navigate('/student-profile')}
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white hover:bg-gray-100"
                >
                  前往完善信息
                </Button>
              </div>
            ),
            duration: null,
          });
        }
      };

      showProfileWarnings();
    }
  }, [profile, isLoading, navigate, toast]);

  return null;
}
