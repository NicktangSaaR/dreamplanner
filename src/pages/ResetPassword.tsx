import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AuthCard from "@/components/auth/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageToggle from "@/i18n/LanguageToggle";

const MIN_LENGTH = 8;

export default function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The recovery link signs the user in; wait for that session before
  // showing the form.
  const [status, setStatus] = useState<"checking" | "ready" | "invalid">("checking");

  useEffect(() => {
    let settled = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        settled = true;
        setStatus("ready");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        settled = true;
        setStatus("ready");
      }
    });

    // Give the auth client a moment to process the link before giving up.
    const timer = window.setTimeout(() => {
      if (!settled) setStatus("invalid");
    }, 4000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_LENGTH) {
      setError(t("reset.tooShort", { min: MIN_LENGTH }));
      return;
    }
    if (password !== confirm) {
      setError(t("reset.mismatch"));
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setIsLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    await supabase.auth.signOut();
    toast.success(t("reset.done"));
    navigate("/login");
  };

  return (
    <div className="container relative mx-auto p-4">
      <LanguageToggle className="absolute right-4 top-4" />
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <AuthCard
          title={t("reset.title")}
          subtitle={
            status === "invalid"
              ? t("reset.invalid")
              : t("reset.subtitle")
          }
          footer={
            <Link to={status === "invalid" ? "/forgot-password" : "/login"} className="font-semibold text-primary hover:underline">
              {status === "invalid" ? t("reset.resend") : t("auth.backToLogin")}
            </Link>
          }
        >
          {status === "checking" && (
            <p className="text-center text-sm text-muted-foreground">{t("reset.checking")}</p>
          )}
          {status === "ready" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">{t("reset.new")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={MIN_LENGTH}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t("reset.confirm")}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={MIN_LENGTH}
                  required
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("reset.submitting") : t("reset.submit")}
              </Button>
            </form>
          )}
        </AuthCard>
      </div>
    </div>
  );
}
