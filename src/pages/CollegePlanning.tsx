
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
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
  const { profile } = useProfile();

  useEffect(() => {
    if (profile?.user_type === 'counselor') {
      navigate('/counselor-dashboard');
    }
  }, [profile, navigate]);

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
            studentId={profile?.id || ''}
          />
        </div>
        <div className="mt-8">
          <DashboardTabs
            courses={courses}
            onCoursesChange={handleCoursesChange}
            onActivitiesChange={setActivities}
            onNotesChange={setNotes}
            studentId={profile?.id || ''}
          />
        </div>
      </div>
    </div>
  );
}
