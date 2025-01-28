import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";

interface AddStudentDialogProps {
  counselorId: string;
  onStudentAdded: () => void;
}

export default function AddStudentDialog({ counselorId, onStudentAdded }: AddStudentDialogProps) {
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Looking for student with email:", email);
      
      // Get all student profiles that match the email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('user_type', 'student');

      if (profileError) {
        console.error("Error finding student profile:", profileError);
        toast.error("Failed to find student profile");
        return;
      }

      if (!profiles || profiles.length === 0) {
        toast.error("No student profile found with this email");
        return;
      }

      // Create relationship for each student profile found
      for (const profile of profiles) {
        const { error: relationshipError } = await supabase
          .from('counselor_student_relationships')
          .insert({
            counselor_id: counselorId,
            student_id: profile.id
          });

        if (relationshipError) {
          console.error("Error creating relationship:", relationshipError);
          toast.error("Failed to add student");
          return;
        }
      }

      toast.success("Student added successfully");
      onStudentAdded();
      setIsOpen(false);
      setEmail("");
    } catch (error) {
      console.error("Error in handleAddStudent:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Student Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter student email"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Student"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}