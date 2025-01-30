import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ActivityForm from "./extracurricular/ActivityForm";
import ActivityTable from "./extracurricular/ActivityTable";
import { Activity } from "./types/activity";

interface ExtracurricularSectionProps {
  onActivitiesChange?: (activities: Activity[]) => void;
}

export default function ExtracurricularSection({ onActivitiesChange }: ExtracurricularSectionProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [newActivity, setNewActivity] = useState({
    name: "",
    role: "",
    description: "",
    timeCommitment: "",
  });

  // Only notify parent of activities changes when they actually change
  useEffect(() => {
    if (onActivitiesChange) {
      console.log("Activities changed, notifying parent:", activities);
      onActivitiesChange(activities);
    }
  }, [activities, onActivitiesChange]);

  const handleAddActivity = () => {
    if (newActivity.name && newActivity.role) {
      console.log("Adding new activity:", newActivity);
      setActivities(prevActivities => [
        ...prevActivities,
        {
          id: Date.now().toString(),
          ...newActivity,
        },
      ]);
      setNewActivity({
        name: "",
        role: "",
        description: "",
        timeCommitment: "",
      });
    }
  };

  const handleActivityChange = (field: string, value: string) => {
    setNewActivity(prev => ({ ...prev, [field]: value }));
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleEditingActivityChange = (field: string, value: string) => {
    if (editingActivity) {
      setEditingActivity(prev => ({
        ...prev!,
        [field]: value,
      }));
    }
  };

  const handleSaveEdit = () => {
    if (editingActivity) {
      setActivities(prevActivities =>
        prevActivities.map((activity) =>
          activity.id === editingActivity.id ? editingActivity : activity
        )
      );
      setEditingActivity(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extracurricular Activities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <ActivityForm
          newActivity={newActivity}
          onActivityChange={handleActivityChange}
          onAddActivity={handleAddActivity}
        />
        <ActivityTable
          activities={activities}
          editingActivity={editingActivity}
          onEditActivity={handleEditActivity}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingActivity(null)}
          onEditingActivityChange={handleEditingActivityChange}
        />
      </CardContent>
    </Card>
  );
}