
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";

interface AddCollaboratorDialogProps {
  studentId: string;
  primaryCounselorId: string;
}

export default function AddCollaboratorDialog({ studentId, primaryCounselorId }: AddCollaboratorDialogProps) {
  const [open, setOpen] = useState(false);

  const { data: counselors, isLoading } = useQuery({
    queryKey: ["counselors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("user_type", "counselor")
        .neq("id", primaryCounselorId);

      if (error) {
        console.error("Error fetching counselors:", error);
        throw error;
      }
      return data;
    },
  });

  const addCollaborator = async (collaboratorId: string) => {
    try {
      const { error } = await supabase
        .from("counselor_collaborations")
        .insert({
          primary_counselor_id: primaryCounselorId,
          collaborator_id: collaboratorId,
          student_id: studentId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("This counselor is already a collaborator");
        } else {
          throw error;
        }
      } else {
        toast.success("Collaborator added successfully");
        setOpen(false);
      }
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast.error("Failed to add collaborator");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Collaborator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Collaborating Counselor</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Loading counselors...</p>
          ) : counselors?.length === 0 ? (
            <p className="text-center text-muted-foreground">No other counselors found</p>
          ) : (
            <div className="space-y-2">
              {counselors?.map((counselor) => (
                <div
                  key={counselor.id}
                  className="flex items-center justify-between p-2 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{counselor.full_name}</p>
                    <p className="text-sm text-muted-foreground">{counselor.email}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => addCollaborator(counselor.id)}
                  >
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
