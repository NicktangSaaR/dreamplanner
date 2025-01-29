import { useParams } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import AcademicsSection from "@/components/college-planning/AcademicsSection";
import ExtracurricularSection from "@/components/college-planning/ExtracurricularSection";
import NotesSection from "@/components/college-planning/NotesSection";
import TodoSection from "@/components/college-planning/TodoSection";
import CollegeListSection from "@/components/college-planning/CollegeListSection";
import { useState } from "react";
import { Course } from "@/components/college-planning/types/course";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function StudentDashboard() {
  const { studentId } = useParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  console.log("StudentDashboard - Student ID:", studentId);

  const getTodoStats = () => {
    return {
      completed: 0,
      starred: 0,
      total: 0
    };
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <DashboardHeader />
        
        <StatisticsCards 
          courses={courses}
          activities={activities}
          notes={notes}
          todoStats={getTodoStats()}
        />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-8">
            <ScrollArea className="h-[calc(100vh-2rem)]">
              <div className="space-y-8 pr-4">
                <AcademicsSection
                  courses={courses}
                  onCoursesChange={setCourses}
                />
                <ExtracurricularSection 
                  onActivitiesChange={setActivities}
                />
              </div>
            </ScrollArea>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <ScrollArea className="h-[calc(100vh-2rem)]">
              <div className="space-y-8 pr-4">
                <CollegeListSection />
                <NotesSection 
                  onNotesChange={setNotes}
                />
                <TodoSection />
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}