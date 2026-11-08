import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, FileText, HardDrive, History, Loader2, Monitor, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useStudentPhase } from "@/components/engines/hooks/useStudentPhase";
import type { StudentPhase } from "@/components/engines/types";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";
import { downloadDriveFile, pickDriveFile } from "@/lib/googleDrive";
import { cn } from "@/lib/utils";
import {
  PHASES, PlanDocError, fmtDate, openPlanDocument, setCurrentPlan, uploadPlanDocument, type PlanDoc,
} from "./planData";

export default function StageRow({
  studentId, docs, currentDoc, onDocsChanged,
}: {
  studentId: string;
  docs: PlanDoc[];
  currentDoc: PlanDoc | null;
  onDocsChanged: () => Promise<unknown> | void;
}) {
  const { t, lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const { phase, upsertPhase } = useStudentPhase(studentId);
  const phaseKey = phase?.current_phase || "exploration";
  const phaseName = (p: string) => t(`plan.phase.${p}` as MessageKey);
  const history = docs.filter((d) => d.id !== currentDoc?.id);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [note, setNote] = useState("");
  const flash = (msg: string) => {
    setNote(msg);
    window.setTimeout(() => setNote(""), 6000);
  };

  const open = (d: PlanDoc) => void openPlanDocument(d).catch(() => toast.error(L("打开失败", "Couldn't open the file")));

  const makeCurrent = async (d: PlanDoc) => {
    try {
      await setCurrentPlan(d.id);
      await onDocsChanged();
      flash(currentDoc
        ? L(`已切换为「${d.title}」，「${currentDoc.title}」已移到历史方案。`, `Now using “${d.title}”; “${currentDoc.title}” moved to history.`)
        : L(`已设为当前方案：「${d.title}」`, `“${d.title}” is now the current plan.`));
    } catch {
      toast.error(L("没能更换方案，请检查权限", "Couldn't change the plan"));
    }
  };

  // ---------------- swap / upload ----------------
  const [swapOpen, setSwapOpen] = useState(false);
  const [mode, setMode] = useState<"upload" | "pick">("upload");
  const [pickId, setPickId] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const openSwap = () => {
    setMode(currentDoc ? "upload" : "upload");
    setPickId(history[0]?.id || "");
    setSwapOpen(true);
  };

  const afterUpload = async (newId: string, name: string) => {
    await setCurrentPlan(newId);
    await onDocsChanged();
    setSwapOpen(false);
    flash(currentDoc
      ? L(`已更换为「${name}」，「${currentDoc.title}」已移到历史方案。`, `Now using “${name}”; “${currentDoc.title}” moved to history.`)
      : L(`已上传并设为当前方案：「${name}」`, `Uploaded “${name}” as the current plan.`));
  };

  const uploadError = (e: unknown) => {
    const m = e instanceof PlanDocError ? e.message : "";
    toast.error(
      m === "type" ? L("只支持 .docx 或 .txt 文件", "Only .docx or .txt files")
        : m === "size" ? L("文件不能超过 10MB", "File must be under 10 MB")
          : m === "parse" ? L("文件内容读取失败", "Couldn't read the file")
            : L("上传失败，请重试", "Upload failed. Please try again."),
    );
  };

  const onFile = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const id = await uploadPlanDocument(studentId, f, phaseKey);
      await afterUpload(id, f.name.replace(/\.[^/.]+$/, ""));
    } catch (e) {
      uploadError(e);
    } finally {
      setBusy(false);
    }
  };

  const onDrive = async () => {
    try {
      const picked = await pickDriveFile(lang === "zh" ? "zh-CN" : "en");
      if (!picked) return;
      setBusy(true);
      const { file, name, url } = await downloadDriveFile(picked.pick.id, picked.token);
      const title = name.replace(/\.[^/.]+$/, "");
      const id = await uploadPlanDocument(studentId, file, phaseKey, { fileId: picked.pick.id, url: url || picked.pick.url, title });
      await afterUpload(id, title);
    } catch (e) {
      uploadError(e);
    } finally {
      setBusy(false);
    }
  };

  const confirmPick = async () => {
    const d = docs.find((x) => x.id === pickId);
    if (!d) return;
    setBusy(true);
    await makeCurrent(d);
    setBusy(false);
    setSwapOpen(false);
  };

  // ---------------- stage settings ----------------
  const [stageOpen, setStageOpen] = useState(false);
  const [form, setForm] = useState<Partial<StudentPhase>>({});
  useEffect(() => {
    if (stageOpen) {
      setForm({
        current_phase: phase?.current_phase || "exploration",
        phase_start_date: phase?.phase_start_date || new Date().toISOString().slice(0, 10),
        compression_mode: phase?.compression_mode || false,
        phase_notes: phase?.phase_notes || "",
      });
    }
  }, [stageOpen, phase]);
  const saveStage = () =>
    upsertPhase.mutate({ student_id: studentId, ...form } as StudentPhase & { student_id: string }, { onSuccess: () => setStageOpen(false) });

  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 text-sm">
          <Badge className="bg-brass/15 text-brass hover:bg-brass/15">{phaseName(phaseKey)}</Badge>
          {phase?.phase_start_date && (
            <span className="text-muted-foreground">
              {L(`${fmtDate(phase.phase_start_date, lang)} 开始`, `since ${fmtDate(phase.phase_start_date, lang)}`)}
              {phase.compression_mode && ` · ${L("压缩模式", "compressed")}`}
            </span>
          )}
          <span className="flex min-w-0 items-center gap-1.5">
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="shrink-0 text-muted-foreground">{L("依据方案：", "Plan: ")}</span>
            {currentDoc ? (
              <button className="truncate font-medium text-primary hover:underline" onClick={() => open(currentDoc)}>{currentDoc.title}</button>
            ) : (
              <span className="text-muted-foreground">{L("还没有上传", "none yet")}</span>
            )}
          </span>
          <span className="ml-auto flex flex-wrap gap-1">
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setHistoryOpen((v) => !v)} aria-expanded={historyOpen}>
                <History className="mr-1 h-4 w-4" /> {L(`历史方案（${history.length}）`, `History (${history.length})`)}
                <ChevronDown className={cn("ml-1 h-3.5 w-3.5 transition-transform", historyOpen && "rotate-180")} />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={openSwap}>{currentDoc ? L("更换方案", "Change plan") : L("上传方案", "Upload plan")}</Button>
            <Button variant="outline" size="sm" onClick={() => setStageOpen(true)}>
              <Settings2 className="mr-1 h-4 w-4" /> {L("调整阶段", "Stage settings")}
            </Button>
          </span>
        </div>
        {note && (
          <p className="flex items-center gap-2 border-t bg-primary/5 px-6 py-2.5 text-sm text-primary"><Check className="h-4 w-4" /> {note}</p>
        )}
        {historyOpen && history.length > 0 && (
          <ul className="space-y-2 border-t bg-muted/20 px-6 py-3 text-sm">
            {history.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <button className="min-w-0 flex-1 truncate text-left hover:underline" onClick={() => open(d)}>{d.title}</button>
                <span className="text-xs text-muted-foreground">{d.phase ? phaseName(d.phase) : ""} · {fmtDate(d.created_at, lang)}</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => void makeCurrent(d)}>{L("设为当前方案", "Make current")}</Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={swapOpen} onOpenChange={(o) => !busy && setSwapOpen(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{currentDoc ? L("更换规划方案", "Change plan") : L("上传规划方案", "Upload plan")}</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            {currentDoc && (
              <p className="text-muted-foreground">
                {L("当前方案：", "Current plan: ")}<span className="text-foreground">{currentDoc.title}</span>
                {L("。更换后它会移到「历史方案」，不会删除。", ". It moves to history and is not deleted.")}
              </p>
            )}
            {history.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {(["upload", "pick"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={cn("rounded-md border p-3 text-left", mode === m ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                    <span className="block font-medium">{m === "upload" ? L("上传新方案", "Upload a new plan") : L("选已上传的方案", "Choose an earlier plan")}</span>
                    <span className="text-xs text-muted-foreground">{m === "upload" ? L("从电脑或 Google Drive 选择", "From computer or Google Drive") : L(`历史方案 ${history.length} 份`, `${history.length} in history`)}</span>
                  </button>
                ))}
              </div>
            )}
            {mode === "upload" || history.length === 0 ? (
              <div className="space-y-2">
                <input ref={fileRef} type="file" accept=".docx,.txt" className="hidden" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ""; }} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" disabled={busy} onClick={() => fileRef.current?.click()}><Monitor className="mr-1.5 h-4 w-4" /> {L("从电脑选择", "From computer")}</Button>
                  <Button variant="outline" disabled={busy} onClick={() => void onDrive()}><HardDrive className="mr-1.5 h-4 w-4" /> {L("从 Google Drive 选择", "From Google Drive")}</Button>
                  {busy && <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {L("上传并读取中…", "Uploading…")}</span>}
                </div>
                <p className="text-xs text-muted-foreground">{L(`支持 .docx 和 .txt，会归入「${phaseName(phaseKey)}」。`, `.docx or .txt; filed under ${phaseName(phaseKey)}.`)}</p>
              </div>
            ) : (
              <ul className="divide-y rounded-md border">
                {history.map((d) => (
                  <li key={d.id}>
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2.5">
                      <input type="radio" name="plan-pick" checked={pickId === d.id} onChange={() => setPickId(d.id)} className="accent-[hsl(var(--primary))]" />
                      <span className="min-w-0 flex-1 truncate">{d.title}</span>
                      <span className="text-xs text-muted-foreground">{d.phase ? phaseName(d.phase) : ""} · {fmtDate(d.created_at, lang)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div className="rounded-md bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              {L("更换后：之后「生成季度重点目标」默认依据新方案；学生首页的规划方案也换成新方案。已有的季度目标不变，需要时可以重新生成。",
                "Afterwards, quarterly goals are generated from the new plan by default and the student's home shows it. Existing goals stay as they are.")}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSwapOpen(false)} disabled={busy}>{L("取消", "Cancel")}</Button>
            {mode === "pick" && history.length > 0 && (
              <Button onClick={() => void confirmPick()} disabled={!pickId || busy}>{L("确认更换", "Use this plan")}</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stageOpen} onOpenChange={setStageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{L("调整阶段", "Stage settings")}</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{L("当前阶段", "Stage")}</Label>
                <Select value={form.current_phase} onValueChange={(v) => setForm({ ...form, current_phase: v as StudentPhase["current_phase"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PHASES.map((p) => <SelectItem key={p} value={p}>{phaseName(p)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{L("开始日期", "Start date")}</Label>
                <Input type="date" value={form.phase_start_date || ""} onChange={(e) => setForm({ ...form, phase_start_date: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-3">
              <Switch checked={!!form.compression_mode} onCheckedChange={(v) => setForm({ ...form, compression_mode: v })} /> {L("压缩模式", "Compressed timeline")}
            </label>
            <div className="space-y-1.5">
              <Label>{L("阶段备注", "Notes")}</Label>
              <Textarea rows={3} value={form.phase_notes || ""} onChange={(e) => setForm({ ...form, phase_notes: e.target.value })}
                placeholder={L("记录当前阶段的关键决策和方向…", "Key decisions and direction for this stage…")} />
            </div>
            <p className="text-xs text-muted-foreground">
              {L("阶段每年 9 月自动推进；11 年级结束时（7 月）自动进入申请阶段。手动修改后，之后在此基础上继续推进。",
                "Stages move forward automatically each September, and to Applications when Grade 11 ends (July). Manual changes are kept and carried forward.")}
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStageOpen(false)}>{L("取消", "Cancel")}</Button>
            <Button onClick={saveStage} disabled={upsertPhase.isPending}>
              {upsertPhase.isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} {L("保存", "Save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
