import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AcademicsSection from "@/components/college-planning/AcademicsSection";
import ExtracurricularSection from "@/components/college-planning/ExtracurricularSection";
import NotesSection from "@/components/college-planning/NotesSection";
import StudentResumeForm from "@/components/student/resume/StudentResumeForm";
import type { Course } from "@/components/college-planning/types/course";
import { useLanguage } from "@/i18n/LanguageProvider";

interface Props {
  studentId: string;
  courses: Course[];
  onCoursesChange: (courses: Course[]) => void;
  onActivitiesChange: (activities: unknown[]) => void;
  onNotesChange: (notes: unknown[]) => void;
}

/** The student's own information and notes, shared with their counselor. */
export default function StudentInfoTabs({ studentId, courses, onCoursesChange, onActivitiesChange, onNotesChange }: Props) {
  const { t } = useLanguage();
  return (
    <Tabs defaultValue="academics" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start sm:w-auto sm:inline-flex">
        <TabsTrigger value="academics">{t("dash.info.academics")}</TabsTrigger>
        <TabsTrigger value="activities">{t("dash.info.activities")}</TabsTrigger>
        <TabsTrigger value="resume">{t("dash.info.resume")}</TabsTrigger>
        <TabsTrigger value="notes">{t("dash.tab.notes")}</TabsTrigger>
      </TabsList>
      <TabsContent value="academics" className="mt-6">
        <AcademicsSection courses={courses} onCoursesChange={onCoursesChange} />
      </TabsContent>
      <TabsContent value="activities" className="mt-6">
        <ExtracurricularSection onActivitiesChange={onActivitiesChange as never} />
      </TabsContent>
      <TabsContent value="resume" className="mt-6">
        <StudentResumeForm />
      </TabsContent>
      <TabsContent value="notes" className="mt-6">
        <NotesSection onNotesChange={onNotesChange as never} studentId={studentId} />
      </TabsContent>
    </Tabs>
  );
}
