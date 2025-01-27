import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useTodos } from "@/hooks/useTodos";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface Course {
  id: string;
  name: string;
  grade: string;
  semester: string;
}

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

export default function StudentDashboard() {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { todos } = useTodos();

  useEffect(() => {
    if (profile?.user_type !== 'counselor') {
      navigate('/college-planning');
    }
  }, [profile, navigate]);

  const getTodoStats = () => {
    const completed = todos.filter(todo => todo.completed).length;
    const starred = todos.filter(todo => todo.starred).length;
    const total = todos.length;
    return { completed, starred, total };
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate('/counselor-dashboard')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <DashboardHeader />
      </div>

      <StatisticsCards
        courses={courses}
        activities={activities}
        notes={notes}
        todoStats={getTodoStats()}
      />

      <DashboardTabs
        courses={courses}
        onCoursesChange={setCourses}
        onActivitiesChange={setActivities}
        onNotesChange={setNotes}
      />
    </div>
  );
}