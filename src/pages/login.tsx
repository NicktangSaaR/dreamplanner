
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageToggle from "@/i18n/LanguageToggle";

export default function Login() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="container relative mx-auto p-4">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => navigate("/")}
        className="mb-4"
        aria-label={t("auth.backHome")}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <LanguageToggle className="absolute right-4 top-4" />
      
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <AuthCard
          title={t("login.title")}
          subtitle={t("login.subtitle")}
          footer={
            <>
              <span className="mr-1 text-muted-foreground">{t("login.noAccount")}</span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-semibold"
                onClick={() => navigate("/signup")}
              >
                {t("login.signup")}
              </Button>
            </>
          }
        >
          <LoginForm />
        </AuthCard>
      </div>
    </div>
  );
}
