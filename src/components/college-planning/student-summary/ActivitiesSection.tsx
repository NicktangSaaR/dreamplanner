import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ActivityForm from "../extracurricular/ActivityForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

interface Activity {
  id: string;
  name: string;
  role: string;
  description?: string | null;
  time_commitment?: string | null;
}

interface ActivitiesSectionProps {
  activities: Activity[];
}

export default function ActivitiesSection({ activities }: ActivitiesSectionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    name: "",
    role: "",
    description: "",
    time_commitment: "",
  });
  const queryClient = useQueryClient();
  const { studentId } = useParams();

  console.log("ActivitiesSection - Rendering with activities:", activities);

  const handleActivityChange = (field: string, value: string) => {
    setNewActivity(prev => ({ ...prev, [field]: value }));
  };

  const handleAddActivity = async () => {
    try {
      if (!newActivity.name || !newActivity.role) {
        toast.error("Activity name and role are required");
        return;
      }

      if (!studentId) {
        toast.error("No student ID available");
        return;
      }

      console.log("Adding new activity for student:", studentId);

      const { error } = await supabase
        .from("extracurricular_activities")
        .insert([
          {
            name: newActivity.name,
            role: newActivity.role,
            description: newActivity.description,
            time_commitment: newActivity.time_commitment,
            student_id: studentId,
          },
        ]);

      if (error) throw error;

      console.log("Activity added successfully");
      toast.success("Activity added successfully");
      
      // Invalidate and refetch the activities query
      await queryClient.invalidateQueries({ 
        queryKey: ["student-activities", studentId] 
      });
      
      setIsDialogOpen(false);
      setNewActivity({
        name: "",
        role: "",
        description: "",
        time_commitment: "",
      });
    } catch (error) {
      console.error("Error adding activity:", error);
      toast.error("Failed to add activity");
    }
  };

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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex flex-col p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm text-gray-600">{activity.role}</p>
                </div>
                {activity.time_commitment && (
                  <Badge variant="secondary">{activity.time_commitment}</Badge>
                )}
              </div>
              {activity.description && (
                <p className="text-sm text-gray-600 mt-2">{activity.description}</p>
              )}
            </div>
          ))}
          {activities.length === 0 && (
            <p className="text-gray-500 text-center">No extracurricular activities recorded</p>
          )}
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
          </DialogHeader>
          <ActivityForm
            newActivity={newActivity}
            onActivityChange={handleActivityChange}
            onAddActivity={handleAddActivity}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}