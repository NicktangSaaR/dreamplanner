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

  useEffect(() => {
    onActivitiesChange?.(activities);
  }, [activities, onActivitiesChange]);

  const handleAddActivity = () => {
    if (newActivity.name && newActivity.role) {
      setActivities([
        ...activities,
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
    setNewActivity({ ...newActivity, [field]: value });
  };

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleEditingActivityChange = (field: string, value: string) => {
    if (editingActivity) {
      setEditingActivity({
        ...editingActivity,
        [field]: value,
      });
    }
  };

  const handleSaveEdit = () => {
    if (editingActivity) {
      setActivities(
        activities.map((activity) =>
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