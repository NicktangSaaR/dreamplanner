import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useSendMessage } from "./data";

type Props = {
  open: boolean; onOpenChange: (open: boolean) => void;
  studentId: string; studentName: string; studentEmail?: string | null; parentEmail?: string | null;
};

/** Counselor → student message, delivered by email (replies come back to the counselor). */
export default function SendMessageDialog({ open, onOpenChange, studentId, studentName, studentEmail, parentEmail }: Props) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const send = useSendMessage(studentId);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [ccParent, setCcParent] = useState(false);
  const [busy, setBusy] = useState(false);
  const noEmail = !studentEmail || /@student\.dreamplaneredu\.com$/i.test(studentEmail);

  const submit = async () => {
    if (!body.trim()) return;
    setBusy(true);
    try {
      const r = await send({ subject: subject.trim(), body: body.trim(), cc_parent: ccParent });
      if (r.emailed) toast.success(L(`已发送给 ${studentName}`, `Sent to ${studentName}`));
      else if (r.reason === "no_email") toast.warning(L("消息已保存，但这位学生没有邮箱，没能发出邮件", "Saved, but this student has no email address, so no email went out"));
      else toast.warning(L("消息已保存，但邮件没能发出，请稍后再试", "Saved, but the email couldn't be sent. Please try again later."));
      setSubject(""); setBody(""); setCcParent(false);
      onOpenChange(false);
    } catch {
      toast.error(L("发送失败，请稍后再试", "Couldn't send. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{L(`给 ${studentName} 发消息`, `Message ${studentName}`)}</DialogTitle>
          <DialogDescription>
            {noEmail
              ? L("这位学生没有邮箱，消息只会保存在系统里。", "This student has no email address; the message will only be saved here.")
              : L(`学生会在邮箱 ${studentEmail} 收到这条消息，直接回复邮件就会回到你的邮箱。`, `The student gets this at ${studentEmail}; replies come to your email.`)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="msg-subject">{L("标题（可选）", "Subject (optional)")}</Label>
            <Input id="msg-subject" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} placeholder={L("例如：本周文书安排", "e.g. Essay plan for this week")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="msg-body">{L("内容", "Message")}</Label>
            <Textarea id="msg-body" rows={7} value={body} maxLength={5000} onChange={(e) => setBody(e.target.value)} />
          </div>
          {parentEmail && (
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={ccParent} onCheckedChange={(v) => setCcParent(v === true)} />
              {L(`同时抄送家长（${parentEmail}）`, `Also copy the parent (${parentEmail})`)}
            </label>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{L("取消", "Cancel")}</Button>
          <Button onClick={() => void submit()} disabled={busy || !body.trim()}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}{L("发送", "Send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
