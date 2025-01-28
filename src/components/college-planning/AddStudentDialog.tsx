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
      
      // Get all users and filter by email
      const { data: { users }, error: authError } = await supabase.auth
        .admin.listUsers({
          page: 1,
          perPage: 100
        });

      if (authError) {
        console.error("Error finding auth user:", authError);
        toast.error("Failed to find user");
        return;
      }

      const matchingUser = users.find(user => user.email === email);
      if (!matchingUser) {
        toast.error("No user found with this email");
        return;
      }

      const userId = matchingUser.id;

      // Then query the corresponding student profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('id', userId)
        .eq('user_type', 'student')
        .maybeSingle();

      if (profileError) {
        console.error("Error finding student profile:", profileError);
        toast.error("Failed to find student profile");
        return;
      }

      if (!profile) {
        toast.error("No student profile found with this email");
        return;
      }

      // First check if the current user is a counselor
      const { data: counselorProfile, error: counselorError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', counselorId)
        .single();

      if (counselorError || !counselorProfile || counselorProfile.user_type !== 'counselor') {
        console.error("Error: User is not a counselor");
        toast.error("You must be a counselor to add students");
        return;
      }

      // Create counselor-student relationship
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