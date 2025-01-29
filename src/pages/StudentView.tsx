import { useParams } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import TodoSection from "@/components/college-planning/TodoSection";
import SharedFolderCard from "@/components/college-planning/SharedFolderCard";
import { useState, useEffect } from "react";
import SharedFolderDialog from "@/components/college-planning/SharedFolderDialog";
import { toast } from "sonner";
import StudentProfile from "@/components/college-planning/student-summary/StudentProfile";
import RecentNotes from "@/components/college-planning/student-summary/RecentNotes";
import ActivitiesSection from "@/components/college-planning/student-summary/ActivitiesSection";
import AcademicSection from "@/components/college-planning/student-summary/AcademicSection";

export default function StudentView() {
  const { studentId } = useParams();
  const [isEditingFolder, setIsEditingFolder] = useState(false);
  const queryClient = useQueryClient();

  console.log("StudentView - Viewing student:", studentId);

  // Set up real-time subscription for all relevant tables
  useEffect(() => {
    if (!studentId) return;

    const channels = [
      supabase
        .channel('student_data_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'courses',
            filter: `student_id=eq.${studentId}`,
          },
          () => {
            console.log('Courses changed, refreshing...');
            queryClient.invalidateQueries({ queryKey: ["student-courses", studentId] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'extracurricular_activities',
            filter: `student_id=eq.${studentId}`,
          },
          () => {
            console.log('Activities changed, refreshing...');
            queryClient.invalidateQueries({ queryKey: ["student-activities", studentId] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notes',
            filter: `author_id=eq.${studentId}`,
          },
          () => {
            console.log('Notes changed, refreshing...');
            queryClient.invalidateQueries({ queryKey: ["student-notes", studentId] });
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'todos',
            filter: `author_id=eq.${studentId}`,
          },
          () => {
            console.log('Todos changed, refreshing...');
            queryClient.invalidateQueries({ queryKey: ["student-todos", studentId] });
          }
        )
        .subscribe();

    return () => {
      channels.unsubscribe();
    };
  }, [studentId, queryClient]);

  const { data: profile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) throw new Error("No student ID provided");
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", studentId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["student-courses", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    },
  });

  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ["student-activities", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("extracurricular_activities")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data;
    },
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["student-notes", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("author_id", studentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const { data: todos = [], isLoading: isLoadingTodos } = useQuery({
    queryKey: ["student-todos", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("author_id", studentId);

      if (error) throw error;
      return data;
    },
  });

  const { data: sharedFolder } = useQuery({
    queryKey: ["shared-folder", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from("shared_folders")
        .select("*")
        .eq("created_by", studentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const handleSaveFolder = async (data: { title: string; folder_url: string; description?: string }) => {
    try {
      if (!studentId) throw new Error("No student ID provided");

      const { error } = await supabase
        .from("shared_folders")
        .upsert({
          created_by: studentId,
          ...data,
        });

      if (error) throw error;

      toast.success("Folder saved successfully");
      setIsEditingFolder(false);
      queryClient.invalidateQueries({ queryKey: ["shared-folder", studentId] });
    } catch (error) {
      console.error("Error saving folder:", error);
      toast.error("Failed to save folder");
    }
  };

  const handleNotesChange = () => {
    queryClient.invalidateQueries({ queryKey: ["student-notes", studentId] });
  };

  const isLoading = isLoadingProfile || isLoadingCourses || isLoadingActivities || isLoadingNotes || isLoadingTodos;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return <div>Student not found</div>;
  }

  const todoStats = {
    completed: todos.filter(todo => todo.completed).length,
    starred: todos.filter(todo => todo.starred).length,
    total: todos.length,
  };

  const transformedActivities = activities.map(activity => ({
    timeCommitment: activity.time_commitment || "",
  }));

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader />
      
      <div className="space-y-6">
        <StudentProfile profile={profile} />
        
        <StatisticsCards
          courses={courses}
          activities={transformedActivities}
          notes={notes}
          todoStats={todoStats}
        />

        <AcademicSection 
          courses={courses} 
          studentId={studentId || ""}
        />
        
        <ActivitiesSection activities={activities} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <TodoSection />
            <SharedFolderCard
              folder={sharedFolder}
              onEditClick={() => setIsEditingFolder(true)}
            />
          </div>

          <RecentNotes 
            notes={notes} 
            studentId={studentId || ""} 
            onNotesChange={handleNotesChange}
          />
        </div>
      </div>

      <SharedFolderDialog
        open={isEditingFolder}
        onOpenChange={setIsEditingFolder}
        onSubmit={handleSaveFolder}
      />
    </div>
  );
}