import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddStudentDialogProps {
  counselorId: string;
  onStudentAdded: () => void;
}

export default function AddStudentDialog({ counselorId, onStudentAdded }: AddStudentDialogProps) {
  const [email, setEmail] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleAddStudent = async () => {
    try {
      setIsAdding(true);
      console.log("Looking for student with email:", email);

      // First find the student's profile using their email
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw usersError;
      }

      const studentUser = users.find(user => user.email === email);
      
      if (!studentUser) {
        toast({
          title: "Error",
          description: "Student not found. Make sure they have registered first.",
          variant: "destructive",
        });
        return;
      }

      const { data: userProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_type')
        .eq('id', studentUser.id)
        .single();

      if (profileError || !userProfiles) {
        console.error("Error finding student profile:", profileError);
        toast({
          title: "Error",
          description: "Student not found. Make sure they have registered first.",
          variant: "destructive",
        });
        return;
      }

      if (userProfiles.user_type !== 'student') {
        toast({
          title: "Error",
          description: "The provided email does not belong to a student account.",
          variant: "destructive",
        });
        return;
      }

      // Check if relationship already exists
      const { data: existingRelationship } = await supabase
        .from('counselor_student_relationships')
        .select('id')
        .eq('counselor_id', counselorId)
        .eq('student_id', userProfiles.id)
        .single();

      if (existingRelationship) {
        toast({
          title: "Error",
          description: "This student is already assigned to you.",
          variant: "destructive",
        });
        return;
      }

      // Create the relationship
      const { error: relationshipError } = await supabase
        .from('counselor_student_relationships')
        .insert({
          counselor_id: counselorId,
          student_id: userProfiles.id,
        });

      if (relationshipError) {
        console.error("Error creating relationship:", relationshipError);
        toast({
          title: "Error",
          description: "Failed to add student. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Student added successfully!",
      });
      
      onStudentAdded();
      setEmail("");
      setOpen(false);
    } catch (error) {
      console.error("Error adding student:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Student Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleAddStudent} 
            disabled={isAdding || !email}
            className="w-full"
          >
            {isAdding ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Student"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}