
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
          className="data-[state=active]:after:bg-[#0EA5E9] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px]"
        >
          Academics
        </TabsTrigger>
        <TabsTrigger 
          value="extracurricular"
          className="data-[state=active]:after:bg-[#8B5CF6] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px]"
        >
          Extracurricular
        </TabsTrigger>
        <TabsTrigger 
          value="notes"
          className="data-[state=active]:after:bg-[#D946EF] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px]"
        >
          Notes
        </TabsTrigger>
        <TabsTrigger 
          value="todos"
          className="data-[state=active]:after:bg-[#F97316] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px]"
        >
          To-Dos
        </TabsTrigger>
        <TabsTrigger 
          value="colleges"
          className="data-[state=active]:after:bg-[#10B981] relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:translate-y-[1px]"
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
