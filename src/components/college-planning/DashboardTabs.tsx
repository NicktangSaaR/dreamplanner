import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AcademicsSection from "./AcademicsSection";
import ExtracurricularSection from "./ExtracurricularSection";
import NotesSection from "./NotesSection";
import TodoSection from "./TodoSection";
import CalendarSection from "./CalendarSection";
import StudentResumeForm from "@/components/student/resume/StudentResumeForm";
import { Course } from "./types/course";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

interface DashboardTabsProps {
  courses: Course[];
  onCoursesChange: (courses: Course[]) => void;
  onActivitiesChange: (activities: any[]) => void;
  onNotesChange: (notes: any[]) => void;
  studentId: string;
}

type InfoView = "academics" | "activities" | "resume";

/**
 * The student's working area: their own information, to-dos with the
 * calendar, and notes shared with the counselor.
 */
export default function DashboardTabs({
  courses,
  onCoursesChange,
  onActivitiesChange,
  onNotesChange,
  studentId,
}: DashboardTabsProps) {
  const { t } = useLanguage();
  const [infoView, setInfoView] = useState<InfoView>("academics");
  const infoViews: { key: InfoView; label: string }[] = [
    { key: "academics", label: t("dash.info.academics") },
    { key: "activities", label: t("dash.info.activities") },
    { key: "resume", label: t("dash.info.resume") },
  ];

  return (
    <Tabs defaultValue="todos" className="w-full">
      <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
        <TabsTrigger value="todos">{t("dash.tab.todos")}</TabsTrigger>
        <TabsTrigger value="info">{t("dash.tab.info")}</TabsTrigger>
        <TabsTrigger value="notes">{t("dash.tab.notes")}</TabsTrigger>
      </TabsList>

      <TabsContent value="todos" className="mt-6 space-y-6">
        <TodoSection />
        <CalendarSection />
      </TabsContent>

      <TabsContent value="info" className="mt-6">
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label={t("dash.tab.info")}>
          {infoViews.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setInfoView(v.key)}
              aria-pressed={infoView === v.key}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                infoView === v.key ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        {infoView === "academics" && <AcademicsSection courses={courses} onCoursesChange={onCoursesChange} />}
        {infoView === "activities" && <ExtracurricularSection onActivitiesChange={onActivitiesChange} />}
        {infoView === "resume" && <StudentResumeForm />}
      </TabsContent>

      <TabsContent value="notes" className="mt-6">
        <NotesSection onNotesChange={onNotesChange} studentId={studentId} />
      </TabsContent>
    </Tabs>
  );
}
