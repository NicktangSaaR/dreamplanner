
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import ActivityList from "./extracurricular/ActivityList";
import ActivityFormDialog from "./extracurricular/ActivityFormDialog";

export default function ExtracurricularSection({ onActivitiesChange }: { onActivitiesChange?: (activities: any[]) => void }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: "",
    role: "",
    description: "",
    time_commitment: "",
    grade_levels: [] as string[],
  });
  const { toast } = useToast();

  const { data: activities = [], refetch } = useQuery({
    queryKey: ["extracurricular-activities"],
    queryFn: async () => {
      console.log("Fetching extracurricular activities");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("extracurricular_activities")
        .select("*")
        .eq("student_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      console.log("Activities fetched:", data);
      return data || [];
    },
  });

  // 添加实时订阅
  useEffect(() => {
    const { data: { user } } = supabase.auth.getUser();
    if (!user) return;

    console.log("Setting up realtime subscription for activities");
    
    const channel = supabase.channel('activities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'extracurricular_activities',
          filter: `student_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Activity changed, refreshing...', payload);
          await refetch();
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const handleActivityChange = (field: string, value: string | string[]) => {
    setNewActivity((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddActivity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { error } = await supabase
        .from("extracurricular_activities")
        .insert([
          {
            name: newActivity.name,
            role: newActivity.role,
            description: newActivity.description,
            time_commitment: newActivity.time_commitment,
            grade_levels: newActivity.grade_levels,
            student_id: user.id,
          },
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Activity added successfully",
      });

      // Reset form and close dialog
      setNewActivity({
        name: "",
        role: "",
        description: "",
        time_commitment: "",
        grade_levels: [],
      });
      setIsDialogOpen(false);
      
      // Refetch activities
      await refetch();
      
      // Notify parent component if callback exists
      if (onActivitiesChange) {
        const updatedActivities = await refetch();
        if (updatedActivities.data) {
          onActivitiesChange(updatedActivities.data);
        }
      }
    } catch (error) {
      console.error("Error adding activity:", error);
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-lg font-semibold">Extracurricular Activities</h3>
        <Button 
          onClick={() => setIsDialogOpen(true)} 
          className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Activity
        </Button>
      </CardHeader>
      <CardContent>
        <ActivityList activities={activities} />
        <ActivityFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          newActivity={newActivity}
          onActivityChange={handleActivityChange}
          onAddActivity={handleAddActivity}
        />
      </CardContent>
    </Card>
  );
}
