import { useParams } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useState } from "react";
import { Course } from "@/components/college-planning/types/course";

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
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="max-w-7xl mx-auto">
        <DashboardHeader />
        <div className="mt-8">
          <StatisticsCards 
            courses={courses}
            activities={activities}
            notes={notes}
            todoStats={getTodoStats()}
          />
        </div>
        <div className="mt-8">
          <DashboardTabs
            courses={courses}
            onCoursesChange={setCourses}
            onActivitiesChange={setActivities}
            onNotesChange={setNotes}
          />
        </div>
      </div>
    </div>
  );
}