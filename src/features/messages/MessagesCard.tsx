import { useState } from "react";
import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useStudentMessages } from "./data";
import MessageList from "./MessageList";
import SendMessageDialog from "./SendMessageDialog";

/** Counselor's view of messages sent to a student, with a send button. */
export default function MessagesCard(props: { studentId: string; studentName: string; studentEmail?: string | null; parentEmail?: string | null }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { data: messages = [], isLoading } = useStudentMessages(props.studentId);
  const [sending, setSending] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-lg"><Mail className="h-5 w-5 text-primary" aria-hidden="true" />{L("消息", "Messages")}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setSending(true)}><Send className="mr-1.5 h-4 w-4" />{L("发消息", "Send message")}</Button>
      </CardHeader>
      <CardContent>
        {isLoading ? null : messages.length ? (
          <MessageList messages={messages} staff limit={5} />
        ) : (
          <p className="text-sm text-muted-foreground">{L("还没有给这位学生发过消息。消息会以邮件发给学生，学生回复会回到你的邮箱。", "No messages yet. Messages go to the student by email; replies come back to your email.")}</p>
        )}
      </CardContent>
      <SendMessageDialog open={sending} onOpenChange={setSending} {...props} />
    </Card>
  );
}
