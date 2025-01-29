import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";

interface ActivityFormProps {
  newActivity: {
    name: string;
    role: string;
    description: string;
    timeCommitment: string;
  };
  onActivityChange: (field: string, value: string) => void;
  onAddActivity: () => void;
}

export default function ActivityForm({
  newActivity,
  onActivityChange,
  onAddActivity,
}: ActivityFormProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="activityName">Activity Name</Label>
          <Input
            id="activityName"
            value={newActivity.name}
            onChange={(e) => onActivityChange("name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="role">Role/Position</Label>
          <Input
            id="role"
            value={newActivity.role}
            onChange={(e) => onActivityChange("role", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={newActivity.description}
            onChange={(e) => onActivityChange("description", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="timeCommitment">Time Commitment</Label>
          <Input
            id="timeCommitment"
            value={newActivity.timeCommitment}
            onChange={(e) => onActivityChange("timeCommitment", e.target.value)}
            placeholder="e.g., 5 hours/week, 2 years"
          />
        </div>
      </div>
      <Button onClick={onAddActivity} className="w-full">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Activity
      </Button>
    </div>
  );
}