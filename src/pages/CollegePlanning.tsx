import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useTodos } from "@/hooks/useTodos";
import { useProfile } from "@/hooks/useProfile";
import { Course } from "@/components/college-planning/types/course";

interface ActivityType {
  id: string;
  name: string;
  role: string;
  description: string;
  timeCommitment: string;
}

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export default function CollegePlanning() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { todos } = useTodos();
  const { profile } = useProfile();

  useEffect(() => {
    if (profile?.user_type === 'counselor') {
      navigate('/counselor-dashboard');
    }
  }, [profile, navigate]);

  const getTodoStats = () => {
    const completed = todos.filter(todo => todo.completed).length;
    const starred = todos.filter(todo => todo.starred).length;
    const total = todos.length;
    return { completed, starred, total };
  };

  const handleCoursesChange = (newCourses: Course[]) => {
    setCourses(newCourses);
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
            onCoursesChange={handleCoursesChange}
            onActivitiesChange={setActivities}
            onNotesChange={setNotes}
          />
        </div>
      </div>
    </div>
  );
}