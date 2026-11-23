import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";

export type Recipient = { id: string; name: string; status: string | null; graduate: boolean };
const GROUPS = ["G9", "G10", "G11", "G12", "College Bound", "Transfer Student"];

/** One message to many students at once; each gets their own email ({name} filled in). */
export default function BulkMessageDialog({ open, onOpenChange, students }: { open: boolean; onOpenChange: (o: boolean) => void; students: Recipient[] }) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const qc = useQueryClient();
  const [group, setGroup] = useState("all");
  const [search, setSearch] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [ccParent, setCcParent] = useState(false);
  const [busy, setBusy] = useState(false);

  const inGroup = (s: Recipient) => group === "all" || (group === "Graduate" ? s.graduate : s.status === group);
  const visible = useMemo(
    () => students.filter(inGroup).filter((s) => !search.trim() || s.name.toLowerCase().includes(search.trim().toLowerCase())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, group, search],
  );
  const allVisible = visible.length > 0 && visible.every((s) => picked.has(s.id));
  const toggleAll = () => setPicked((p) => {
    const n = new Set(p);
    visible.forEach((s) => (allVisible ? n.delete(s.id) : n.add(s.id)));
    return n;
  });
  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const submit = async () => {
    if (!picked.size || !body.trim()) return;
    setBusy(true);
    try {
      const ids = [...picked];
      const { data, error } = await supabase.functions.invoke("send-student-message", {
        body: { student_ids: ids, subject: subject.trim(), body: body.trim(), cc_parent: ccParent },
      });
      if (error) throw error;
      ids.forEach((id) => void qc.invalidateQueries({ queryKey: ["student-messages", id] }));
      const r = data as { sent: number; no_email: number; failed: number; skipped: number };
      const extra = [
        r.no_email ? L(`${r.no_email} 位没有邮箱，只保存在系统里`, `${r.no_email} without email (saved only)`) : "",
        r.failed ? L(`${r.failed} 封没发出`, `${r.failed} failed`) : "",
        r.skipped ? L(`${r.skipped} 位不是你的学生，已跳过`, `${r.skipped} skipped (not your students)`) : "",
      ].filter(Boolean).join("；");
      (r.failed || r.no_email ? toast.warning : toast.success)(L(`已发给 ${r.sent} 位学生`, `Sent to ${r.sent} students`) + (extra ? `（${extra}）` : ""));
      setPicked(new Set()); setSubject(""); setBody(""); setCcParent(false);
      onOpenChange(false);
    } catch {
      toast.error(L("发送失败，请稍后再试", "Couldn't send. Please try again."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{L("群发消息", "Message several students")}</DialogTitle>
          <DialogDescription>{L("每位学生单独收到一封邮件，看不到其他收件人；回复会回到你的邮箱。", "Each student gets their own email and can't see the others; replies come to your email.")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="mr-auto">{L(`收件人（已选 ${picked.size} 位）`, `Recipients (${picked.size} selected)`)}</Label>
            <Select value={group} onValueChange={setGroup}>
              <SelectTrigger className="h-8 w-40" aria-label={L("按年级筛选", "Filter by grade")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{L("全部学生", "All students")}</SelectItem>
                {GROUPS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                <SelectItem value="Graduate">{L("研究生", "Graduate")}</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-40">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input className="h-8 pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={L("搜索", "Search")} aria-label={L("搜索学生", "Search students")} />
            </div>
          </div>
          <div className="rounded-md border">
            <label className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2 text-sm font-medium">
              <Checkbox checked={allVisible} onCheckedChange={toggleAll} disabled={!visible.length} />
              {L(`全选当前列表（${visible.length}）`, `Select all shown (${visible.length})`)}
            </label>
            <ul className="max-h-56 overflow-y-auto">
              {visible.map((s) => (
                <li key={s.id}>
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/40">
                    <Checkbox checked={picked.has(s.id)} onCheckedChange={() => toggle(s.id)} />
                    <span className="flex-1">{s.name}</span>
                    <span className="text-xs text-muted-foreground">{s.graduate ? L("研究生", "Graduate") : s.status || ""}</span>
                  </label>
                </li>
              ))}
              {!visible.length && <li className="px-3 py-3 text-sm text-muted-foreground">{L("没有符合条件的学生", "No students match")}</li>}
            </ul>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bulk-subject">{L("标题（可选）", "Subject (optional)")}</Label>
          <Input id="bulk-subject" value={subject} maxLength={150} onChange={(e) => setSubject(e.target.value)} placeholder={L("例如：本周申请季提醒", "e.g. Application season reminder")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bulk-body">{L("内容", "Message")}</Label>
          <Textarea id="bulk-body" rows={7} value={body} maxLength={5000} onChange={(e) => setBody(e.target.value)} />
          <p className="text-xs text-muted-foreground">{L("写 {name} 会自动换成每位学生的名字，例如「{name}，你好」。", "Write {name} to insert each student's name, e.g. “Hi {name},”.")}</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={ccParent} onCheckedChange={(v) => setCcParent(v === true)} />
          {L("有家长邮箱的同时抄送家长", "Also copy parents who have an email on file")}
        </label>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>{L("取消", "Cancel")}</Button>
          <Button onClick={() => void submit()} disabled={busy || !picked.size || !body.trim()}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            {busy ? L("发送中…", "Sending…") : L(`发送给 ${picked.size} 位学生`, `Send to ${picked.size} students`)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
