import { useState } from "react";
import {
  ArrowLeft, CalendarClock, Check, ChevronDown, FileDown, FileText, History, Loader2, Pencil, Send,
  Settings2, Sparkles, Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Preview of a reorganised counselor "规划" tab, with sample data and local
 * state only. Order follows the work: this quarter → current stage → reports.
 */

type Goal = { id: number; text: string; done: boolean };
type Report = {
  id: number;
  kind: "quarterly" | "stage";
  title: string;
  date: string;
  status: "draft" | "published";
  body: string;
};

const QUARTERS = [
  { key: "Q1", label: "Q1 秋季", range: "9–11 月", end: "11/30" },
  { key: "Q2", label: "Q2 冬季", range: "12–2 月", end: "2/28" },
  { key: "Q3", label: "Q3 春季", range: "3–5 月", end: "5/31" },
  { key: "Q4", label: "Q4 夏季", range: "6–8 月", end: "8/31" },
];

const SAMPLE: Record<string, { focus: string; goals: Goal[] }> = {
  Q1: {
    focus: "打好学术基础，推进研究和竞赛",
    goals: [
      { id: 1, text: "AP Chem 单元测验 ≥ 90%", done: true },
      { id: 2, text: "确定一个 UBC 实验室研究机会", done: false },
      { id: 3, text: "提交 SHAD 申请", done: false },
    ],
  },
  Q2: { focus: "", goals: [] },
  Q3: { focus: "", goals: [] },
  Q4: { focus: "", goals: [] },
};

const GENERATED: Goal[] = [
  { id: 11, text: "完成 SHAD 申请文书终稿并提交（12/1 前）", done: false },
  { id: 12, text: "联系 2 位 UBC 教授，争取一个冬季研究助理机会", done: false },
  { id: 13, text: "AP Chem 期中考试 ≥ 90%，保持全 A 成绩单", done: false },
  { id: 14, text: "确定 Euclid 数学竞赛备赛计划，每周 2 套真题", done: false },
];

const INITIAL_REPORTS: Report[] = [
  {
    id: 1,
    kind: "quarterly",
    title: "2025-2026 Q4 夏季 季度评估",
    date: "2026/8/28",
    status: "published",
    body: "### 本季度核心成果\n- 完成 UBC 化学夏校，获得教授推荐信意向\n- 自学 Python 数据分析，完成一个水质数据小项目\n\n### 下季度重点建议\n- 尽快确定冬季研究机会\n- 准备 SHAD 申请",
  },
  {
    id: 2,
    kind: "stage",
    title: "2025-2026 探索阶段 阶段总结",
    date: "2026/8/30",
    status: "published",
    body: "### 阶段核心成果\n- 明确材料工程 / 化学方向\n- 建立稳定的学术节奏，G9 全年 GPA 3.95\n\n### 下一阶段战略建议\n- 定位阶段以研究和竞赛为主线",
  },
];

function Md({ text }: { text: string }) {
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {text.split("\n").map((l, i) =>
        l.startsWith("### ") ? (
          <p key={i} className="pt-2 font-semibold text-pine">{l.slice(4)}</p>
        ) : l.startsWith("- ") ? (
          <p key={i} className="pl-4 before:-ml-3 before:mr-1.5 before:content-['•']">{l.slice(2)}</p>
        ) : l.trim() ? (
          <p key={i}>{l}</p>
        ) : null,
      )}
    </div>
  );
}

