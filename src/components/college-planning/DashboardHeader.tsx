import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageToggle from "@/i18n/LanguageToggle";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
export default function DashboardHeader() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    profile
  } = useProfile();
  const handleMockInterview = () => {
    navigate('/mock-interview');
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
  return <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        {profile?.user_type === 'counselor' && <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>}
        <div>
          <h1 className="font-serif text-3xl font-semibold text-pine">
            {profile?.user_type === 'counselor' ? t("dash.counselorTitle") : t("dash.title")}
          </h1>
          {profile?.user_type === 'student' && <p className="mt-1 text-muted-foreground">{t("dash.hello", { name: profile?.full_name || "" })}</p>}
        </div>
      </div>
      {profile?.user_type === 'student' && <div className="flex flex-wrap items-center gap-2">
          <LanguageToggle />
          <Button onClick={handleProfile} variant="outline" size="sm">{t("dash.profile")}</Button>
          <Button onClick={handleMockInterview} variant="outline" size="sm">{t("dash.mockInterview")}</Button>
          <Button onClick={handleLogout} variant="ghost" size="sm">{t("dash.logout")}</Button>
        </div>}
    </div>;
}
