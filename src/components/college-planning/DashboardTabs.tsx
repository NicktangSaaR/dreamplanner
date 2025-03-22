
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AcademicsSection from "./AcademicsSection";
import ExtracurricularSection from "./ExtracurricularSection";
import NotesSection from "./NotesSection";
import TodoSection from "./TodoSection";
import CollegeListSection from "./CollegeListSection";
import { Course } from "./types/course";

interface DashboardTabsProps {
  courses: Course[];
  onCoursesChange: (courses: Course[]) => void;
  onActivitiesChange: (activities: any[]) => void;
  onNotesChange: (notes: any[]) => void;
  studentId: string;
}

export default function DashboardTabs({
  courses,
  onCoursesChange,
  onActivitiesChange,
  onNotesChange,
  studentId,
}: DashboardTabsProps) {
  console.log("DashboardTabs - Received courses:", courses);

  return (
    <Tabs defaultValue="academics" className="w-full">
      <TabsList className="grid w-full grid-cols-5 bg-card">
        <TabsTrigger 
          value="academics"
          className="data-[state=active]:after:bg-[#0EA5E9] data-[state=inactive]:bg-[#E1F5FE] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px] transition-colors"
        >
          Academics
        </TabsTrigger>
        <TabsTrigger 
          value="extracurricular"
          className="data-[state=active]:after:bg-[#8B5CF6] data-[state=inactive]:bg-[#EDE9FE] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px] transition-colors"
        >
          Extracurricular
        </TabsTrigger>
        <TabsTrigger 
          value="notes"
          className="data-[state=active]:after:bg-[#D946EF] data-[state=inactive]:bg-[#FAE8FF] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px] transition-colors"
        >
          Notes
        </TabsTrigger>
        <TabsTrigger 
          value="todos"
          className="data-[state=active]:after:bg-[#F97316] data-[state=inactive]:bg-[#FFF1E7] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px] transition-colors"
        >
          To-Dos
        </TabsTrigger>
        <TabsTrigger 
          value="colleges"
          className="data-[state=active]:after:bg-[#10B981] data-[state=inactive]:bg-[#E6FEF8] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px] transition-colors"
        >
          College List
        </TabsTrigger>
      </TabsList>
      <TabsContent value="academics" className="mt-6">
        <AcademicsSection 
          courses={courses}
          onCoursesChange={onCoursesChange}
        />
      </TabsContent>
      <TabsContent value="extracurricular">
        <ExtracurricularSection onActivitiesChange={onActivitiesChange} />
      </TabsContent>
      <TabsContent value="notes">
        <NotesSection 
          onNotesChange={onNotesChange} 
          studentId={studentId}
        />
      </TabsContent>
      <TabsContent value="todos">
        <TodoSection />
      </TabsContent>
      <TabsContent value="colleges">
        <CollegeListSection />
      </TabsContent>
    </Tabs>
  );
}
