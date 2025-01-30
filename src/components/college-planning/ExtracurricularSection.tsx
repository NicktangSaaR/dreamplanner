import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import ActivityFormDialog from "./extracurricular/ActivityFormDialog";
import ActivityList from "./extracurricular/ActivityList";
import { Activity } from "./types/activity";

interface ExtracurricularSectionProps {
  onActivitiesChange?: (activities: Activity[]) => void;
}

export default function ExtracurricularSection({ onActivitiesChange }: ExtracurricularSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState({
    name: "",
    role: "",
    description: "",
    timeCommitment: "",
  });

  const handleActivityChange = useCallback((field: string, value: string) => {
    setNewActivity(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddActivity = useCallback(() => {
    if (!newActivity.name || !newActivity.role) return;

    const activityToAdd = {
      id: Date.now().toString(),
      ...newActivity,
    };

    setActivities(prev => [...prev, activityToAdd]);
    setNewActivity({
      name: "",
      role: "",
      description: "",
      timeCommitment: "",
    });
    setIsDialogOpen(false);
  }, [newActivity]);

  useEffect(() => {
    if (!onActivitiesChange || !Array.isArray(activities)) return;
    console.log("Activities changed:", activities);
    onActivitiesChange(activities);
  }, [activities, onActivitiesChange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            <CardTitle>Extracurricular Activities</CardTitle>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Activity
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ActivityList activities={activities} />
      </CardContent>

      <ActivityFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        newActivity={newActivity}
        onActivityChange={handleActivityChange}
        onAddActivity={handleAddActivity}
      />
    </Card>
  );
}