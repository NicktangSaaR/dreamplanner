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
  const { toast } = useToast();

  const handleAddStudent = async () => {
    try {
      setIsAdding(true);
      console.log("Adding student with email:", email);

      const { data: { user } } = await supabase.auth.signInWithOtp({ email });
      if (!user) {
        throw new Error("No user found");
      }

      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileError || !userProfile) {
        console.error("Error finding student profile:", profileError);
        toast({
          title: "Error",
          description: "Student not found. Make sure they have registered first.",
          variant: "destructive",
        });
        return;
      }

      const { error: relationshipError } = await supabase
        .from('counselor_student_relationships')
        .insert({
          counselor_id: counselorId,
          student_id: userProfile.id,
        });

      if (relationshipError) {
        console.error("Error creating relationship:", relationshipError);
        toast({
          title: "Error",
          description: "Failed to add student. They might already be assigned to you.",
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
    } catch (error) {
      console.error("Error adding student:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog>
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