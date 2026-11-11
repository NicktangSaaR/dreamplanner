import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { USERNAME_RE, suggestUsername } from "./studentLogin";

const GRADES = ["G7", "G8", "G9", "G10", "G11", "G12", "Transfer"];

/** A counselor creates a student's account directly; the student logs in with a username. */
export default function CreateStudentForm({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [touchedUsername, setTouchedUsername] = useState(false);
  const [grade, setGrade] = useState("G10");
  const [email, setEmail] = useState("");
  const [ownPassword, setOwnPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ username: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const usernameOk = USERNAME_RE.test(username);
  const canSubmit = name.trim() && usernameOk && (!ownPassword || password.length >= 8) && !busy;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("create-student", {
      body: { full_name: name.trim(), username, grade, email: email.trim() || undefined, password: ownPassword ? password : undefined },
    });
    setBusy(false);
    if (error || !data?.username) {
      // the function explains what went wrong (taken username, email already registered…)
      let msg = data?.error as string | undefined;
      try {
        msg ||= (await (error as { context?: Response })?.context?.json())?.error;
      } catch {
        /* keep the general message */
      }
      toast.error(msg || t("complete.failed"));
      return;
    }
    setDone({ username: data.username, password: ownPassword ? password : data.password });
    qc.invalidateQueries({ queryKey: ["counselor-home"] });
  };

  if (done) {
    const info = t("acct.loginInfo", { url: "https://dreamplaneredu.com/login", username: done.username, password: done.password });
    return (
      <div className="space-y-4">
        <p className="font-semibold text-pine">{t("acct.done")}</p>
        <p className="text-sm text-muted-foreground">{t("acct.doneHint")}</p>
        <pre className="whitespace-pre-wrap rounded-md border bg-muted/40 p-3 text-sm">{info}</pre>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(info);
                setCopied(true);
              } catch {
                toast.error("Copy failed");
              }
            }}
          >
            {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
            {copied ? t("acct.copied") : t("acct.copy")}
          </Button>
          <Button variant="outline" onClick={() => { setDone(null); setName(""); setUsername(""); setTouchedUsername(false); setEmail(""); setPassword(""); setCopied(false); }}>
            {t("acct.another")}
          </Button>
          <Button variant="ghost" onClick={onDone}>{t("acct.close")}</Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("acct.createHint")}</p>
      <div className="space-y-1.5">
        <Label htmlFor="cs-name">{t("acct.name")}</Label>
        <Input id="cs-name" value={name} required
          onChange={(e) => { setName(e.target.value); if (!touchedUsername) setUsername(suggestUsername(e.target.value)); }} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="cs-username">{t("acct.username")}</Label>
        <Input id="cs-username" value={username} autoCapitalize="none" spellCheck={false} required
          aria-invalid={!!username && !usernameOk}
          onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/\s/g, "")); setTouchedUsername(true); }} />
        <p className={`text-xs ${username && !usernameOk ? "text-destructive" : "text-muted-foreground"}`}>{t("acct.usernameHint")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>{t("acct.grade")}</Label>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{GRADES.map((g) => <SelectItem key={g} value={g}>{g === "Transfer" ? t("acct.transfer") : g}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cs-email">{t("acct.emailOptional")}</Label>
          <Input id="cs-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>{t("acct.password")}</Label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant={ownPassword ? "outline" : "default"} onClick={() => setOwnPassword(false)}>{t("acct.passwordAuto")}</Button>
          <Button type="button" size="sm" variant={ownPassword ? "default" : "outline"} onClick={() => setOwnPassword(true)}>{t("acct.passwordOwn")}</Button>
        </div>
        {ownPassword && (
          <Input type="text" autoComplete="new-password" placeholder={t("acct.passwordPlaceholder")} value={password} onChange={(e) => setPassword(e.target.value)} />
        )}
      </div>
      <Button type="submit" className="w-full" disabled={!canSubmit}>
        {busy ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />{t("acct.creating")}</> : t("acct.create")}
      </Button>
    </form>
  );
}
