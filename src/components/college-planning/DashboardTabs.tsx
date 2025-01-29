import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AcademicsSection from "./AcademicsSection";
import ExtracurricularSection from "./ExtracurricularSection";
import NotesSection from "./NotesSection";
import TodoSection from "./TodoSection";
import { Course } from "./types/course";

interface DashboardTabsProps {
  courses: Course[];
  onCoursesChange: (courses: Course[]) => void;
  onActivitiesChange: (activities: any[]) => void;
  onNotesChange: (notes: any[]) => void;
}

export default function DashboardTabs({
  courses,
  onCoursesChange,
  onActivitiesChange,
  onNotesChange,
}: DashboardTabsProps) {
  console.log("DashboardTabs - Current courses:", courses);

  return (
    <Tabs defaultValue="academics" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="academics">Academics</TabsTrigger>
        <TabsTrigger value="extracurricular">Extracurricular</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
        <TabsTrigger value="todos">To-Dos</TabsTrigger>
      </TabsList>
      <TabsContent value="academics">
        <AcademicsSection 
          courses={courses}
          onCoursesChange={onCoursesChange}
        />
      </TabsContent>
      <TabsContent value="extracurricular">
        <ExtracurricularSection onActivitiesChange={onActivitiesChange} />
      </TabsContent>
      <TabsContent value="notes">
        <NotesSection onNotesChange={onNotesChange} />
      </TabsContent>
      <TabsContent value="todos">
        <TodoSection />
      </TabsContent>
    </Tabs>
  );
}