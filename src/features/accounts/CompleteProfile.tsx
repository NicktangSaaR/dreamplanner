import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/LanguageProvider";
import LanguageToggle from "@/i18n/LanguageToggle";
import { isInternalAddress } from "./studentLogin";

type Profile = {
  id: string;
  full_name: string | null;
  english_name?: string | null;
  school: string | null;
  email: string | null;
  parent_email?: string | null;
};
const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/**
 * Shown instead of the home page to a student whose account a counselor
 * created, until they've added their details and an email for password reset.
 */
export default function CompleteProfile({ profile }: { profile: Profile }) {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [name, setName] = useState(profile.full_name ?? "");
  const [english, setEnglish] = useState(profile.english_name ?? "");
  const [school, setSchool] = useState(profile.school ?? "");
  const [email, setEmail] = useState(isInternalAddress(profile.email) ? "" : profile.email ?? "");
  const [parent, setParent] = useState(profile.parent_email ?? "");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim() || !school.trim() || !email.trim()) return setError(t("complete.required"));
    if (!EMAIL.test(email.trim()) || (parent.trim() && !EMAIL.test(parent.trim()))) return setError(t("complete.badEmail"));
    if (pw && pw.length < 8) return setError(t("complete.tooShort"));
    if (pw !== pw2) return setError(t("complete.mismatch"));
    setBusy(true);
    try {
      if (pw) {
        const { error: pwErr } = await supabase.auth.updateUser({ password: pw });
        if (pwErr) throw pwErr;
      }
      const { error: upErr } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          english_name: english.trim() || null,
          school: school.trim(),
          email: email.trim().toLowerCase(),
          parent_email: parent.trim() || null,
          must_complete_profile: false,
        } as never)
        .eq("id", profile.id);
      if (upErr) throw upErr;
      await qc.invalidateQueries({ queryKey: ["student-profile", profile.id] });
    } catch (err) {
      console.error("complete profile", err);
      toast.error(t("complete.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative mx-auto max-w-lg px-4 py-10">
      <LanguageToggle className="absolute right-4 top-4" />
      <div className="flex items-center gap-2 text-pine">
        <UserCheck className="h-6 w-6" />
        <h1 className="font-serif text-2xl font-semibold">{t("complete.title")}</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{t("complete.subtitle")}</p>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-md border bg-card p-5">
        <div className="space-y-1.5">
          <Label htmlFor="cp-name">{t("complete.name")}</Label>
          <Input id="cp-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-en">{t("complete.englishName")}</Label>
          <Input id="cp-en" value={english} onChange={(e) => setEnglish(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-school">{t("complete.school")}</Label>
          <Input id="cp-school" value={school} onChange={(e) => setSchool(e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-email">{t("complete.email")}</Label>
          <Input id="cp-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <p className="text-xs text-muted-foreground">{t("complete.emailHint")}</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cp-parent">{t("complete.parentEmail")}</Label>
          <Input id="cp-parent" type="email" value={parent} onChange={(e) => setParent(e.target.value)} />
        </div>
        <div className="space-y-1.5 border-t pt-4">
          <Label htmlFor="cp-pw">{t("complete.password")}</Label>
          <p className="text-xs text-muted-foreground">{t("complete.passwordHint")}</p>
          <Input id="cp-pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          {pw && (
            <Input type="password" autoComplete="new-password" placeholder={t("complete.passwordAgain")} aria-label={t("complete.passwordAgain")}
              value={pw2} onChange={(e) => setPw2(e.target.value)} />
          )}
        </div>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />{t("complete.saving")}</> : t("complete.submit")}
        </Button>
      </form>
    </div>
  );
}
