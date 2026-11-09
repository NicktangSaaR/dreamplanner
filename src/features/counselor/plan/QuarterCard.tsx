import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Check, Loader2, MessagesSquare, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";
import { gradSummary, type Track } from "@/shared/planning";
import KeyDates from "./KeyDates";
import {
  QUARTERS, academicYear, currentQuarter, db, newGoalId, parseGoals, previousQuarter, quarterEnd,
  type Goal, type PlanDoc, type QuarterKey,
} from "./planData";

const STYLES: { key: string; zh: string; en: string; desc: string }[] = [
  { key: "balanced", zh: "均衡发展", en: "Balanced", desc: "学术、活动、竞赛均衡推进" },
  { key: "academic", zh: "学术导向", en: "Academics first", desc: "以GPA、AP、标化为核心" },
  { key: "activity", zh: "活动导向", en: "Activities first", desc: "以课外活动和领导力为核心" },
  { key: "competition", zh: "竞赛导向", en: "Competitions & research", desc: "以学术竞赛和科研为核心" },
  { key: "narrative", zh: "故事线打造", en: "Personal narrative", desc: "围绕个人叙事主线规划" },
  { key: "stem", zh: "STEM专项", en: "STEM focus", desc: "针对理工科方向强化" },
  { key: "humanities", zh: "人文社科", en: "Humanities focus", desc: "针对文科方向深耕" },
];

// Graduate applicants: no extracurricular-activities track.
const GRAD_STYLES: { key: string; zh: string; en: string; desc: string }[] = [
  { key: "balanced", zh: "均衡推进", en: "Balanced", desc: "标化、背景经历、文书材料均衡推进" },
  { key: "tests", zh: "标化优先", en: "Tests first", desc: "以GMAT/GRE、托福/雅思出分为核心" },
  { key: "experience", zh: "背景提升", en: "Experience building", desc: "以实习、工作成果、科研/项目经历为核心" },
  { key: "fit", zh: "定位与选校", en: "Positioning & school fit", desc: "梳理职业目标，确定项目匹配和选校梯度" },
  { key: "materials", zh: "文书与推荐", en: "Essays & recommenders", desc: "以简历、文书、推荐人准备为核心" },
];

type QuarterRow = { id: string; quarter: QuarterKey; academic_year: string; quarter_focus: string | null; quarter_kpi: string | null };