export default function PlanTabPreview() {
  // ---------- this quarter ----------
  const [quarter, setQuarter] = useState("Q1");
  const [data, setData] = useState(SAMPLE);
  const [newGoal, setNewGoal] = useState("");
  const [savedHint, setSavedHint] = useState(false);
  const [genOpen, setGenOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const q = data[quarter];
  const qInfo = QUARTERS.find((x) => x.key === quarter)!;
  const done = q.goals.filter((g) => g.done).length;

  const touch = (next: Partial<{ focus: string; goals: Goal[] }>) => {
    setData((d) => ({ ...d, [quarter]: { ...d[quarter], ...next } }));
    setSavedHint(true);
    window.setTimeout(() => setSavedHint(false), 1500);
  };

  const generateGoals = () => {
    setGenerating(true);
    window.setTimeout(() => {
      touch({ focus: q.focus || "冲刺 SHAD 申请，落实冬季研究机会", goals: GENERATED.map((g) => ({ ...g, id: g.id + Date.now() })) });
      setGenerating(false);
      setGenOpen(false);
    }, 1200);
  };

  // ---------- stage ----------
  const [stageOpen, setStageOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [compressed, setCompressed] = useState(false);

  // ---------- reports ----------
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [openReport, setOpenReport] = useState<number | null>(null);
  const [reportDialog, setReportDialog] = useState<null | { kind: "quarterly" | "stage" }>(null);
  const [reportKind, setReportKind] = useState<"quarterly" | "stage">("quarterly");
  const [reportQuarter, setReportQuarter] = useState("Q1");
  const [reportLang, setReportLang] = useState("zh");
  const [reportBusy, setReportBusy] = useState(false);

  const openReportDialog = (kind: "quarterly" | "stage") => {
    setReportKind(kind);
    setReportQuarter(quarter);
    setReportDialog({ kind });
  };

  const generateReport = () => {
    setReportBusy(true);
    window.setTimeout(() => {
      const ql = QUARTERS.find((x) => x.key === reportQuarter)!.label;
      const en = reportLang === "en";
      const r: Report = {
        id: Date.now(),
        kind: reportKind,
        title:
          reportKind === "quarterly"
            ? en ? `2026-2027 ${reportQuarter} Quarterly Review` : `2026-2027 ${ql} 季度评估`
            : en ? "2026-2027 Positioning Stage Summary" : "2026-2027 定位阶段 阶段总结",
        date: "2026/11/8",
        status: "draft",
        body: en
          ? "### Key achievements\n- AP Chem unit test 94%\n- SHAD application in progress\n\n### Priorities for next quarter\n- Secure a winter research position"
          : "### 本季度核心成果\n- AP Chem 单元测验 94%\n- SHAD 申请推进中，文书已完成初稿\n\n### 目标完成情况\n- 1/3 已完成，UBC 研究机会仍在联系中\n\n### 下季度重点建议\n- 尽快落实冬季研究机会\n- 启动 Euclid 备赛",
      };
      setReports((rs) => [r, ...rs]);
      setOpenReport(r.id);
      setReportBusy(false);
      setReportDialog(null);
    }, 1200);
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Student header (unchanged from today) */}
      <button className="mb-4 flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" /> 返回我的学生</button>
      <h1 className="font-serif text-3xl font-semibold text-pine">Evan Liu</h1>
      <p className="mt-1 text-sm text-muted-foreground">G10 · Prism School · 定位阶段 · 本季目标 {done}/{q.goals.length || 0}</p>
      <div className="mt-6 inline-flex rounded-md bg-muted p-1 text-sm">
        {["概览", "规划", "跟进", "资料"].map((tab) => (
          <span key={tab} className={cn("rounded-sm px-3 py-1.5", tab === "规划" ? "bg-background font-medium shadow-sm" : "text-muted-foreground")}>{tab}</span>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {/* 1. This quarter */}
        <Card className="border-primary/30">
          <CardContent className="space-y-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-brass">本季度</p>
                <h2 className="mt-0.5 text-xl font-semibold text-pine">{qInfo.label} <span className="text-base font-normal text-muted-foreground">· {qInfo.range}</span></h2>
              </div>
              <div className="inline-flex rounded-md border bg-card p-0.5 text-xs">
                {QUARTERS.map((x) => (
                  <button key={x.key} onClick={() => setQuarter(x.key)}
                    className={cn("rounded-sm px-2.5 py-1", quarter === x.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {x.key}{x.key === "Q1" && " · 当前"}
                  </button>
                ))}
              </div>
            </div>

            {quarter === "Q1" && (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-brass/40 bg-brass/10 px-4 py-3 text-sm">
                <CalendarClock className="h-4 w-4 text-brass" />
                <span className="flex-1">Q1 将在 11/30 结束，记得在季末生成季度评估并发布给学生。</span>
                <Button size="sm" variant="outline" onClick={() => openReportDialog("quarterly")}>生成季度评估</Button>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="focus">季度重点</Label>
                <span className={cn("flex items-center gap-1 text-xs text-muted-foreground transition-opacity", savedHint ? "opacity-100" : "opacity-0")}>
                  <Check className="h-3 w-3" /> 已自动保存
                </span>
              </div>
              <Textarea id="focus" rows={2} value={q.focus} placeholder="这个季度最重要的方向，一两句话即可"
                onChange={(e) => touch({ focus: e.target.value })} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Label>季度目标</Label>
                {q.goals.length > 0 && (
                  <>
                    <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary transition-all" style={{ width: `${(done / q.goals.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">已完成 {done}/{q.goals.length}</span>
                  </>
                )}
              </div>
              {q.goals.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                  这个季度还没有目标。可以手动添加，或点「生成季度重点目标」。
                </div>
              ) : (
                <ul className="divide-y rounded-md border">
                  {q.goals.map((g) => (
                    <li key={g.id} className="group flex items-center gap-3 px-3 py-2.5">
                      <Checkbox checked={g.done} onCheckedChange={(v) => touch({ goals: q.goals.map((x) => (x.id === g.id ? { ...x, done: !!v } : x)) })} />
                      <span className={cn("flex-1 text-sm", g.done && "text-muted-foreground line-through")}>{g.text}</span>
                      <button className="text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100" aria-label="删除"
                        onClick={() => touch({ goals: q.goals.filter((x) => x.id !== g.id) })}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap gap-2">
                <Input className="min-w-[220px] flex-1" placeholder="添加一个目标，回车保存" value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newGoal.trim()) {
                      touch({ goals: [...q.goals, { id: Date.now(), text: newGoal.trim(), done: false }] });
                      setNewGoal("");
                    }
                  }} />
                <Button variant="outline" onClick={() => setGenOpen(true)}>
                  <Sparkles className="mr-1.5 h-4 w-4" /> 生成季度重点目标
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Current stage: one line */}
        <Card>
          <CardContent className="p-0">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-6 py-4 text-sm">
              <Badge className="bg-brass/15 text-brass hover:bg-brass/15">定位阶段</Badge>
              <span className="text-muted-foreground">2026/9/9 开始{compressed && " · 压缩模式"}</span>
              <span className="flex min-w-0 items-center gap-1.5">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-muted-foreground">依据方案：</span>
                <button className="truncate font-medium text-primary hover:underline">Evan 定位期规划方案.docx</button>
              </span>
              <span className="ml-auto flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => setHistoryOpen((v) => !v)}>
                  <History className="mr-1 h-4 w-4" /> 历史方案（1）
                  <ChevronDown className={cn("ml-1 h-3.5 w-3.5 transition-transform", historyOpen && "rotate-180")} />
                </Button>
                <Button variant="ghost" size="sm">更换方案</Button>
                <Button variant="outline" size="sm" onClick={() => setStageOpen(true)}>
                  <Settings2 className="mr-1 h-4 w-4" /> 调整阶段
                </Button>
              </span>
            </div>
            {historyOpen && (
              <ul className="border-t bg-muted/20 px-6 py-3 text-sm">
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1">Evan 探索期规划方案.docx</span>
                  <span className="text-xs text-muted-foreground">探索阶段 · 2025/9/12</span>
                </li>
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 3. Reports timeline */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-pine">报告 <span className="text-sm font-normal text-muted-foreground">· {reports.length} 份</span></h2>
              <Button onClick={() => openReportDialog("quarterly")}>
                <Sparkles className="mr-1.5 h-4 w-4" /> 生成报告
              </Button>
            </div>
            <ol className="relative space-y-3 border-l pl-5">
              {reports.map((r) => {
                const open = openReport === r.id;
                return (
                  <li key={r.id} className="relative">
                    <span className={cn("absolute -left-[26px] top-3 h-2.5 w-2.5 rounded-full border-2 border-background", r.status === "published" ? "bg-primary" : "bg-brass")} />
                    <div className="rounded-md border bg-card">
                      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                        <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpenReport(open ? null : r.id)}>
                          <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
                          <Badge variant="outline" className="shrink-0">{r.kind === "quarterly" ? "季度评估" : "阶段总结"}</Badge>
                          <span className="truncate text-sm font-medium">{r.title}</span>
                        </button>
                        <span className="text-xs text-muted-foreground">{r.date}</span>
                        {r.status === "draft" ? (
                          <Badge className="bg-brass/15 text-brass hover:bg-brass/15">草稿 · 学生看不到</Badge>
                        ) : (
                          <Badge variant="secondary">已发布</Badge>
                        )}
                      </div>
                      {open && (
                        <div className="space-y-3 border-t px-4 py-3">
                          <Md text={r.body} />
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button size="sm" variant="outline"><Pencil className="mr-1 h-3.5 w-3.5" /> 编辑</Button>
                            <Button size="sm" variant="outline"><FileDown className="mr-1 h-3.5 w-3.5" /> Word</Button>
                            <Button size="sm" variant="outline"><FileDown className="mr-1 h-3.5 w-3.5" /> PDF</Button>
                            {r.status === "draft" && (
                              <Button size="sm" onClick={() => setReports((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: "published" } : x)))}>
                                <Send className="mr-1 h-3.5 w-3.5" /> 发布给学生
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Generate goals dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>生成 {qInfo.label} 重点目标</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <Label>依据方案</Label>
              <Select defaultValue="doc"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="doc">Evan 定位期规划方案.docx（当前阶段）</SelectItem>
                  <SelectItem value="none">不依据方案</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>规划风格</Label>
              <Select defaultValue="balanced"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="balanced">均衡发展：学术、活动、竞赛均衡推进</SelectItem>
                  <SelectItem value="research">科研主导</SelectItem>
                  <SelectItem value="competition">竞赛主导</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-start gap-2">
              <Checkbox defaultChecked className="mt-0.5" />
              <span>参考上季度评估报告和未完成的目标<span className="block text-xs text-muted-foreground">上季度：2025-2026 Q4 夏季 季度评估</span></span>
            </label>
            {q.goals.length > 0 && <p className="text-xs text-muted-foreground">生成后会替换这个季度现有的目标，可以再手动修改。</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setGenOpen(false)}>取消</Button>
            <Button onClick={generateGoals} disabled={generating}>
              {generating && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} 生成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stage dialog */}
      <Dialog open={stageOpen} onOpenChange={setStageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>调整阶段</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>当前阶段</Label>
                <Select defaultValue="positioning"><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="exploration">探索阶段</SelectItem>
                    <SelectItem value="positioning">定位阶段</SelectItem>
                    <SelectItem value="consolidation">聚焦阶段</SelectItem>
                    <SelectItem value="application">申请阶段</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>开始日期</Label>
                <Input type="date" defaultValue="2026-09-09" />
              </div>
            </div>
            <label className="flex items-center gap-3">
              <Switch checked={compressed} onCheckedChange={setCompressed} /> 压缩模式
            </label>
            <div className="space-y-1.5">
              <Label>阶段备注</Label>
              <Textarea rows={3} placeholder="记录当前阶段的关键决策和方向…" />
            </div>
            <p className="text-xs text-muted-foreground">阶段每年 9 月自动推进；11 年级结束时（7 月）自动进入申请阶段。手动修改后，之后在此基础上继续推进。</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStageOpen(false)}>取消</Button>
            <Button onClick={() => setStageOpen(false)}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate report dialog */}
      <Dialog open={!!reportDialog} onOpenChange={(o) => !o && setReportDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>生成报告</DialogTitle></DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {(["quarterly", "stage"] as const).map((k) => (
                <button key={k} onClick={() => setReportKind(k)}
                  className={cn("rounded-md border p-3 text-left", reportKind === k ? "border-primary bg-primary/5" : "hover:bg-muted/50")}>
                  <span className="block font-medium">{k === "quarterly" ? "季度评估" : "阶段总结"}</span>
                  <span className="text-xs text-muted-foreground">{k === "quarterly" ? "季末回顾目标完成情况" : "一个阶段结束时的整体总结"}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {reportKind === "quarterly" && (
                <div className="space-y-1.5">
                  <Label>季度</Label>
                  <Select value={reportQuarter} onValueChange={setReportQuarter}><SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{QUARTERS.map((x) => <SelectItem key={x.key} value={x.key}>{x.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label>语言</Label>
                <Select value={reportLang} onValueChange={setReportLang}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh">中文</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">生成后是草稿，学生看不到；检查修改后再点「发布给学生」。</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportDialog(null)}>取消</Button>
            <Button onClick={generateReport} disabled={reportBusy}>
              {reportBusy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />} 生成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
