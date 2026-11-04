
import { Toaster } from "@/components/ui/toaster";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import EnginesDashboard from "@/components/engines/EnginesDashboard";
import { useProfile } from "@/hooks/useProfile";
import { QueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/i18n/LanguageProvider";

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
  // Students read their plan; counselors and admins edit it from their own views.
  const isStudent = profile?.user_type === "student";

  return (
    <>
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <DashboardHeader />

          <section aria-labelledby="plan-heading">
            <h2 id="plan-heading" className="font-serif text-2xl font-semibold text-pine">{t("dash.planHeading")}</h2>
            {isStudent && <p className="mt-1 text-sm text-muted-foreground">{t("dash.planHint")}</p>}
            <div className="mt-4">
              <EnginesDashboard
                studentId={studentId}
                grade={profile?.status || profile?.grade}
                readOnly={isStudent}
              />
            </div>
          </section>
          <section className="mt-12" aria-labelledby="work-heading">
            <h2 id="work-heading" className="mb-4 font-serif text-2xl font-semibold text-pine">{t("dash.workHeading")}</h2>
            <DashboardTabs
              courses={courses}
              onCoursesChange={(newCourses) => {
                queryClient.setQueryData(["student-courses", studentId], newCourses);
              }}
              onActivitiesChange={(newActivities) => {
                queryClient.setQueryData(["student-activities", studentId], newActivities);
              }}
              onNotesChange={(newNotes) => {
                queryClient.setQueryData(["student-notes", studentId], newNotes);
              }}
              studentId={studentId}
            />
          </section>
        </div>
      </div>
    </>
  );
}
