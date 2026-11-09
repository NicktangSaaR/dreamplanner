import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, NotebookPen, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { db, fmtDate } from "@/features/counselor/plan/planData";
import { addNote, loadNotes, removeNote, updateNote, type QuickNote } from "./followData";

const PREVIEW = 3;

/** Counselor notes: occasional jottings outside meetings (a call, a message). Collapsed by default. */
export default function NotesCard({ studentId }: { studentId: string }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const qc = useQueryClient();
  const key = ["follow-notes", studentId];
  const { data: notes = [] } = useQuery({ queryKey: key, queryFn: () => loadNotes(studentId) });
  const { data: me } = useQuery({
    queryKey: ["me-name"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return "";
      const { data } = await db.from("profiles").select("full_name").eq("id", auth.user.id).maybeSingle();
      return (data?.full_name as string) || auth.user.email || "";
    },
  });

  const [expanded, setExpanded] = useState(false);
  const [all, setAll] = useState(false);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const save = async () => {
    try {
      await addNote(studentId, draft, me || "");
      setDraft("");
      setComposing(false);
      refresh();
    } catch {
      toast.error(L("没能保存", "Couldn't save"));
    }
  };
  const saveEdit = async (id: string) => {
    try {
      await updateNote(id, editText);
      setEditing(null);
      refresh();
    } catch {
      toast.error(L("没能保存", "Couldn't save"));
    }
  };
  const remove = async (n: QuickNote) => {
    if (!window.confirm(L("删除这条笔记？", "Delete this note?"))) return;
    await removeNote(n.id).catch(() => toast.error(L("删除失败", "Couldn't delete")));
    refresh();
  };

  const shown = all ? notes : notes.slice(0, PREVIEW);

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between gap-3">
          <button className="flex items-center gap-2 text-left" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
            <CardTitle className="flex items-center gap-2 text-base">
              <NotebookPen className="h-4 w-4 text-muted-foreground" /> {L("笔记", "Notes")}
              <span className="text-sm font-normal text-muted-foreground">{notes.length}</span>
            </CardTitle>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => { setExpanded(true); setComposing(true); }}><Plus className="mr-1 h-4 w-4" />{L("写笔记", "Add note")}</Button>
        </div>
        {!expanded && <p className="text-xs text-muted-foreground">{L("会议以外的零散记录，例如电话、微信沟通。", "Jottings outside meetings, such as a call or a message.")}</p>}
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2 pt-0">
          {composing && (
            <div className="space-y-2 rounded-md border bg-muted/30 p-3">
              <Textarea autoFocus rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={L("例如：电话，妈妈希望暑期项目控制在 5000 加元以内", "e.g. Call with mum: summer budget under $5,000")} />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setComposing(false); setDraft(""); }}>{L("取消", "Cancel")}</Button>
                <Button size="sm" onClick={() => void save()} disabled={!draft.trim()}>{L("保存", "Save")}</Button>
              </div>
            </div>
          )}
          {notes.length === 0 && !composing ? (
            <p className="text-sm text-muted-foreground">{L("还没有笔记。", "No notes yet.")}</p>
          ) : (
            <ul className="divide-y rounded-md border">
              {shown.map((n) => (
                <li key={n.id} className="group px-3 py-2.5 text-sm">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{fmtDate(n.created_at, lang)}</span>
                    {n.author_name && <span>· {n.author_name}</span>}
                    <span className="ml-auto flex gap-2 opacity-0 focus-within:opacity-100 group-hover:opacity-100">
                      <button aria-label={L("编辑", "Edit")} className="hover:text-foreground" onClick={() => { setEditing(n.id); setEditText(n.content); }}><Pencil className="h-3.5 w-3.5" /></button>
                      <button aria-label={L("删除", "Delete")} className="hover:text-destructive" onClick={() => void remove(n)}><Trash2 className="h-3.5 w-3.5" /></button>
                    </span>
                  </div>
                  {editing === n.id ? (
                    <div className="mt-1.5 space-y-2">
                      <Textarea rows={3} value={editText} onChange={(e) => setEditText(e.target.value)} />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>{L("取消", "Cancel")}</Button>
                        <Button size="sm" onClick={() => void saveEdit(n.id)} disabled={!editText.trim()}>{L("保存", "Save")}</Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap leading-relaxed">{n.content || n.title}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
          {notes.length > PREVIEW && (
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => setAll(!all)}>
              {all ? L("收起", "Show fewer") : L(`查看全部 ${notes.length} 条`, `Show all ${notes.length}`)}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
