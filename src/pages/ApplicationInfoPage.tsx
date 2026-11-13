import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/i18n/LanguageProvider";
import ApplicationInfo from "@/features/application-info/ApplicationInfo";
import { useApplicationOpen } from "@/features/application-info/data";

/** The student's application information form. */
export default function ApplicationInfoPage() {
  const { profile } = useProfile();
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { data: open, isLoading } = useApplicationOpen(profile?.id);
  if (!profile?.id || isLoading) return null;
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8">
      <Link to={`/student-dashboard/${profile.id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" />{L("返回主页", "Back to home")}
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-pine">{L("申请信息", "Application information")}</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
        {L("网申表格需要的个人信息、家庭、学校、成绩、考试、推荐人等都在这里填一次，顾问会核对后帮你填进各个申请系统。可以分几次填，每一项都会自动保存。",
          "Fill in what application forms ask for once: personal details, family, school, grades, tests and recommenders. Your counselor checks it and uses it for each application. It saves as you go.")}
      </p>
      <div className="mt-6">
        {open ? <ApplicationInfo studentId={profile.id} mode="student" />
          : <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">{L("申请信息会在你进入申请季后开放，到时顾问会通知你。", "This opens when you start your applications; your counselor will let you know.")}</p>}
      </div>
    </main>
  );
}
