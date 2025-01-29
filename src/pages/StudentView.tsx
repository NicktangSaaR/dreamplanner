import { useParams } from "react-router-dom";
import DashboardHeader from "@/components/college-planning/DashboardHeader";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import StatisticsCards from "@/components/college-planning/StatisticsCards";
import TodoSection from "@/components/college-planning/TodoSection";
import SharedFolderCard from "@/components/college-planning/SharedFolderCard";
import { useState } from "react";
import SharedFolderDialog from "@/components/college-planning/SharedFolderDialog";
import { toast } from "sonner";
import ActivitiesSection from "@/components/college-planning/student-summary/ActivitiesSection";

export default function StudentView() {
  const { studentId } = useParams();
  const [isEditingFolder, setIsEditingFolder] = useState(false);

  console.log("StudentView - Viewing student:", studentId);

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
      
      // Transform the data to match the expected format
      return data.map(activity => ({
        id: activity.id,
        name: activity.name,
        role: activity.role,
        description: activity.description,
        timeCommitment: activity.time_commitment, // Transform snake_case to camelCase
      }));
    },
  });

  const { data: notes = [], isLoading: isLoadingNotes } = useQuery({
    queryKey: ["student-notes", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("notes")
        .select("*")
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
    } catch (error) {
      console.error("Error saving folder:", error);
      toast.error("Failed to save folder");
    }
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

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DashboardHeader />
      
      <div className="space-y-6">
        {/* Profile Summary Card */}
        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">{profile.full_name}</h2>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Grade:</span> {profile.grade || "Not set"}</p>
                  <p><span className="font-medium">School:</span> {profile.school || "Not set"}</p>
                  {profile.interested_majors && profile.interested_majors.length > 0 && (
                    <p><span className="font-medium">Interested Majors:</span> {profile.interested_majors.join(", ")}</p>
                  )}
                  {profile.graduation_school && (
                    <p><span className="font-medium">Graduation School:</span> {profile.graduation_school}</p>
                  )}
                </div>
              </div>
              <div>
                {profile.background_intro && (
                  <div>
                    <h3 className="font-medium mb-2">Background</h3>
                    <p className="text-sm text-muted-foreground">{profile.background_intro}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Overview */}
        <StatisticsCards
          courses={courses}
          activities={activities}
          notes={notes}
          todoStats={todoStats}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            <TodoSection />
            <SharedFolderCard
              folder={sharedFolder}
              onEditClick={() => setIsEditingFolder(true)}
            />
          </div>

          {/* Right Column - Scrollable Notes */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Notes</h3>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="p-4 rounded-lg border bg-card"
                    >
                      <h4 className="font-medium">{note.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{note.content}</p>
                      <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
                        <span>{new Date(note.created_at!).toLocaleDateString()}</span>
                        {note.author_name && <span>By: {note.author_name}</span>}
                      </div>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <p className="text-center text-muted-foreground">No notes found</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
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