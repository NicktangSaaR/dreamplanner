import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NotesSection from "@/components/college-planning/NotesSection";
import StudentResumeForm from "@/components/student/resume/StudentResumeForm";
import StudentReportCards from "@/features/grades/StudentReportCards";
import { useLanguage } from "@/i18n/LanguageProvider";

interface Props {
  studentId: string;
  onNotesChange: (notes: unknown[]) => void;
}

/** The student's own uploads and notes: report cards, notes, resume. */
export default function StudentInfoTabs({ studentId, onNotesChange }: Props) {
  const { t } = useLanguage();
  return (
    <Tabs defaultValue="grades" className="w-full">
      <TabsList className="flex h-auto w-full flex-wrap justify-start sm:inline-flex sm:w-auto">
        <TabsTrigger value="grades">{t("grades.tab")}</TabsTrigger>
        <TabsTrigger value="notes">{t("dash.tab.notes")}</TabsTrigger>
        <TabsTrigger value="resume">{t("dash.info.resume")}</TabsTrigger>
      </TabsList>
      <TabsContent value="grades" className="mt-6">
        <StudentReportCards studentId={studentId} />
      </TabsContent>
      <TabsContent value="notes" className="mt-6">
        <NotesSection onNotesChange={onNotesChange as never} studentId={studentId} />
      </TabsContent>
      <TabsContent value="resume" className="mt-6">
        <StudentResumeForm />
      </TabsContent>
    </Tabs>
  );
}
