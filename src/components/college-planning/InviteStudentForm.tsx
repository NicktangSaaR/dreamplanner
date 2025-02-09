
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
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing invitation:", checkError);
        toast.error("Failed to check existing invitations. Please try again.");
        return;
      }

      if (existingInvitation) {
        const expirationDate = new Date(existingInvitation.expires_at);
        const timeUntilExpiration = Math.ceil((expirationDate.getTime() - new Date().getTime()) / 1000);
        toast.error(`请等待 ${timeUntilExpiration} 秒后再发送邀请。`);
        return;
      }

      // Check if the email is already registered in the system
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (userProfile) {
        toast.error("此邮箱已在系统中注册。");
        return;
      }

      const token = Math.random().toString(36).substring(2);
      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 1); // 1 minute from now

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
        toast.error("发送邀请失败，请重试。");
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
        toast.error("发送邀请邮件失败，请重试。");
        return;
      }

      toast.success("邀请发送成功！链接将在1分钟后过期。");
      setEmail("");
      onSuccess();
    } catch (error) {
      console.error("Error inviting student:", error);
      toast.error("发生意外错误，请重试。");
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="email">学生邮箱</Label>
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
            正在发送邀请...
          </>
        ) : (
          "发送邀请"
        )}
      </Button>
    </div>
  );
}
