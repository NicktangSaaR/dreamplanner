
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InviteStudentFormProps {
  counselorId: string;
  onSuccess: () => void;
}

export default function InviteStudentForm({ counselorId, onSuccess }: InviteStudentFormProps) {
  const [email, setEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);

  const handleInviteStudent = async () => {
    try {
      setIsInviting(true);
      console.log("Inviting student with email:", email);

      // First check if a valid invitation already exists
      const { data: existingInvitation, error: checkError } = await supabase
        .from('student_invitations')
        .select('*')
        .eq('email', email)
        .eq('counselor_id', counselorId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned
        console.error("Error checking existing invitation:", checkError);
        toast.error("Failed to check existing invitations. Please try again.");
        return;
      }

      if (existingInvitation) {
        toast.error("A valid invitation already exists for this email. It will expire on " + 
          new Date(existingInvitation.expires_at).toLocaleDateString());
        return;
      }

      // Check if the email is already registered in the system
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userProfile) {
        toast.error("This email is already registered in the system.");
        return;
      }

      const token = Math.random().toString(36).substring(2);
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // 7 days from now

      const { error: invitationError } = await supabase
        .from('student_invitations')
        .insert({
          counselor_id: counselorId,
          email,
          token,
          expires_at: expirationDate.toISOString()
        });

      if (invitationError) {
        console.error("Error creating invitation:", invitationError);
        toast.error("Failed to send invitation. Please try again.");
        return;
      }

      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: { 
          email, 
          token,
          expirationDate: expirationDate.toISOString()
        }
      });

      if (emailError) {
        console.error("Error sending invitation email:", emailError);
        toast.error("Failed to send invitation email. Please try again.");
        return;
      }

      toast.success("Invitation sent successfully!");
      setEmail("");
      onSuccess();
    } catch (error) {
      console.error("Error inviting student:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsInviting(false);
    }
  };

  return (
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
  );
}
