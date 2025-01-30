import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormEvent } from "react";
import { toast } from "sonner";

interface ActivityFormProps {
  newActivity: {
    name: string;
    role: string;
    description: string;
    time_commitment: string;
    grade_levels?: string[];
  };
  onActivityChange: (field: string, value: string | string[]) => void;
  onAddActivity: () => Promise<void>;
}

const GRADE_LEVELS = [
  "Prior to G9",
  "G9",
  "G10",
  "G11",
  "G12"
];

export default function ActivityForm({
  newActivity,
  onActivityChange,
  onAddActivity,
}: ActivityFormProps) {
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onAddActivity();
  };

  const handleTimeCommitmentChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    
    if (numericValue === '') {
      onActivityChange("time_commitment", '');
    } else {
      // Append "Hours/Week" to the numeric value
      onActivityChange("time_commitment", `${numericValue} Hours/Week`);
    }
  };

  const handleGradeLevelChange = (gradeLevel: string) => {
    const currentGradeLevels = newActivity.grade_levels || [];
    const updatedGradeLevels = currentGradeLevels.includes(gradeLevel)
      ? currentGradeLevels.filter(level => level !== gradeLevel)
      : [...currentGradeLevels, gradeLevel];
    
    onActivityChange("grade_levels", updatedGradeLevels);
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
        <label htmlFor="time_commitment" className="block text-sm font-medium mb-1">
          Time Commitment (Hours/Week)
        </label>
        <Input
          id="time_commitment"
          type="text"
          value={newActivity.time_commitment.replace(" Hours/Week", "")}
          onChange={(e) => handleTimeCommitmentChange(e.target.value)}
          placeholder="Enter number of hours per week"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Grade Levels
        </label>
        <div className="space-y-2">
          {GRADE_LEVELS.map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <Checkbox
                id={`grade-${level}`}
                checked={(newActivity.grade_levels || []).includes(level)}
                onCheckedChange={() => handleGradeLevelChange(level)}
              />
              <label
                htmlFor={`grade-${level}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {level}
              </label>
            </div>
          ))}
        </div>
      </div>
      <Button type="submit" className="w-full">
        Add Activity
      </Button>
    </form>
  );
}