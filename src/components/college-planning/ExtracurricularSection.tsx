import { useState } from "react";
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
    timeCommitment: "",
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

  const handleActivityChange = (field: string, value: string) => {
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
            ...newActivity,
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
        timeCommitment: "",
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
        <Button onClick={() => setIsDialogOpen(true)} variant="outline" size="sm">
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