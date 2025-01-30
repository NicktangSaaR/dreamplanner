import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormEvent } from "react";

interface ActivityFormProps {
  newActivity: {
    name: string;
    role: string;
    description: string;
    timeCommitment: string;
  };
  onActivityChange: (field: string, value: string) => void;
  onAddActivity: () => Promise<void>;
}

export default function ActivityForm({
  newActivity,
  onActivityChange,
  onAddActivity,
}: ActivityFormProps) {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onAddActivity();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Activity Name
        </label>
        <Input
          id="name"
          value={newActivity.name}
          onChange={(e) => onActivityChange("name", e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1">
          Role
        </label>
        <Input
          id="role"
          value={newActivity.role}
          onChange={(e) => onActivityChange("role", e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Description
        </label>
        <Textarea
          id="description"
          value={newActivity.description}
          onChange={(e) => onActivityChange("description", e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="timeCommitment" className="block text-sm font-medium mb-1">
          Time Commitment
        </label>
        <Input
          id="timeCommitment"
          value={newActivity.timeCommitment}
          onChange={(e) => onActivityChange("timeCommitment", e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full">
        Add Activity
      </Button>
    </form>
  );
}