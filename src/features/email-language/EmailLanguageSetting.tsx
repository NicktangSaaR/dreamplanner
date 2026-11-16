import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/i18n/LanguageProvider";
import { EMAIL_LANGUAGES, type EmailLanguage, emailLanguageLabel, saveEmailLanguage, toEmailLanguage } from "./emailLanguage";

/** The signed-in user's own email language. */
export default function EmailLanguageSetting() {
  const { lang } = useLanguage();
  const Z = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const [userId, setUserId] = useState<string | null>(null);
  const [value, setValue] = useState<EmailLanguage | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !live) return;
      setUserId(user.id);
      const { data } = await (supabase as any).from("profiles").select("email_language").eq("id", user.id).maybeSingle();
      if (live) setValue(toEmailLanguage(data?.email_language));
    })();
    return () => { live = false; };
  }, []);

  const change = async (v: string) => {
    if (!userId) return;
    const next = v as EmailLanguage;
    const before = value;
    setValue(next);
    if (await saveEmailLanguage(userId, next)) toast.success(Z("已保存", "Saved"));
    else {
      setValue(before);
      toast.error(Z("没能保存，请稍后再试", "Couldn't save. Please try again."));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Mail className="h-5 w-5 text-primary" aria-hidden="true" /> {Z("邮件语言", "Email language")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Select value={value ?? undefined} onValueChange={(v) => void change(v)} disabled={!value}>
          <SelectTrigger className="max-w-sm" aria-label={Z("邮件语言", "Email language")}>
            <SelectValue placeholder={Z("加载中…", "Loading…")} />
          </SelectTrigger>
          <SelectContent>
            {EMAIL_LANGUAGES.map((v) => <SelectItem key={v} value={v}>{emailLanguageLabel(v, lang)}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {Z("待办提醒等邮件会用这个语言发送。在网站右上角切换语言时也会自动更新。", "Reminders and other emails are sent in this language. Switching the site language also updates it.")}
        </p>
      </CardContent>
    </Card>
  );
}
