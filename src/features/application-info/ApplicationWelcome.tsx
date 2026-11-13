import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardList, School, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useApplicationOpen } from "./data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Shown once, the first time a student signs in after their application
 * season opens (College Bound, transfer, master's, or opened early).
 */
export default function ApplicationWelcome({ studentId, seenAt }: { studentId: string; seenAt: string | null | undefined }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: open } = useApplicationOpen(studentId);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (open && seenAt === null) setShow(true);
  }, [open, seenAt]);

  const done = async (go: boolean) => {
    setShow(false);
    await db.from("profiles").update({ application_welcome_seen_at: new Date().toISOString() }).eq("id", studentId);
    qc.invalidateQueries({ queryKey: ["profile"] });
    if (go) navigate("/application-info");
  };

  const steps = [
    { icon: ClipboardList, zh: "填写「申请信息」：网申要用的个人、家庭、学校、成绩、考试和推荐人信息。填一次就行，顾问会核对后帮你填进各个申请系统。", en: "Fill in your application information once: personal details, family, school, grades, tests and recommenders. Your counselor checks it and uses it for every application." },
    { icon: Trophy, zh: "更新「活动档案」：把活动、比赛、奖项、科研和实习都补全。", en: "Update your activity portfolio: activities, competitions, awards, research and work." },
    { icon: School, zh: "确认选校单：顾问会和你确定要申请的学校。每所学校要做的事和截止日期，会出现在你的待办里。", en: "Confirm your school list with your counselor. What each school needs, and when, will show up in your to-dos." },
  ];

  return (
    <Dialog open={show} onOpenChange={(o) => { if (!o) void done(false); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-pine">{L("你已进入申请季", "Your application season has started")}</DialogTitle>
          <DialogDescription>{L("从现在开始，和顾问一起准备申请。先做这三件事：", "Here's where to start, together with your counselor:")}</DialogDescription>
        </DialogHeader>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <s.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <span>{s[lang]}</span>
            </li>
          ))}
        </ol>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => void done(false)}>{L("稍后再说", "Later")}</Button>
          <Button onClick={() => void done(true)}>{L("开始填写申请信息", "Start my application info")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