export default function QuarterCard({
  studentId, phase, docs, currentDoc, onWriteQuarterlyReport, track, onOpenFollow,
}: {
  onOpenFollow?: () => void;
  track: Track;
  studentId: string;
  phase: string;
  docs: PlanDoc[];
  currentDoc: PlanDoc | null;
  onWriteQuarterlyReport: (q: QuarterKey) => void;
}) {
  const { lang } = useLanguage();
  const L = (zh: string, en: string) => (lang === "zh" ? zh : en);
  const queryClient = useQueryClient();
  const year = academicYear();
  const nowQ = currentQuarter();
  const [quarter, setQuarter] = useState<QuarterKey>(nowQ);
  const qMeta = QUARTERS.find((q) => q.key === quarter)!;
  const key = ["plan-quarters", studentId, year];

  const { data: rows = [] } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await db
        .from("student_quarters")
        .select("id, quarter, academic_year, quarter_focus, quarter_kpi")
        .eq("student_id", studentId)
        .eq("academic_year", year);
      if (error) throw error;
      return (data || []) as QuarterRow[];
    },
  });
  const row = rows.find((r) => r.quarter === quarter);
  const { data: meetingCount = 0 } = useQuery({
    queryKey: ["plan-meeting-count", studentId, year, quarter],
    queryFn: async () => {
      const { count } = await db.from("student_meetings").select("id", { count: "exact", head: true })
        .eq("student_id", studentId).eq("academic_year", year).eq("quarter", quarter);
      return (count || 0) as number;
    },
  });
  const goals = useMemo(() => parseGoals(row?.quarter_kpi), [row?.quarter_kpi]);
  const done = goals.filter((g) => g.completed).length;

  // ---- saving (autosave) ----
  const [focus, setFocus] = useState("");
  const [saved, setSaved] = useState(false);
  // Sync from the server only when switching quarter or once the row loads,
  // so a refetch never overwrites what is being typed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setFocus(row?.quarter_focus ?? ""), [row?.id, quarter]);

  const save = async (patch: { quarter_focus?: string; quarter_kpi?: string }) => {
    const existing = rows.find((r) => r.quarter === quarter);
    const res = existing
      ? await db.from("student_quarters").update(patch).eq("id", existing.id).select("id")
      : await db.from("student_quarters").insert({ student_id: studentId, quarter, academic_year: year, ...patch }).select("id");
    if (res.error || !res.data?.length) {
      toast.error(L("没能保存，请检查权限或稍后再试", "Couldn't save. Please try again."));
      return false;
    }
    await queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: ["student-quarters", studentId] });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
    return true;
  };
  const saveGoals = (next: Goal[]) => save({ quarter_kpi: JSON.stringify(next) });

  const focusTimer = useRef<number>();
  const onFocusChange = (v: string) => {
    setFocus(v);
    window.clearTimeout(focusTimer.current);
    focusTimer.current = window.setTimeout(() => void save({ quarter_focus: v }), 800);
  };

  const [newGoal, setNewGoal] = useState("");
  const addGoal = async () => {
    const text = newGoal.trim();
    if (!text) return;
    if (await saveGoals([...goals, { id: newGoalId(), text, completed: false }])) setNewGoal("");
  };

  // ---- quarter-end reminder ----
  const end = quarterEnd();
  const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86400000);
  const showReminder = quarter === nowQ && daysLeft <= 21;

  // ---- generate goals ----
  const [genOpen, setGenOpen] = useState(false);
  const [genDoc, setGenDoc] = useState<string>("none");
  const [genStyle, setGenStyle] = useState("balanced");
  const [usePrev, setUsePrev] = useState(true);
  const [generating, setGenerating] = useState(false);
  const prev = previousQuarter(quarter, year);
  const { data: prevInfo } = useQuery({
    queryKey: ["plan-prev-quarter", studentId, prev.quarter, prev.year],
    enabled: genOpen,
    queryFn: async () => {
      const [{ data: report }, { data: q }] = await Promise.all([
        db.from("planning_reports").select("title, final_content, ai_draft").eq("student_id", studentId)
          .eq("report_type", "quarterly").eq("quarter", prev.quarter).eq("academic_year", prev.year)
          .order("created_at", { ascending: false }).limit(1).maybeSingle(),
        db.from("student_quarters").select("quarter_kpi").eq("student_id", studentId)
          .eq("quarter", prev.quarter).eq("academic_year", prev.year).maybeSingle(),
      ]);
      return {
        report: report as { title: string; final_content: string | null; ai_draft: string | null } | null,
        unfinished: parseGoals(q?.quarter_kpi).filter((g) => !g.completed).map((g) => g.text),
      };
    },
  });

  const styles = track.applicantType === "graduate" ? GRAD_STYLES : STYLES;

  const openGenerate = () => {
    setGenDoc(currentDoc?.id ?? "none");
    setGenOpen(true);
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const doc = docs.find((d) => d.id === genDoc);
      const style = styles.find((s) => s.key === genStyle);
      const { data, error } = await supabase.functions.invoke("generate-quarter-plan", {
        body: {
          studentId, quarter, academicYear: year, currentPhase: phase,
          scheme: genStyle, schemeDescription: style?.desc,
          documentContent: doc?.content || undefined, documentTitle: doc?.title,
          previousReport: usePrev ? prevInfo?.report?.final_content || prevInfo?.report?.ai_draft || undefined : undefined,
          unfinishedGoals: usePrev ? prevInfo?.unfinished : undefined,
          applicantType: track.applicantType,
          applicantProfile: track.applicantType === "graduate" ? gradSummary(track, "zh") : undefined,
          gradDegree: track.gradDegree || undefined,
        },
      });
      if (error) throw error;
      const s = data?.suggestions || {};
      let lines: string[] = [];
      if (Array.isArray(s.kpi)) lines = s.kpi.map((k: unknown) => (typeof k === "string" ? k : (k as { text?: string; title?: string })?.text || (k as { title?: string })?.title || ""));
      else if (typeof s.kpi === "string") lines = s.kpi.split("\n");
      const next = lines.map((l) => l.replace(/^[•\-\d.、\s]+/, "").trim()).filter(Boolean).map((text) => ({ id: newGoalId(), text, completed: false }));
      const patch: { quarter_kpi?: string; quarter_focus?: string } = {};
      if (next.length) patch.quarter_kpi = JSON.stringify(next);
      if (s.focus && typeof s.focus === "string") patch.quarter_focus = s.focus;
      if (await save(patch)) {
        toast.success(L("季度重点目标已生成", "Quarterly goals generated"));
        setGenOpen(false);
      }
    } catch (e) {
      toast.error(`${L("生成失败", "Couldn't generate")}: ${e instanceof Error ? e.message : ""}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-primary/30">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-brass">{quarter === nowQ ? L("本季度", "This quarter") : year}</p>
            <h2 className="mt-0.5 text-xl font-semibold text-pine">
              {L(qMeta.zh, qMeta.en)} <span className="text-base font-normal text-muted-foreground">· {L(qMeta.rangeZh, qMeta.rangeEn)}</span>
            </h2>
          </div>
          <div className="inline-flex rounded-md border bg-card p-0.5 text-xs" role="tablist">
            {QUARTERS.map((x) => (
              <button key={x.key} role="tab" aria-selected={quarter === x.key} onClick={() => setQuarter(x.key)}
                className={cn("rounded-sm px-2.5 py-1", quarter === x.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {x.short}{x.key === nowQ && ` · ${L("当前", "now")}`}
              </button>
            ))}
          </div>
        </div>

        {showReminder && (
          <div className="flex flex-wrap items-center gap-3 rounded-md border border-brass/40 bg-brass/10 px-4 py-3 text-sm">
            <CalendarClock className="h-4 w-4 text-brass" />
            <span className="flex-1">
              {L(`${qMeta.short} 将在 ${end.getMonth() + 1}/${end.getDate()} 结束，记得在季末生成季度评估并发布给学生。`,
                `${qMeta.short} ends on ${end.toLocaleDateString("en-CA")}. Write the quarterly review and publish it to the student.`)}
            </span>
            <Button size="sm" variant="outline" onClick={() => onWriteQuarterlyReport(quarter)}>{L("生成季度评估", "Write quarterly review")}</Button>
          </div>
        )}

        {(
          <>
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="q-focus">{L("季度重点", "Focus")}</Label>
                <span className={cn("ml-auto flex items-center gap-1 text-xs text-muted-foreground transition-opacity", saved ? "opacity-100" : "opacity-0")}>
                  <Check className="h-3 w-3" /> {L("已自动保存", "Saved")}
                </span>
              </div>
              <Textarea id="q-focus" rows={2} value={focus} placeholder={L("这个季度最重要的方向，一两句话即可", "The main direction for this quarter, in a sentence or two")}
                onChange={(e) => onFocusChange(e.target.value)} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Label>{L("季度目标", "Goals")}</Label>
                {goals.length > 0 && (
                  <>
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary transition-all" style={{ width: `${(done / goals.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{L(`已完成 ${done}/${goals.length}`, `${done}/${goals.length} done`)}</span>
                  </>
                )}
              </div>
              {goals.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  {L("这个季度还没有目标。可以手动添加，或点「生成季度重点目标」。", "No goals yet. Add one, or generate them.")}
                </div>
              ) : (
                <ul className="divide-y rounded-md border">
                  {goals.map((g) => (
                    <li key={g.id} className="group flex items-center gap-3 px-3 py-2.5">
                      <Checkbox checked={g.completed} onCheckedChange={(v) => void saveGoals(goals.map((x) => (x.id === g.id ? { ...x, completed: !!v } : x)))} />
                      <span className={cn("flex-1 text-sm", g.completed && "text-muted-foreground line-through")}>{g.text}</span>
                      <button className="text-muted-foreground opacity-0 hover:text-destructive focus:opacity-100 group-hover:opacity-100" aria-label={L("删除", "Delete")}
                        onClick={() => void saveGoals(goals.filter((x) => x.id !== g.id))}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                <Input className="min-w-[220px] flex-1" value={newGoal} placeholder={L("添加一个目标，回车保存", "Add a goal, press Enter")}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void addGoal();
                    }
                  }} />
                <Button variant="outline" onClick={openGenerate}>
                  <Sparkles className="mr-1.5 h-4 w-4" /> {L("生成季度重点目标", "Generate quarterly goals")}
                </Button>
              </div>
            </div>
            <KeyDates studentId={studentId} quarter={quarter} year={year} currentDoc={currentDoc} />

            <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              <MessagesSquare className="h-4 w-4" />
              <span className="flex-1">{meetingCount > 0
                ? L(`本季度开会 ${meetingCount} 次，会议纪要和任务在「跟进」里`, `${meetingCount} meetings this quarter — notes and tasks are under Follow-up`)
                : L("本季度还没有会议记录。会议纪要和任务在「跟进」里记录", "No meetings this quarter yet. Record meetings and tasks under Follow-up")}</span>
              {onOpenFollow && <Button variant="link" size="sm" className="h-auto p-0" onClick={onOpenFollow}>{L("去跟进 →", "Open Follow-up →")}</Button>}
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{L(`生成 ${qMeta.zh} 重点目标`, `Generate goals for ${qMeta.en}`)}</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label>{L("依据方案", "Based on plan")}</Label>
              <Select value={genDoc} onValueChange={setGenDoc}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {docs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.title}{d.id === currentDoc?.id ? L("（当前方案）", " (current)") : ""}</SelectItem>
                  ))}
                  <SelectItem value="none">{L("不依据方案", "No plan")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{L("规划风格", "Planning style")}</Label>
              <Select value={genStyle} onValueChange={setGenStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {styles.map((s) => <SelectItem key={s.key} value={s.key}>{L(`${s.zh}：${s.desc}`, s.en)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-2">
              <Checkbox checked={usePrev} onCheckedChange={(v) => setUsePrev(!!v)} className="mt-0.5" />
              <span>
                {L("参考上季度评估报告和未完成的目标", "Use last quarter's review and unfinished goals")}
                <span className="block text-xs text-muted-foreground">
                  {prevInfo?.report ? `${L("上季度", "Last quarter")}：${prevInfo.report.title}` : L("上季度还没有评估报告", "No review for last quarter yet")}
                  {prevInfo && prevInfo.unfinished.length > 0 && ` · ${L(`未完成目标 ${prevInfo.unfinished.length} 个`, `${prevInfo.unfinished.length} unfinished goals`)}`}
                </span>
              </span>
            </label>
            {goals.length > 0 && <p className="text-xs text-muted-foreground">{L("生成后会替换这个季度现有的目标，可以再手动修改。", "This replaces the current goals; you can edit them afterwards.")}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGenOpen(false)}>{L("取消", "Cancel")}</Button>
            <Button onClick={() => void generate()} disabled={generating}>
              {generating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} {L("生成", "Generate")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
