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

  const handleAddActivity = useCallback(() => {
    if (newActivity.name && newActivity.role) {
      console.log("Adding new activity:", newActivity);
      const activityToAdd = {
        id: Date.now().toString(),
        ...newActivity,
      };
      
      setActivities(prevActivities => [...prevActivities, activityToAdd]);
      setNewActivity({
        name: "",
        role: "",
        description: "",
        timeCommitment: "",
      });
    }
  }, [newActivity]);

  const handleActivityChange = useCallback((field: string, value: string) => {
    setNewActivity(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleEditActivity = useCallback((activity: Activity) => {
    setEditingActivity(activity);
  }, []);

  const handleEditingActivityChange = useCallback((field: string, value: string) => {
    setEditingActivity(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingActivity) {
      setActivities(prevActivities =>
        prevActivities.map(activity =>
          activity.id === editingActivity.id ? editingActivity : activity
        )
      );
      setEditingActivity(null);
    }
  }, [editingActivity]);

  // Notify parent only when activities change and are valid
  useEffect(() => {
    if (onActivitiesChange && Array.isArray(activities)) {
      console.log("Activities changed:", activities);
      onActivitiesChange(activities);
    }
  }, [activities, onActivitiesChange]);

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