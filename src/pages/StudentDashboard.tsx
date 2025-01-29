import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import DashboardTabs from "@/components/college-planning/DashboardTabs";
import { useTodos } from "@/hooks/useTodos";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Course } from "@/components/college-planning/types/course";
import { toast } from "sonner";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import ActiveUsersDisplay from "@/components/college-planning/ActiveUsersDisplay";
import { usePresence } from "@/hooks/usePresence";
import { useAccessControl } from "@/hooks/useAccessControl";

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
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const { todos } = useTodos();
  const { activeUsers } = usePresence(studentId, profile);
  const { hasAccess, checkingAccess } = useAccessControl(studentId, profile);

  // Set up real-time subscriptions for data changes
  useEffect(() => {
    if (!studentId || !hasAccess) return;

    console.log("Setting up real-time subscriptions");

    const changesChannel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        (payload) => {
          console.log('Course change received:', payload);
          refetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'extracurricular_activities' },
        (payload) => {
          console.log('Activity change received:', payload);
          refetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes' },
        (payload) => {
          console.log('Note change received:', payload);
          refetchData();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up real-time subscriptions");
      supabase.removeChannel(changesChannel);
    };
  }, [studentId, hasAccess]);

  // Fetch student profile and handle access control
  const { refetch: refetchData } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("No student ID provided");
      
      console.log("Fetching student profile data");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching student profile:", error);
        throw error;
      }

      console.log("Student profile data:", data);
      return data;
    },
    enabled: !!studentId && hasAccess === true,
  });

  useEffect(() => {
    if (!checkingAccess && hasAccess === false) {
      toast.error("You don't have permission to view this page");
      navigate('/college-planning');
    }
  }, [hasAccess, checkingAccess, navigate]);

  const getTodoStats = () => {
    const completed = todos.filter(todo => todo.completed).length;
    const starred = todos.filter(todo => todo.starred).length;
    const total = todos.length;
    return { completed, starred, total };
  };

  const handleNotesChange = (newNotes: Note[]) => {
    console.log("Updating notes:", newNotes);
    setNotes(newNotes);
  };

  const handleCoursesChange = (newCourses: Course[]) => {
    console.log("Updating courses:", newCourses);
    setCourses(newCourses);
  };

  if (checkingAccess) {
    return <div>Loading...</div>;
  }

  if (!studentId || !hasAccess) {
    return null;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader />
      <ActiveUsersDisplay activeUsers={activeUsers} />
      <StatisticsCards
        courses={courses}
        activities={activities}
        notes={notes}
        todoStats={getTodoStats()}
      />
      <DashboardTabs
        courses={courses}
        onCoursesChange={handleCoursesChange}
        onActivitiesChange={setActivities}
        onNotesChange={handleNotesChange}
      />
    </div>
  );
}