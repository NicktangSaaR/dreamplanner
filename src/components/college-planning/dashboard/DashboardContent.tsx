
import { Toaster } from "@/components/ui/toaster";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import { useProfile } from "@/hooks/useProfile";
import { QueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageProvider";
import CurrentPlanCard from "@/features/student-home/CurrentPlanCard";
import StudentTodoPanel from "@/features/student-home/StudentTodoPanel";
import StudentInfoTabs from "@/features/student-home/StudentInfoTabs";

interface DashboardContentProps {
  studentId: string;
  courses: any[];
  activities: any[];
  notes: any[];
  queryClient: QueryClient;
}

export default function DashboardContent({
  studentId,
  courses,
  activities,
  notes,
  queryClient
}: DashboardContentProps) {
  const { profile } = useProfile();
  const { t } = useLanguage();
  return (
      <>
        <Toaster />
        <div className="container mx-auto px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <DashboardHeader />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start">
              <section aria-labelledby="plan-heading">
                <h2 id="plan-heading" className="mb-3 font-serif text-2xl font-semibold text-pine">{t("dash.planHeading")}</h2>
                <CurrentPlanCard studentId={studentId} grade={profile?.status || profile?.grade} />
              </section>
              <section aria-label={t("home.todo.title")} className="lg:pt-11">
                <StudentTodoPanel studentId={studentId} />
              </section>
            </div>
            <section className="mt-12" aria-labelledby="info-heading">
              <h2 id="info-heading" className="mb-4 font-serif text-2xl font-semibold text-pine">{t("dash.tab.info")}</h2>
              <StudentInfoTabs
                studentId={studentId}
                onNotesChange={(n) => queryClient.setQueryData(["student-notes", studentId], n)}
              />
            </section>
          </div>
        </div>
      </>
  );
}
