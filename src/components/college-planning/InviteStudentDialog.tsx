import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InviteStudentDialogProps {
  counselorId: string;
}

export default function InviteStudentDialog({ counselorId }: InviteStudentDialogProps) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [open, setOpen] = useState(false);

  const handleInviteStudent = async () => {
    try {
      setIsInviting(true);
      console.log("Inviting student with email:", email);

      // Generate a random token
      const token = Math.random().toString(36).substring(2);

      // Create the invitation
      const { error: invitationError } = await supabase
        .from('student_invitations')
        .insert({
          counselor_id: counselorId,
          email,
          token
        });

      if (invitationError) {
        console.error("Error creating invitation:", invitationError);
        if (invitationError.code === '23505') {
          toast.error("An invitation has already been sent to this email.");
          return;
        } else {
          toast.error("Failed to send invitation. Please try again.");
          return;
        }
      }

      // Send the invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: { email, token }
      });

      if (emailError) {
        console.error("Error sending invitation email:", emailError);
        toast.error("Failed to send invitation email. Please try again.");
        return;
      }

      toast.success("Invitation sent successfully!");
      setEmail("");
      setOpen(false);
    } catch (error) {
      console.error("Error inviting student:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Student
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Student</DialogTitle>
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
            onClick={handleInviteStudent} 
            disabled={isInviting || !email}
            className="w-full"
          >
            {isInviting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Invitation...
              </>
            ) : (
              "Send Invitation"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}