import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ActivityForm from "./ActivityForm";

interface ActivityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newActivity: {
    name: string;
    role: string;
    description: string;
    timeCommitment: string;
  };
  onActivityChange: (field: string, value: string) => void;
  onAddActivity: () => Promise<void>;
}

export default function ActivityFormDialog({
  open,
  onOpenChange,
  newActivity,
  onActivityChange,
  onAddActivity,
}: ActivityFormDialogProps) {
  const handleAddActivity = async () => {
    await onAddActivity();
    // Don't call onOpenChange here - it will be handled by the parent component
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Activity</DialogTitle>
        </DialogHeader>
        <ActivityForm
          newActivity={newActivity}
          onActivityChange={onActivityChange}
          onAddActivity={handleAddActivity}
        />
      </DialogContent>
    </Dialog>
  );
}