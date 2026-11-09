import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, Lock, MessagesSquare, NotebookPen, Pencil, Plus, StickyNote, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { db, fmtDate } from "@/features/counselor/plan/planData";
import { addNote, loadNotes, removeNote, updateNote, type QuickNote } from "./followData";
import { MeetingBody, RecordMeetingDialog, loadMeetings, toggleMeetingTask, type Meeting } from "./meetings";

type Entry =
  | { kind: "meeting"; id: string; at: string; meeting: Meeting }
  | { kind: "note"; id: string; at: string; note: QuickNote };

/**
 * Everything that happened with this student, newest first: formal meetings
 * (AI-organised, with tasks) and quick notes. Students see meeting summaries
 * and notes; team notes inside meetings stay hidden from them.
 */
export default function CommsTimeline({ studentId }: { studentId: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const qc = useQueryClient();

  const meetingsQ = useQuery({ queryKey: ["follow-meetings", studentId], queryFn: () => loadMeetings(studentId) });
  const notesQ = useQuery({ queryKey: ["follow-notes", studentId], queryFn: () => loadNotes(studentId) });
  const { data: me } = useQuery({
    queryKey: ["me-name"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return "";
      const { data } = await db.from("profiles").select("full_name").eq("id", auth.user.id).maybeSingle();
      return (data?.full_name as string) || auth.user.email || "";
    },
  });

  const entries: Entry[] = [
    ...(meetingsQ.data || []).map((m) => ({ kind: "meeting" as const, id: m.id, at: m.meeting_date, meeting: m })),
    ...(notesQ.data || []).map((n) => ({ kind: "note" as const, id: n.id, at: n.created_at, note: n })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const [openId, setOpenId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [teamOnly, setTeamOnly] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["follow-meetings", studentId] });
    qc.invalidateQueries({ queryKey: ["follow-notes", studentId] });
    qc.invalidateQueries({ queryKey: ["follow-tasks", studentId] });
    qc.invalidateQueries({ queryKey: ["student-todos", studentId] });
    qc.invalidateQueries({ queryKey: ["plan-quarters", studentId] });
    qc.invalidateQueries({ queryKey: ["student-quarters", studentId] });
    qc.invalidateQueries({ queryKey: ["plan-meeting-count", studentId] });
  };

  const saveNote = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await addNote(studentId, draft, me || "", teamOnly);
      setDraft("");
      setTeamOnly(false);
      setComposing(false);
      refresh();
    } catch {
      toast.error(L("没能保存记录", "Couldn't save the note"));
    } finally {
      setBusy(false);
    }
  };
  const saveEdit = async (id: string) => {
    try {
      await updateNote(id, editText);
      setEditing(null);
      refresh();
    } catch {
      toast.error(L("没能保存修改", "Couldn't save"));
    }
  };
  const deleteNote = async (n: QuickNote) => {
    if (!window.confirm(L("删除这条记录？", "Delete this note?"))) return;
    try {
      await removeNote(n.id);
    } catch {
      toast.error(L("删除失败", "Couldn't delete"));
    }
    refresh();
  };
  const deleteMeeting = async (m: Meeting) => {
    if (!window.confirm(L(`删除会议「${m.title || ""}」？已进入任务清单的学生任务会保留。`, `Delete "${m.title || ""}"? Student tasks already in the list are kept.`))) return;
    const { error } = await db.from("student_meetings").delete().eq("id", m.id);
    if (error) toast.error(L("删除失败", "Couldn't delete"));
    refresh();
  };

  const loading = meetingsQ.isLoading || notesQ.isLoading;
  const nMeetings = meetingsQ.data?.length || 0;
  const nNotes = notesQ.data?.length || 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessagesSquare className="h-5 w-5 text-primary" /> {L("沟通记录", "Communication log")}
            <span className="text-sm font-normal text-muted-foreground">{L(`会议 ${nMeetings} · 笔记 ${nNotes}`, `${nMeetings} meetings · ${nNotes} notes`)}</span>
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setComposing(true)}><StickyNote className="mr-1.5 h-4 w-4" />{L("快速记录", "Quick note")}</Button>
            <Button size="sm" onClick={() => setRecording(true)}><Plus className="mr-1.5 h-4 w-4" />{L("记录会议", "Record a meeting")}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {composing && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <Textarea autoFocus rows={3} value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder={L("电话、微信、家长沟通……随手记一句", "A call, a message, a word with the parent…")} />
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="mr-auto flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={teamOnly} onCheckedChange={(v) => setTeamOnly(!!v)} /><Lock className="h-3.5 w-3.5" />{L("仅服务团队可见（学生看不到）", "Team only (hidden from the student)")}
              </label>
              <Button variant="ghost" size="sm" onClick={() => { setComposing(false); setDraft(""); }}>{L("取消", "Cancel")}</Button>
              <Button size="sm" onClick={() => void saveNote()} disabled={!draft.trim() || busy}>{L("保存", "Save")}</Button>
            </div>
          </div>
        )}

        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : entries.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {L("还没有沟通记录。开完会点「记录会议」，日常沟通用「快速记录」。", "Nothing yet. Use “Record a meeting” after a meeting, and “Quick note” for everyday contact.")}
          </p>
        ) : (
          <ol className="relative space-y-2 border-l pl-5">
            {entries.map((e) => {
              const isOpen = openId === e.id || (openId === null && e === entries[0] && e.kind === "meeting");
              return (
                <li key={`${e.kind}-${e.id}`} className="relative">
                  <span className={cn("absolute -left-[1.6rem] top-3.5 flex h-5 w-5 items-center justify-center rounded-full border bg-background",
                    e.kind === "meeting" ? "text-primary" : "text-muted-foreground")} aria-hidden="true">
                    {e.kind === "meeting" ? <Users className="h-3 w-3" /> : <NotebookPen className="h-3 w-3" />}
                  </span>
                  {e.kind === "meeting" ? (
                    <div className="rounded-md border bg-card">
                      <button className="flex w-full items-center gap-3 px-4 py-3 text-left" onClick={() => setOpenId(isOpen ? "" : e.id)} aria-expanded={isOpen}>
                        <span className="w-24 shrink-0 text-xs text-muted-foreground">{fmtDate(e.at, lang)}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.meeting.title || L("会议", "Meeting")}</span>
                        {e.meeting.tasks.length > 0 && <span className="shrink-0 text-xs text-muted-foreground">{L("任务", "Tasks")} {e.meeting.tasks.filter((t) => t.completed).length}/{e.meeting.tasks.length}</span>}
                        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                      </button>
                      {isOpen && (
                        <div className="border-t px-4 py-4">
                          <MeetingBody meeting={e.meeting}
                            onToggleTask={async (t) => { if (!(await toggleMeetingTask(t))) toast.error(L("没能更新任务", "Couldn't update the task")); refresh(); }}
                            onDelete={() => void deleteMeeting(e.meeting)} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="group rounded-md border border-dashed bg-card px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-xs text-muted-foreground">{fmtDate(e.at, lang)}</span>
                        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">{L("笔记", "Note")}{e.note.author_name ? ` · ${e.note.author_name}` : ""}
                          {e.note.team_only && <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5"><Lock className="h-3 w-3" />{L("仅团队", "Team only")}</span>}</span>
                        <button className="text-muted-foreground opacity-0 hover:text-foreground focus:opacity-100 group-hover:opacity-100" aria-label={L("编辑", "Edit")}
                          onClick={() => { setEditing(e.id); setEditText(e.note.content); }}><Pencil className="h-3.5 w-3.5" /></button>
                        <button className="text-muted-foreground opacity-0 hover:text-destructive focus:opacity-100 group-hover:opacity-100" aria-label={L("删除", "Delete")}
                          onClick={() => void deleteNote(e.note)}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                      {editing === e.id ? (
                        <div className="mt-2 space-y-2">
                          <Textarea rows={3} value={editText} onChange={(ev) => setEditText(ev.target.value)} />
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>{L("取消", "Cancel")}</Button>
                            <Button size="sm" onClick={() => void saveEdit(e.id)} disabled={!editText.trim()}>{L("保存", "Save")}</Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{e.note.content || e.note.title}</p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
      <RecordMeetingDialog studentId={studentId} open={recording} onOpenChange={setRecording} onSaved={(id) => { setOpenId(id); refresh(); }} />
    </Card>
  );
}
