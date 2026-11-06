import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, ChevronRight, Clock, Globe, LogOut, Menu, Search, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InviteStudentDialog from "@/components/college-planning/InviteStudentDialog";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";
import { roleLabelKey } from "@/features/team/teamRoles";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;
const DAY = 24 * 60 * 60 * 1000;
const ACTIVE = ["G9", "G10", "G11", "G12", "College Bound", "Transfer Student"];

function academicYear(d = new Date()) {
  const y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${y + 1}`;
}
function quarterKey(d = new Date()) {
  const m = d.getMonth();
  if (m >= 8 && m <= 10) return "Q1_fall";
  if (m >= 11 || m <= 1) return "Q2_winter";
  if (m >= 2 && m <= 4) return "Q3_spring";
  return "Q4_summer";
}
const isoDay = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-CA");
};

type Row = {
  id: string;
  name: string;
  status: string | null;
  role: string; // "lead" or a team role
  phase: string | null;
  goalsDone: number;
  goalsTotal: number;
  lastActive: string | null;
};
type Alert = { key: string; studentId: string; name: string; level: "urgent" | "soon" | "quiet"; text: string; sort: number };

/**
 * Counselor home: what needs attention first, then a compact table of the
 * counselor's students (as lead or team member).
 */
export default function CounselorHome() {
  const { t, lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("all");
  const [showDone, setShowDone] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["counselor-home"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const me = auth.user?.id;
      if (!me) return null;
      const [{ data: meProfile }, { data: rels }, { data: collabs }] = await Promise.all([
        db.from("profiles").select("id, full_name").eq("id", me).maybeSingle(),
        db.from("counselor_student_relationships").select("student_id").eq("counselor_id", me),
        db.from("counselor_collaborations").select("student_id, role").eq("collaborator_id", me),
      ]);
      const roleOf = new Map<string, string>();
      for (const r of rels || []) roleOf.set(r.student_id, "lead");
      for (const c of collabs || []) if (!roleOf.has(c.student_id)) roleOf.set(c.student_id, c.role || "other");
      const ids = [...roleOf.keys()];
      if (ids.length === 0) return { me: meProfile, rows: [] as Row[], alerts: [] as Alert[] };

      const today = isoDay(0);
      const [students, phases, quarters, requests, milestones, todos, notes, reports] = await Promise.all([
        db.from("profiles").select("id, full_name, status").in("id", ids),
        db.from("student_phases").select("student_id, current_phase").in("student_id", ids),
        db.from("student_quarters").select("student_id, quarter_kpi").in("student_id", ids).eq("academic_year", academicYear()).eq("quarter", quarterKey()),
        db.from("academic_report_requests").select("student_id, due_date").in("student_id", ids).is("fulfilled_at", null),
        db.from("planning_milestones").select("student_id, title, due_date").in("student_id", ids).gte("due_date", today).lte("due_date", isoDay(7)),
        db.from("todos").select("author_id, title, due_date, completed, created_at").in("author_id", ids),
        db.from("notes").select("author_id, created_at").in("author_id", ids),
        db.from("academic_reports").select("student_id, created_at").in("student_id", ids),
      ]);

      const nameOf = new Map<string, string>((students.data || []).map((s: { id: string; full_name: string | null }) => [s.id, s.full_name || "—"]));
      const last = new Map<string, string>();
      const bump = (id: string, at?: string | null) => {
        if (at && (!last.has(id) || at > last.get(id)!)) last.set(id, at);
      };
      (todos.data || []).forEach((r: { author_id: string; created_at: string }) => bump(r.author_id, r.created_at));
      (notes.data || []).forEach((r: { author_id: string; created_at: string }) => bump(r.author_id, r.created_at));
      (reports.data || []).forEach((r: { student_id: string; created_at: string }) => bump(r.student_id, r.created_at));

      const goals = new Map<string, { done: number; total: number }>();
      for (const q of quarters.data || []) {
        try {
          const list = JSON.parse(q.quarter_kpi || "[]");
          if (Array.isArray(list)) goals.set(q.student_id, { done: list.filter((g: { completed?: boolean }) => g.completed).length, total: list.length });
        } catch {
          /* plain-text goals are not counted */
        }
      }
      const phaseOf = new Map<string, string>((phases.data || []).map((p: { student_id: string; current_phase: string }) => [p.student_id, p.current_phase]));

      const rows: Row[] = (students.data || []).map((s: { id: string; full_name: string | null; status: string | null }) => ({
        id: s.id,
        name: s.full_name || "—",
        status: s.status,
        role: roleOf.get(s.id) || "other",
        phase: phaseOf.get(s.id) || null,
        goalsDone: goals.get(s.id)?.done ?? 0,
        goalsTotal: goals.get(s.id)?.total ?? 0,
        lastActive: last.get(s.id) || null,
      }));

      const alerts: Alert[] = [];
      for (const r of requests.data || []) {
        if (r.due_date < today) {
          alerts.push({ key: `req-${r.student_id}`, studentId: r.student_id, name: nameOf.get(r.student_id) || "—", level: "urgent", text: t("ch.alert.reportOverdue", { date: r.due_date }), sort: 0 });
        }
      }
      for (const todo of todos.data || []) {
        if (todo.completed || !todo.due_date) continue;
        const due = String(todo.due_date).slice(0, 10);
        if (due < today) {
          alerts.push({ key: `todo-${todo.author_id}-${todo.title}`, studentId: todo.author_id, name: nameOf.get(todo.author_id) || "—", level: "urgent", text: t("ch.alert.todoOverdue", { title: todo.title, date: due }), sort: 1 });
        } else if (due <= isoDay(3)) {
          alerts.push({ key: `todo-${todo.author_id}-${todo.title}`, studentId: todo.author_id, name: nameOf.get(todo.author_id) || "—", level: "soon", text: t("ch.alert.todoSoon", { title: todo.title, date: due }), sort: 3 });
        }
      }
      for (const m of milestones.data || []) {
        alerts.push({ key: `ms-${m.student_id}-${m.title}`, studentId: m.student_id, name: nameOf.get(m.student_id) || "—", level: "soon", text: t("ch.alert.milestone", { title: m.title, date: m.due_date }), sort: 2 });
      }
      const cutoff = new Date(Date.now() - 30 * DAY).toISOString();
      for (const r of rows) {
        if (!ACTIVE.includes(r.status || "")) continue;
        if (!r.lastActive || r.lastActive < cutoff) {
          const days = r.lastActive ? Math.floor((Date.now() - new Date(r.lastActive).getTime()) / DAY) : null;
          alerts.push({ key: `quiet-${r.id}`, studentId: r.id, name: r.name, level: "quiet", text: days ? t("ch.alert.quiet", { n: days }) : t("ch.alert.neverActive"), sort: 4 });
        }
      }
      alerts.sort((a, b) => a.sort - b.sort);
      return { me: meProfile, rows, alerts };
    },
  });

  const rows = useMemo(() => data?.rows || [], [data]);
  const filtered = useMemo(
    () =>
      rows
        .filter((r) => !search.trim() || r.name.toLowerCase().includes(search.trim().toLowerCase()))
        .filter((r) => grade === "all" || r.status === grade)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [rows, search, grade],
  );
  const active = filtered.filter((r) => ACTIVE.includes(r.status || "") || !r.status);
  const finished = filtered.filter((r) => !(ACTIVE.includes(r.status || "") || !r.status));

  const ago = (iso: string | null) => {
    if (!iso) return "—";
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / DAY);
    if (days <= 0) return t("ch.today");
    return t("ch.daysAgo", { n: days });
  };
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t("ch.morning") : hour < 18 ? t("ch.afternoon") : t("ch.evening");
  const firstName = (data?.me?.full_name || "").trim().split(/\s+/)[0];

  const table = (list: Row[]) => (
    <div className="overflow-x-auto rounded-md border bg-card">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="border-b bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">{t("ch.col.name")}</th>
            <th className="px-4 py-2.5 font-medium">{t("ch.col.grade")}</th>
            <th className="px-4 py-2.5 font-medium">{t("ch.col.stage")}</th>
            <th className="px-4 py-2.5 font-medium">{t("ch.col.goals")}</th>
            <th className="px-4 py-2.5 font-medium">{t("ch.col.updated")}</th>
            <th className="px-4 py-2.5 font-medium">{t("ch.col.role")}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {list.map((r) => (
            <tr key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => navigate(`/counselor-dashboard/student/${r.id}`)}>
              <td className="px-4 py-3 font-medium">
                <Link to={`/counselor-dashboard/student/${r.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>{r.name}</Link>
              </td>
              <td className="px-4 py-3 tabular-nums">{r.status || "—"}</td>
              <td className="px-4 py-3">{r.phase ? t(`plan.phase.${r.phase}` as MessageKey) : "—"}</td>
              <td className="px-4 py-3">
                {r.goalsTotal > 0 ? (
                  <span className="flex items-center gap-2 tabular-nums">
                    <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full bg-primary" style={{ width: `${(r.goalsDone / r.goalsTotal) * 100}%` }} />
                    </span>
                    {r.goalsDone}/{r.goalsTotal}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-muted-foreground">{ago(r.lastActive)}</td>
              <td className="px-4 py-3">
                <Badge variant={r.role === "lead" ? "default" : "secondary"} className="font-normal">{t(r.role === "lead" ? "team.role.lead" : roleLabelKey(r.role))}</Badge>
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">{t("ch.noMatch")}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const icon = { urgent: AlertTriangle, soon: Clock, quiet: Clock };
  const tone = { urgent: "text-destructive", soon: "text-brass", quiet: "text-muted-foreground" };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:pt-12">
      <header className="flex items-start justify-between gap-3">
        <h1 className="font-serif text-3xl font-semibold text-pine">{greeting}{firstName ? `，${firstName}` : ""}</h1>
        <div className="flex items-center gap-2">
          {data?.me?.id && <InviteStudentDialog counselorId={data.me.id} />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={t("home3.menu")}><Menu className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => navigate("/counselor-profile")}><User className="mr-2 h-4 w-4" />{t("dash.profile")}</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLang(lang === "zh" ? "en" : "zh")}><Globe className="mr-2 h-4 w-4" />{lang === "zh" ? "English" : "中文"}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void supabase.auth.signOut().then(() => navigate("/"))}><LogOut className="mr-2 h-4 w-4" />{t("dash.logout")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <section className="mt-10" aria-labelledby="attention-heading">
        <h2 id="attention-heading" className="font-serif text-xl font-semibold text-pine">
          {t("ch.attention")} {data?.alerts.length ? <span className="ml-1 font-sans text-base font-normal text-muted-foreground">{data.alerts.length}</span> : null}
        </h2>
        {isLoading ? (
          <p className="mt-3 text-muted-foreground">{t("plan.loading")}</p>
        ) : !data?.alerts.length ? (
          <p className="mt-3 text-muted-foreground">{t("ch.allClear")}</p>
        ) : (
          <ul className="mt-3 divide-y rounded-md border bg-card">
            {data.alerts.slice(0, 12).map((a) => {
              const Icon = icon[a.level];
              return (
                <li key={a.key}>
                  <Link to={`/counselor-dashboard/student/${a.studentId}`} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40">
                    <Icon className={`h-4 w-4 shrink-0 ${tone[a.level]}`} aria-hidden="true" />
                    <span className="w-28 shrink-0 truncate font-medium">{a.name}</span>
                    <span className="min-w-0 flex-1 truncate text-sm">{a.text}</span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10" aria-labelledby="students-heading">
        <h2 id="students-heading" className="font-serif text-xl font-semibold text-pine">
          {t("ch.myStudents")} <span className="ml-1 font-sans text-base font-normal text-muted-foreground">{active.length}</span>
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("ch.search")} aria-label={t("ch.search")} className="pl-9" />
          </div>
          <Select value={grade} onValueChange={setGrade}>
            <SelectTrigger className="w-36" aria-label={t("ch.col.grade")}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("ch.allGrades")}</SelectItem>
              {["G9", "G10", "G11", "G12", "College Bound", "Transfer Student"].map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-3">{table(active)}</div>

        {finished.length > 0 && (
          <div className="mt-6">
            <button type="button" onClick={() => setShowDone((v) => !v)} aria-expanded={showDone} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ChevronDown className={`h-4 w-4 transition-transform ${showDone ? "rotate-180" : ""}`} />
              {t("ch.finished", { n: finished.length })}
            </button>
            {showDone && <div className="mt-3">{table(finished)}</div>}
          </div>
        )}
      </section>
    </div>
  );
}
