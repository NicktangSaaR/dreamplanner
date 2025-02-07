
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

interface AddCounselorDialogProps {
  studentId: string;
  onCounselorAdded: () => void;
}

export default function AddCounselorDialog({ studentId, onCounselorAdded }: AddCounselorDialogProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First, get all users and find the counselor by email
      const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (usersError) {
        toast.error("Error fetching users");
        return;
      }

      const counselorUser = users?.find((u: User) => u.email === email);
      
      if (!counselorUser) {
        toast.error("Counselor not found with this email");
        return;
      }

      // Find the counselor profile
      const { data: counselorProfile, error: counselorError } = await supabase
        .from("profiles")
        .select("id, user_type")
        .eq("id", counselorUser.id)
        .single();

      if (counselorError || !counselorProfile) {
        toast.error("Counselor profile not found");
        return;
      }

      if (counselorProfile.user_type !== "counselor") {
        toast.error("The specified user is not a counselor");
        return;
      }

      // Check if relationship already exists
      const { data: existingRelationship, error: checkError } = await supabase
        .from("counselor_student_relationships")
        .select("*")
        .eq("counselor_id", counselorProfile.id)
        .eq("student_id", studentId)
        .maybeSingle();

      if (checkError) {
        toast.error("Error checking existing relationship");
        return;
      }

      if (existingRelationship) {
        toast.error("This counselor already has access to this student");
        return;
      }

      // Create the new relationship
      const { data: authData } = await supabase.auth.getUser();
      const { error: insertError } = await supabase
        .from("counselor_student_relationships")
        .insert({
          counselor_id: counselorProfile.id,
          student_id: studentId,
          is_primary: false,
          added_by: authData.user?.id
        });

      if (insertError) {
        toast.error("Failed to add counselor");
        return;
      }

      toast.success("Counselor added successfully");
      setOpen(false);
      onCounselorAdded();
      setEmail("");
    } catch (error) {
      console.error("Error adding counselor:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Counselor
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Additional Counselor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Counselor Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter counselor's email"
              required
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Counselor"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
