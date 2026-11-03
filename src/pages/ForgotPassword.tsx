import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MailCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AuthCard from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageToggle from "@/i18n/LanguageToggle";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsLoading(false);
    // Rate limits are the only error worth surfacing; for anything else show
    // the same confirmation so the page doesn't reveal which emails exist.
    if (error && error.status === 429) {
      setError(t("forgot.rateLimited"));
      return;
    }
    setSent(true);
  };

  return (
    <div className="container relative mx-auto p-4">
      <Button variant="ghost" size="icon" onClick={() => navigate("/login")} className="mb-4" aria-label={t("auth.backToLogin")}>
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <LanguageToggle className="absolute right-4 top-4" />

      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <AuthCard
          title={t("forgot.title")}
          subtitle={sent ? t("forgot.sentSubtitle") : t("forgot.subtitle")}
          footer={
            <Link to="/login" className="font-semibold text-primary hover:underline">
              {t("auth.backToLogin")}
            </Link>
          }
        >
          {sent ? (
            <div className="flex flex-col items-center gap-3 text-center text-sm text-muted-foreground">
              <MailCheck className="h-10 w-10 text-primary" />
              <p>{t("forgot.sentBody", { email })}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("forgot.submitting") : t("forgot.submit")}
              </Button>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  );
}
