
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity } from "../types/activity";
import { toast } from "sonner";
import ActivityTable from "./ActivityTable";

interface ActivityListProps {
  activities: Activity[];
}

export default function ActivityList({ activities }: ActivityListProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const queryClient = useQueryClient();

  const handleEditActivity = (activity: Activity) => {
    console.log("Editing activity:", activity);
    setEditingActivity(activity);
  };

  const handleEditingActivityChange = (field: string, value: string | string[]) => {
    if (editingActivity) {
      console.log(`Updating ${field} with value:`, value);
      setEditingActivity({
        ...editingActivity,
        [field]: value,
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingActivity) return;

    try {
      console.log("Saving activity with data:", editingActivity);
      const { error } = await supabase
        .from("extracurricular_activities")
        .update({
          name: editingActivity.name,
          role: editingActivity.role,
          description: editingActivity.description,
          time_commitment: editingActivity.time_commitment,
          grade_levels: editingActivity.grade_levels || [],
        })
        .eq("id", editingActivity.id);

      if (error) throw error;

      toast.success("活动更新成功");
      await queryClient.invalidateQueries({ queryKey: ["student-activities", editingActivity.student_id] });
      setEditingActivity(null);
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("更新活动失败");
    }
  };

  const handleCancelEdit = () => {
    setEditingActivity(null);
  };

  const handleDeleteActivity = async (activityId: string) => {
    try {
      const { error } = await supabase
        .from("extracurricular_activities")
        .delete()
        .eq("id", activityId);

      if (error) throw error;

      toast.success("活动删除成功");
      await queryClient.invalidateQueries({ queryKey: ["student-activities"] });
    } catch (error) {
      console.error("Error deleting activity:", error);
      toast.error("删除活动失败");
    }
  };

  return (
    <ActivityTable
      activities={activities}
      editingActivity={editingActivity}
      onEditActivity={handleEditActivity}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={handleCancelEdit}
      onEditingActivityChange={handleEditingActivityChange}
      onDeleteActivity={handleDeleteActivity}
    />
  );
}
