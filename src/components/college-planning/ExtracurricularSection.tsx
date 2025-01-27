import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Pencil, Save, X } from "lucide-react";

interface Activity {
  id: string;
  name: string;
  role: string;
  description: string;
  timeCommitment: string;
}

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

  const handleEditActivity = (activity: Activity) => {
    setEditingActivity(activity);
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
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="activityName">Activity Name</Label>
            <Input
              id="activityName"
              value={newActivity.name}
              onChange={(e) =>
                setNewActivity({ ...newActivity, name: e.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="role">Role/Position</Label>
            <Input
              id="role"
              value={newActivity.role}
              onChange={(e) =>
                setNewActivity({ ...newActivity, role: e.target.value })
              }
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newActivity.description}
              onChange={(e) =>
                setNewActivity({ ...newActivity, description: e.target.value })
              }
            />
          </div>
          <div className="col-span-2">
            <Label htmlFor="timeCommitment">Time Commitment</Label>
            <Input
              id="timeCommitment"
              value={newActivity.timeCommitment}
              onChange={(e) =>
                setNewActivity({ ...newActivity, timeCommitment: e.target.value })
              }
              placeholder="e.g., 5 hours/week, 2 years"
            />
          </div>
        </div>
        <Button onClick={handleAddActivity} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Activity
        </Button>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Time Commitment</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) =>
              editingActivity?.id === activity.id ? (
                <TableRow key={activity.id}>
                  <TableCell>
                    <Input
                      value={editingActivity.name}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          name: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editingActivity.role}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          role: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={editingActivity.description}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          description: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={editingActivity.timeCommitment}
                      onChange={(e) =>
                        setEditingActivity({
                          ...editingActivity,
                          timeCommitment: e.target.value,
                        })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSaveEdit}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingActivity(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow key={activity.id}>
                  <TableCell>{activity.name}</TableCell>
                  <TableCell>{activity.role}</TableCell>
                  <TableCell>{activity.description}</TableCell>
                  <TableCell>{activity.timeCommitment}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditActivity(activity)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
