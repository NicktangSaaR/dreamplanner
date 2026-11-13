import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, CalendarClock, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import StudentStatusDialog from "./StudentStatusDialog";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GuideButton, Tour, useGuide } from "@/features/guide/Tour";
import { COUNSELOR_STUDENT_GUIDE } from "@/features/guide/guides";
import { useStudentData } from "@/hooks/student/useStudentData";
import StudentProfile from "@/components/college-planning/student-summary/StudentProfile";
import ActivityPortfolio from "@/features/activities/ActivityPortfolio";
import SharedFolderSection from "@/components/college-planning/student-summary/SharedFolderSection";
import TaskBoard from "@/features/counselor/follow/TaskBoard";
import MeetingLog from "@/features/counselor/follow/MeetingLog";
import NotesCard from "@/features/counselor/follow/NotesCard";
import { loadTasks } from "@/features/counselor/follow/followData";
import PlanTab from "./plan/PlanTab";
import { gradSummary, studentKind, type EntryTerm, type GradDegree, type GradStatus, type Track } from "@/shared/planning";
import StudentTeamCard from "@/features/team/StudentTeamCard";
import AcademicBriefCard from "@/features/grades/AcademicBriefCard";
import InterviewHistoryCard from "@/features/counselor/InterviewHistoryCard";
import StudentKindBadge from "@/components/StudentKindBadge";
import StudentResumeForm from "@/components/student/resume/StudentResumeForm";
import StudentCustomQuestionsCard from "@/features/mock-interview/StudentCustomQuestionsCard";
import { useStudentQuarters } from "@/components/engines/hooks/useStudentQuarters";
import { useStudentPhase } from "@/components/engines/hooks/useStudentPhase";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

function academicYear(d = new Date()) {
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}
function quarterKey(d = new Date()) {
  const m = d.getMonth();
  if (m >= 8 && m <= 10) return "Q1_fall";
  if (m >= 11 || m <= 1) return "Q2_winter";
  if (m >= 2 && m <= 4) return "Q3_spring";
  return "Q4_summer";
}
const isoDay = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-CA");
};

/**
 * One student, as the service team sees it: a one-line summary, then four
 * tabs. Overview answers "how is this student doing right now".
 */
