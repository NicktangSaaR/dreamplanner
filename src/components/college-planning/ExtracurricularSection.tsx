import { useState, useEffect } from "react";
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

  // Notify parent of activities changes, but only when activities actually change
  useEffect(() => {
    if (onActivitiesChange) {
      console.log("Activities state changed:", activities);
      // Prevent unnecessary parent updates if activities are empty
      if (activities.length > 0 || activities.length === 0) {
        onActivitiesChange(activities);
      }
    }
  }, [activities]);

  const handleAddActivity = () => {
    if (newActivity.name && newActivity.role) {
      console.log("Adding new activity:", newActivity);
      const newActivityWithId = {
        id: Date.now().toString(),
        ...newActivity,
      };
      
      setActivities(prevActivities => [...prevActivities, newActivityWithId]);
      
      // Reset form after adding
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
        prevActivities.map(activity =>
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