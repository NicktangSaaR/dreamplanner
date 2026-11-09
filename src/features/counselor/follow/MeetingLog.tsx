import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Plus, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { db, fmtDate } from "@/features/counselor/plan/planData";
import { MeetingBody, RecordMeetingDialog, loadMeetings, toggleMeetingTask, type Meeting } from "./meetings";

/** All meetings with this student, newest first. The student sees the summaries read-only. */
export default function MeetingLog({ studentId }: { studentId: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const qc = useQueryClient();
  const { data: meetings = [], isLoading } = useQuery({ queryKey: ["follow-meetings", studentId], queryFn: () => loadMeetings(studentId) });

  const [openId, setOpenId] = useState<string | null>(null);
  const shownId = openId ?? meetings[0]?.id ?? null;
  const [recording, setRecording] = useState(false);

  const refresh = () => {
    for (const k of ["follow-meetings", "follow-tasks", "student-todos", "plan-quarters", "student-quarters", "plan-meeting-count", "cs-upcoming"]) {
      qc.invalidateQueries({ queryKey: [k, studentId] });
    }
  };
  const deleteMeeting = async (m: Meeting) => {
    if (!window.confirm(L(`删除会议「${m.title || ""}」？已进入任务清单的学生任务会保留。`, `Delete "${m.title || ""}"? Student tasks already in the list are kept.`))) return;
    const { error } = await db.from("student_meetings").delete().eq("id", m.id);
    if (error) toast.error(L("删除失败", "Couldn't delete"));
    refresh();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5 text-primary" /> {L("会议记录", "Meetings")}
            <span className="text-sm font-normal text-muted-foreground">{L(`共 ${meetings.length} 次`, `${meetings.length} total`)}</span>
          </CardTitle>
          <Button size="sm" onClick={() => setRecording(true)}><Plus className="mr-1.5 h-4 w-4" />{L("记录会议", "Record a meeting")}</Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : meetings.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {L("还没有会议记录。开完会点「记录会议」，把笔记贴进来，AI 会整理成摘要、决定事项和任务。", "No meetings yet. After a meeting, click “Record a meeting” and paste your notes.")}
          </p>
        ) : (
          <ul className="space-y-2">
            {meetings.map((m) => {
              const open = shownId === m.id;
              return (
                <li key={m.id} className="rounded-md border bg-card">
                  <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenId(open ? "" : m.id)} aria-expanded={open}>
                    <span className="w-24 shrink-0 text-xs text-muted-foreground">{fmtDate(m.meeting_date, lang)}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.title || L("会议", "Meeting")}</span>
                    {m.tasks.length > 0 && <span className="shrink-0 text-xs text-muted-foreground">{L("任务", "Tasks")} {m.tasks.filter((t) => t.completed).length}/{m.tasks.length}</span>}
                    <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
                  </button>
                  {open && (
                    <div className="border-t px-4 py-4">
                      <MeetingBody meeting={m}
                        onToggleTask={async (t) => { if (!(await toggleMeetingTask(t))) toast.error(L("没能更新任务", "Couldn't update the task")); refresh(); }}
                        onDelete={() => void deleteMeeting(m)} onChanged={refresh} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
      <RecordMeetingDialog studentId={studentId} open={recording} onOpenChange={setRecording} onSaved={(id) => { setOpenId(id); refresh(); }} />
    </Card>
  );
}