export default function CounselorStudentPage({ studentId }: { studentId: string }) {
  const { t, lang } = useLanguage();
  const { profile, isLoading } = useStudentData(studentId);
  const track: Track = {
    applicantType: profile?.applicant_type === "graduate" ? "graduate" : "undergrad",
    gradStatus: (profile?.grad_status as GradStatus) || null,
    gradDegree: (profile?.grad_degree as GradDegree) || null,
    entryTerm: (profile?.target_entry_term as EntryTerm) || null,
    entryYear: profile?.target_entry_year || null,
    start: profile?.created_at || null,
  };
  const { phase } = useStudentPhase(studentId);
  const { quarters } = useStudentQuarters(studentId);
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState("overview");

  // Lead counselor, follow-up teachers and admins may change grade / service status.
  const { data: canManage = false } = useQuery({
    queryKey: ["can-manage-team", studentId],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return false;
      const { data } = await db.rpc("can_manage_student_team", { viewer_id: auth.user.id, p_student_id: studentId });
      return data === true;
    },
  });

  const quarter = quarterKey();
  const row = quarters.find((q) => q.quarter === quarter && q.academic_year === academicYear());
  const goals = useMemo(() => {
    try {
      const list = JSON.parse(row?.quarter_kpi || "[]");
      return Array.isArray(list) ? (list as { id: string; text: string; completed: boolean }[]) : [];
    } catch {
      return [];
    }
  }, [row?.quarter_kpi]);
  const done = goals.filter((g) => g.completed).length;

  const { data: upcoming = [] } = useQuery({
    queryKey: ["cs-upcoming", studentId],
    queryFn: async () => {
      const today = isoDay(0);
      const [ms, tasks] = await Promise.all([
        db.from("planning_milestones").select("title, due_date").eq("student_id", studentId).gte("due_date", today).lte("due_date", isoDay(14)),
        loadTasks(studentId),
      ]);
      const ownerZh: Record<string, string> = { student: "", counselor: lang === "zh" ? "顾问 · " : "Counselor · ", parent: lang === "zh" ? "家长 · " : "Parent · " };
      const items: { title: string; due: string; kind: "milestone" | "todo" }[] = [
        ...(ms.data || []).map((m: { title: string; due_date: string }) => ({ title: m.title, due: m.due_date, kind: "milestone" as const })),
        ...tasks
          .filter((x) => !x.completed && x.due && x.due <= isoDay(14) && x.source.kind !== "keydate")
          .map((x) => ({ title: `${ownerZh[x.owner] || ""}${x.title}`, due: x.due as string, kind: "todo" as const })),
      ];
      return items.sort((a, b) => a.due.localeCompare(b.due));
    },
  });

  // one guide for all students: shown the first time a counselor opens any student
  const [me, setMe] = useState<string | null | undefined>(undefined);
  useEffect(() => { void supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null)); }, []);
  const guide = useGuide("counselor-student", me, { auto: !isLoading && !!profile });

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
    );
  }

  const today = isoDay(0);

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-6 sm:pt-10">
      <Link to="/counselor-dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("cs.back")}
      </Link>
      <Tour steps={COUNSELOR_STUDENT_GUIDE} open={guide.open} onClose={guide.close} />
      <header className="mt-3" data-tour="student-header">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-serif text-3xl font-semibold text-pine">{profile.full_name}</h1>
          <div className="flex items-center gap-1">
            <GuideButton onClick={guide.start} />
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="mr-1.5 h-4 w-4" /> {t("st.edit")}
            </Button>
          </div>
        </div>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <StudentKindBadge kind={studentKind(profile)} />
          {track.applicantType === "graduate"
            ? <span>{gradSummary(track, lang).split(" · ").slice(1).join(" · ")}{profile.status === "Completed" ? " · Completed" : ""}</span>
            : studentKind(profile) !== "transfer" && <span>{profile.status || profile.grade || "—"}</span>}
          {profile.school && <>{studentKind(profile) !== "transfer" && <span aria-hidden="true">·</span>}<span>{profile.school}</span></>}
          {phase?.current_phase && <><span aria-hidden="true">·</span><span>{t(`plan.phase.${phase.current_phase}` as MessageKey)}</span></>}
          {goals.length > 0 && <><span aria-hidden="true">·</span><span>{t("home3.goalsLine", { done, total: goals.length })}</span></>}
        </p>
      </header>

      {editing && (
        <StudentStatusDialog open={editing} onOpenChange={setEditing} profile={profile} canChangeStatus={canManage} />
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start sm:inline-flex sm:w-auto">
          <TabsTrigger value="overview" data-tour="tab-overview">{t("cs.tab.overview")}</TabsTrigger>
          <TabsTrigger value="plan" data-tour="tab-plan">{t("cs.tab.plan")}</TabsTrigger>
          <TabsTrigger value="follow" data-tour="tab-follow">{t("cs.tab.follow")}</TabsTrigger>
          <TabsTrigger value="materials" data-tour="tab-materials">{t("cs.tab.materials")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{t("home.thisQuarter", { quarter: t(`plan.quarter.${quarter}` as MessageKey) })}</CardTitle>
                </CardHeader>
                <CardContent>
                  {row?.quarter_focus && <p className="mb-3 text-sm leading-relaxed">{row.quarter_focus}</p>}
                  {goals.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("cs.noGoals")}</p>
                  ) : (
                    <ul className="space-y-2">
                      {goals.map((g) => (
                        <li key={g.id} className="flex items-start gap-2 text-sm">
                          <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${g.completed ? "bg-primary" : "border border-muted-foreground/50"}`} aria-hidden="true" />
                          <span className={g.completed ? "text-muted-foreground line-through" : ""}>{g.text}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg"><CalendarClock className="h-5 w-5 text-primary" />{t("cs.upcoming")}</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t("cs.nothingDue")}</p>
                  ) : (
                    <ul className="divide-y">
                      {upcoming.map((u, i) => (
                        <li key={i} className="flex items-center gap-3 py-2 text-sm">
                          <span className={`w-20 shrink-0 tabular-nums ${u.due < today ? "font-medium text-destructive" : "text-muted-foreground"}`}>{u.due.slice(5)}</span>
                          <span className="min-w-0 flex-1">{u.title}</span>
                          <span className="shrink-0 text-xs text-muted-foreground">{u.kind === "milestone" ? t("cs.kind.milestone") : t("cs.kind.todo")}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <AcademicBriefCard studentId={studentId} />
            </div>
            <div className="space-y-6">
              <StudentTeamCard studentId={studentId} />
              <InterviewHistoryCard studentId={studentId} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="plan" className="mt-6 space-y-6">
          <PlanTab studentId={studentId} studentName={profile.full_name || ""} track={track} onOpenFollow={() => setTab("follow")} />
        </TabsContent>

        <TabsContent value="follow" className="mt-6 space-y-6">
          <TaskBoard studentId={studentId} />
          <MeetingLog studentId={studentId} />
          <NotesCard studentId={studentId} />
        </TabsContent>

        <TabsContent value="materials" className="mt-6 space-y-6">
          <StudentProfile profile={profile} statusText={track.applicantType === "graduate" ? gradSummary(track, lang).split(" · ").slice(1).join(" · ") : undefined} />
          <ActivityPortfolio studentId={studentId} />
          <SharedFolderSection studentId={studentId} />
          <StudentCustomQuestionsCard studentId={studentId} />
          {canManage && (
            <section aria-labelledby="resume-heading" className="space-y-3">
              <h2 id="resume-heading" className="font-serif text-xl font-semibold text-pine">{t("dash.info.resume")}</h2>
              <StudentResumeForm studentId={studentId} />
            </section>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
