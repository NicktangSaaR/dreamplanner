/* In-memory stand-in for the Supabase client, used only by the demo build. */
/* eslint-disable @typescript-eslint/no-explicit-any */
const today = new Date();
const iso = (d: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};
const y = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
const m = today.getMonth();
const quarter = m >= 8 && m <= 10 ? "Q1_fall" : m >= 11 || m <= 1 ? "Q2_winter" : m >= 2 && m <= 4 ? "Q3_spring" : "Q4_summer";

const S = (n: number) => `s000000${n}-0000-0000-0000-000000000000`;
export const DEMO_COUNSELOR = "c0000000-0000-0000-0000-000000000001";
const nowIso = (d: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  return x.toISOString();
};
const goals = (done: number, total: number, texts: string[]) =>
  JSON.stringify(texts.slice(0, total).map((text, i) => ({ id: `k${i}`, text, completed: i < done })));
const students = [
  { id: S(1), full_name: "Mia Yang", status: "G11", school: "St. George's School", phase: "consolidation", g: [2, 4] },
  { id: S(2), full_name: "Evan Liu", status: "G10", school: "Prism School", phase: "positioning", g: [1, 3] },
  { id: S(3), full_name: "Victor Chen", status: "G10", school: "Grandview Heights Secondary", phase: "positioning", g: [0, 3] },
  { id: S(4), full_name: "Harry Pu", status: "G10", school: "Point Grey Secondary", phase: "positioning", g: [3, 3] },
  { id: S(5), full_name: "Chengyi Zhou", status: "G9", school: "Crofton House", phase: "exploration", g: [1, 2] },
  { id: S(6), full_name: "Sophia Sun", status: "G10", school: "York House", phase: "exploration", g: [0, 0] },
  { id: S(9), full_name: "Leo Zhang", status: "Transfer Student", school: "UC Irvine", phase: "application", g: [1, 3] },
  { id: S(7), full_name: "Chris Liu", status: "Completed", school: "Eric Hamber", phase: "application", g: [0, 0] },
  { id: S(8), full_name: "Yi Cui", status: "Completed", school: "Prince of Wales", phase: "application", g: [0, 0] },
];
const goalTexts = ["AP Chem 单元测验 ≥ 90%", "确定一个 UBC 实验室研究机会", "提交 SHAD 申请", "完成推荐人名单"];
const tables: Record<string, any[]> = {
  profiles: [
    { id: DEMO_COUNSELOR, full_name: "Nick Tang", user_type: "counselor", email: "nick@example.com" },
    { id: "c2", full_name: "Cloris Liu", user_type: "counselor", email: "cloris@example.com" },
    { id: "c3", full_name: "Jamma Wu", user_type: "counselor", email: "jamma@example.com" },
    ...students.map((s) => ({ id: s.id, full_name: s.full_name, user_type: "student", status: s.status, grade: s.status.replace("G", ""), school: s.school, email: `${s.full_name.split(" ")[0].toLowerCase()}@example.com`, interested_majors: ["Materials Engineering"], background_intro: "对材料科学和工程设计感兴趣，参加学校机器人社。" })),
  ],
  counselor_student_relationships: students.filter((s) => s.id !== S(5)).map((s) => ({ student_id: s.id, counselor_id: DEMO_COUNSELOR })).concat([{ student_id: S(5), counselor_id: "c2" }]),
  counselor_collaborations: [
    { id: "cc1", student_id: S(1), collaborator_id: "c2", primary_counselor_id: DEMO_COUNSELOR, role: "essay_interview" },
    { id: "cc2", student_id: S(1), collaborator_id: "c3", primary_counselor_id: DEMO_COUNSELOR, role: "followup" },
    { id: "cc3", student_id: S(5), collaborator_id: DEMO_COUNSELOR, primary_counselor_id: "c2", role: "research" },
  ],
  student_phases: students.map((s) => ({ student_id: s.id, current_phase: s.phase, phase_start_date: iso(-60), compression_mode: false, phase_notes: s.id === S(1) ? "申请季前最后一个学期：锁定选校名单和推荐人。" : "" })),
  student_quarters: students.filter((s) => s.g[1] > 0).map((s) => ({ id: `q-${s.id}`, student_id: s.id, academic_year: `${y}-${y + 1}`, quarter, quarter_focus: "打好学术基础，推进研究和竞赛", quarter_kpi: goals(s.g[0], s.g[1], goalTexts), quarter_risk: "" })),
  todos: [
    { id: "t1", title: "SHAD 文书初稿", completed: false, author_id: S(2), due_date: iso(2), created_at: nowIso(-3) },
    { id: "t2", title: "AP Chem 第三单元复习", completed: false, author_id: S(1), due_date: iso(-2), created_at: nowIso(-5) },
    { id: "t3", title: "联系 UBC 实验室导师", completed: false, author_id: S(1), due_date: iso(9), created_at: nowIso(-1) },
    { id: "t4", title: "整理活动清单", completed: true, author_id: S(4), due_date: iso(-20), created_at: nowIso(-12) },
    { id: "t5", title: "准备 AMC 10", completed: false, author_id: S(5), due_date: iso(6), created_at: nowIso(-8) },
    { id: "t6", title: "SHAD 文书修改第二稿", completed: true, author_id: S(2), due_date: iso(-8), created_at: nowIso(-15) },
    { id: "t7", title: "准备与王教授面谈的研究兴趣介绍（1 页）", completed: false, author_id: S(2), due_date: iso(-1), created_at: nowIso(-15) },
    { id: "t8", title: "📌 SHAD 申请截止", completed: false, author_id: S(2), due_date: iso(4), created_at: nowIso(-20) },
    { id: "t9", title: "整理 Python 数据分析小项目到 GitHub", completed: false, author_id: S(2), due_date: null, created_at: nowIso(-2) },
  ],
  notes: [
    { id: "n1", title: "11 月会议记录", content: "确认推荐人：化学老师和物理老师。", author_id: S(1), created_at: nowIso(-2), date: iso(-2) },
    { id: "n2", title: "暑期安排", content: "考虑 UBC 夏校或实验室实习。", author_id: S(2), author_name: "Evan Liu", created_at: nowIso(-6), date: iso(-6) },
    { id: "n3", title: "电话：妈妈", content: "电话：妈妈问 SHAD 面试一般在什么时候，已解释 2 月左右通知；她希望暑期项目控制在 5000 加元以内。", author_id: S(2), author_name: "Nick Tang", created_at: nowIso(-3), date: iso(-3) },
    { id: "n4", title: "微信：王教授回复", content: "微信：王教授回复可以 11 月中旬面谈，Evan 已确认时间。", author_id: S(2), author_name: "Jamma Wu", created_at: nowIso(-1), date: iso(-1) },
  ],
  planning_milestones: [
    { id: "m1", student_id: S(1), title: "确定推荐人名单", due_date: iso(5), description: "", phase: "consolidation" },
    { id: "m2", student_id: S(3), title: "提交 SHAD 申请", due_date: iso(4), description: "", phase: "positioning" },
    { id: "m3", student_id: S(2), title: "SHAD 申请截止", due_date: iso(4), description: "", document_id: "d2" },
    { id: "m4", student_id: S(2), title: "AMC 10A 考试", due_date: iso(9), description: "", document_id: "d2" },
    { id: "m5", student_id: S(2), title: "UBC 化学夏校报名开放", due_date: iso(-20), description: "", document_id: "d2" },
  ],
  academic_report_requests: [{ id: "a1", student_id: S(3), due_date: iso(-3), message: "请上传期中成绩单", fulfilled_at: null }],
  academic_reports: [
    { id: "r1", student_id: S(1), source: "upload", file_path: "x.pdf", file_name: "Term1.pdf", mime_type: "application/pdf", period_label: "2026-27 第一学期", status: "ready", created_at: nowIso(-4) },
  ],
  academic_report_briefs: [
    { report_id: "r1", student_id: S(1), brief: "x", error: null, data: { school: "St. George's School", period: "2026-27 Term 1", overall: "整体成绩稳定，理科突出，英语写作略有下滑。", courses: [{ name: "AP Chemistry", grade: "A", percent: 94, comment: "实验报告质量很高" }, { name: "Pre-Calculus 12", grade: "A", percent: 91, comment: null }, { name: "English 12", grade: "B", percent: 78, comment: "写作结构需要加强" }], changes: ["English 12 从 84% 降到 78%"], risks: ["English 12 低于 80%"], suggestions: ["安排每两周一次写作辅导"] } },
  ],
  planning_documents: [
    { id: "d1", student_id: S(1), title: "2026-27 聚焦阶段规划方案", phase: "consolidation", is_primary: true, content: "一、阶段目标\n锁定选校名单、推荐人和文书主题。", file_path: null, file_name: null, drive_file_id: null, source_url: null, updated_at: nowIso(-10), created_at: nowIso(-10) },
    { id: "d2", student_id: S(2), title: "Evan 定位期规划方案", phase: "positioning", is_primary: true, content: "定位期：研究 + 竞赛双主线。", file_path: null, file_name: "Evan 定位期规划方案.docx", drive_file_id: null, source_url: null, updated_at: nowIso(-60), created_at: nowIso(-60) },
    { id: "d3", student_id: S(2), title: "Evan 探索期规划方案", phase: "exploration", is_primary: false, content: "探索期。", file_path: null, file_name: "Evan 探索期规划方案.docx", drive_file_id: null, source_url: null, updated_at: nowIso(-420), created_at: nowIso(-420) },
  ],
  planning_reports: [
    { id: "r1", student_id: S(2), report_type: "quarterly", title: `${y - 1}-${y} Q4 夏季 季度评估`, quarter: "Q4_summer", academic_year: `${y - 1}-${y}`, status: "published", created_at: nowIso(-70), final_content: "### 本季度核心成果\n- 完成 UBC 化学夏校\n- 自学 Python 数据分析\n\n### 下季度重点建议\n- 尽快确定冬季研究机会\n- 准备 SHAD 申请", ai_draft: null },
  ],
  student_meetings: [
    { id: "m1", student_id: S(2), meeting_date: nowIso(-15), title: "SHAD 申请与研究机会", quarter, academic_year: `${y}-${y + 1}`, summary: "SHAD 文书完成初稿，主题定为水质检测项目；UBC 研究机会已联系两位教授，一位回复需要面谈。", decision_list: ["SHAD 文书围绕水质检测项目展开", "优先跟进回复了的王教授"], emailed_to: ["学生"] },
  ],
  meeting_action_items: [
    { id: "a1", meeting_id: "m1", student_id: S(2), title: "SHAD 文书修改第二稿", owner: "student", due_date: iso(-8), completed: true, todo_id: "t6", created_at: nowIso(-15) },
    { id: "a2", meeting_id: "m1", student_id: S(2), title: "准备与王教授面谈的研究兴趣介绍（1 页）", owner: "student", due_date: iso(-1), completed: false, todo_id: "t7", created_at: nowIso(-15) },
    { id: "a3", meeting_id: "m1", student_id: S(2), title: "帮学生约推荐信老师", owner: "counselor", due_date: iso(-5), completed: true, todo_id: null, created_at: nowIso(-15) },
    { id: "a4", meeting_id: "m1", student_id: S(2), title: "整理 3 个暑期项目选项（预算 5000 加元内）", owner: "counselor", due_date: iso(6), completed: false, todo_id: null, created_at: nowIso(-15) },
    { id: "a5", meeting_id: null, student_id: S(2), title: "确认 UBC 夏校报名费和住宿安排", owner: "parent", due_date: iso(12), completed: false, todo_id: null, created_at: nowIso(-3) },
    { id: "a6", meeting_id: null, student_id: S(2), title: "给王教授发感谢邮件并抄送 Evan", owner: "counselor", due_date: iso(1), completed: false, todo_id: null, created_at: nowIso(-1) },
  ],
  meeting_private: [{ meeting_id: "m1", team_note: "学生对研究很积极，但时间管理偏弱，近期功课压力大，注意任务量。" }],
  shared_folders: [],
  extracurricular_activities: [{ id: "e1", student_id: S(1), name: "Robotics Club", role: "Team Captain", description: "带领团队参加 FRC 比赛", time_commitment: "6 小时/周" }],
  mock_interview_custom_questions: [],
  mock_interview_sessions: [
    { id: "is1", student_id: S(2), mode: "simulation", title: "University of Toronto · Engineering", status: "completed", total: 4, answered: 4, started_at: nowIso(-1), updated_at: nowIso(-1),
      questions: [
        { key: "a", text: "Tell us about a time you worked on a team that faced a setback. What did you do?", type: "video", answered: true, attempts: 1 },
        { key: "b", text: "Why are you interested in engineering at the University of Toronto?", type: "video", answered: true, attempts: 2 },
        { key: "c", text: "A city wants to reduce traffic at one busy intersection. How would you approach the problem?", type: "video", answered: true, attempts: 1 },
        { key: "d", text: "Describe something you taught yourself recently.", type: "video", answered: true, attempts: 1 },
      ] },
    { id: "is2", student_id: S(2), mode: "practice", title: "通用题库", status: "exited", total: 5, answered: 2, started_at: nowIso(-4), updated_at: nowIso(-4),
      questions: [
        { key: "e", text: "What is a challenge facing your community, and how would you address it?", type: "video", answered: true, attempts: 1 },
        { key: "f", text: "Tell us about a failure and what you learned.", type: "video", answered: true, attempts: 3 },
        { key: "g", text: "If you could change one thing about your school, what would it be?", type: "video", answered: false, attempts: 0 },
        { key: "h", text: "Describe a time you disagreed with someone.", type: "video", answered: false, attempts: 0 },
        { key: "i", text: "What do you do outside of school?", type: "video", answered: false, attempts: 0 },
      ] },
    { id: "is3", student_id: S(2), mode: "practice", title: "工程专业", status: "in_progress", total: 3, answered: 1, started_at: nowIso(-9), updated_at: nowIso(-9),
      questions: [
        { key: "j", text: "How would you design a bridge for a small river crossing?", type: "video", answered: true, attempts: 1 },
        { key: "k", text: "What engineering project are you proudest of?", type: "video", answered: false, attempts: 0 },
        { key: "l", text: "Explain a technical idea to a ten-year-old.", type: "video", answered: false, attempts: 0 },
      ] },
  ],
};
let seq = 100;
type Filter = (row: any) => boolean;

class Query {
  private filters: Filter[] = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private mode: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: any = null;
  private singleMode: "one" | "maybe" | null = null;
  constructor(private table: string) {
    tables[table] ||= [];
  }
  private countMode = false;
  select(_cols?: string, o?: { count?: string; head?: boolean }) { if (o?.count) this.countMode = true; return this; }
  insert(v: any) { this.mode = "insert"; this.payload = v; return this; }
  update(v: any) { this.mode = "update"; this.payload = v; return this; }
  upsert(v: any) { this.mode = "upsert"; this.payload = v; return this; }
  delete() { this.mode = "delete"; return this; }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v); return this; }
  neq(c: string, v: any) { this.filters.push((r) => r[c] !== v); return this; }
  is(c: string, v: any) { this.filters.push((r) => (r[c] ?? null) === v); return this; }
  in(c: string, v: any[]) { this.filters.push((r) => v.includes(r[c])); return this; }
  gte(c: string, v: any) { this.filters.push((r) => r[c] >= v); return this; }
  lte(c: string, v: any) { this.filters.push((r) => r[c] <= v); return this; }
  not() { return this; }
  or() { return this; }
  ilike() { return this; }
  order(col: string, o?: { ascending?: boolean }) { this.orderBy = { col, asc: o?.ascending !== false }; return this; }
  limit(n: number) { this.max = n; return this; }
  maybeSingle() { this.singleMode = "maybe"; return this; }
  single() { this.singleMode = "one"; return this; }
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  then(res: any, rej?: any) { return Promise.resolve(this.run()).then(res, rej); }
  private run() {
    const rows = tables[this.table];
    const match = (r: any) => this.filters.every((f) => f(r));
    if (this.mode === "insert" || this.mode === "upsert") {
      const items = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((p: any) => ({
        id: p.id || `demo-${seq++}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...p,
      }));
      for (const it of items) {
        const i = rows.findIndex((r) => r.id === it.id);
        if (i >= 0) rows[i] = { ...rows[i], ...it }; else rows.unshift(it);
      }
      return this.shape(items);
    }
    if (this.mode === "update") {
      const hit = rows.filter(match);
      hit.forEach((r) => Object.assign(r, this.payload));
      return this.shape(hit);
    }
    if (this.mode === "delete") {
      const keep = rows.filter((r) => !match(r));
      tables[this.table] = keep;
      return { data: null, error: null };
    }
    let out = rows.filter(match);
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      out = [...out].sort((a, b) => ((a[col] ?? "") > (b[col] ?? "") ? 1 : -1) * (asc ? 1 : -1));
    }
    if (this.max !== null) out = out.slice(0, this.max);
    return this.shape(out);
  }
  private shape(list: any[]) {
    if (this.countMode) return { data: null, count: list.length, error: null };
    const copy = JSON.parse(JSON.stringify(list));
    if (this.singleMode) return { data: copy[0] ?? null, error: null };
    return { data: copy, error: null };
  }
}

const user = { id: DEMO_COUNSELOR, email: "nick@example.com", user_metadata: { full_name: "Nick Tang" } };
const session = { user, access_token: "demo", expires_at: Math.floor(Date.now() / 1000) + 36000 };
export const DEMO_STUDENT_VIEW = S(2);
/** Switch the signed-in demo user between the counselor and Evan (student view). */
export function setDemoUser(asStudent: boolean) {
  const p = tables.profiles.find((r) => r.id === (asStudent ? S(2) : DEMO_COUNSELOR));
  user.id = asStudent ? S(2) : DEMO_COUNSELOR;
  user.email = p?.email || "";
  user.user_metadata = { full_name: p?.full_name || "" };
}

// A graduate (MBA) applicant for the demo.
const G1 = "g0000001-0000-0000-0000-000000000000";
tables.profiles.push({ id: G1, full_name: "Lucy Wang", user_type: "student", status: "Graduate", applicant_type: "graduate", grad_status: "graduated", grad_degree: "mba", target_entry_term: "fall", target_entry_year: today.getFullYear() + 2, school: "University of British Columbia", email: "lucy@example.com", interested_majors: ["MBA"], background_intro: "UBC 商科毕业，在温哥华科技公司做产品经理 3 年，计划申请 MBA。", created_at: nowIso(-20) });
tables.counselor_student_relationships.push({ student_id: G1, counselor_id: DEMO_COUNSELOR });
tables.student_phases.push({ student_id: G1, current_phase: "grad_positioning", phase_start_date: iso(-20), compression_mode: false, phase_notes: "" });
tables.student_quarters.push({ id: `q-${G1}`, student_id: G1, academic_year: `${y}-${y + 1}`, quarter, quarter_focus: "确定 MBA 申请方向和目标项目，制定 GMAT 备考计划", quarter_kpi: JSON.stringify([{ id: "g1", text: "完成 GMAT 诊断测试", completed: true }, { id: "g2", text: "列出 10 个目标 MBA 项目并对比", completed: false }, { id: "g3", text: "梳理 3 段代表性工作经历", completed: false }]), quarter_risk: "" });

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const LUCY_RESUME = {
  full_name: "Lucy Wang", email: "lucy.wang@gmail.com", phone: "+1 604-555-0182", address: "Vancouver, BC", linkedin_url: "linkedin.com/in/lucywang", personal_website: "",
  education: [{ school: "University of British Columbia, Sauder School of Business", degree: "Bachelor of Commerce", field: "Business Technology Management", startDate: "2017-09", endDate: "2021-05", gpa: "3.7/4.0", description: "Dean's List 2019–2021" }],
  work_experience: [
    { company: "Clio", position: "Product Manager", startDate: "2023-03", endDate: "Present", description: "- 负责计费模块，带 8 人跨职能团队\n- 上线自动对账功能，客户续费率提升 6%\n- 和销售、客服一起梳理需求，季度路线图按时交付" },
    { company: "Clio", position: "Associate Product Manager", startDate: "2021-07", endDate: "2023-02", description: "- 做用户访谈 40+ 次，重新设计新手引导\n- 新用户 7 日留存从 41% 提到 52%" },
  ],
  activities: [],
  projects: [{ name: "Women in Product Vancouver", role: "Co-organizer", startDate: "2022-01", endDate: "Present", description: "- 组织季度分享会，社区成员从 120 人增长到 600 人", technologies: [] }],
  awards: [{ name: "Clio Customer Impact Award", issuer: "Clio", date: "2024-12", description: "" }],
  skills: ["SQL", "Figma", "A/B testing", "Jira"], certifications: ["GMAT 705"],
  languages: [{ language: "English", proficiency: "Fluent" }, { language: "Mandarin", proficiency: "Native" }],
};
const LUCY_MD = `# Lucy Wang
Vancouver, BC · lucy.wang@gmail.com · +1 604-555-0182 · linkedin.com/in/lucywang

## Professional Experience
### Clio — Product Manager (Mar 2023 – Present)
- Lead billing product with an 8-person cross-functional team (engineering, design, data)
- Launched automated reconciliation, lifting customer renewal rate by 6%
- Aligned sales and support input into a quarterly roadmap delivered on schedule

### Clio — Associate Product Manager (Jul 2021 – Feb 2023)
- Ran 40+ customer interviews and redesigned onboarding
- Raised new-user 7-day retention from 41% to 52%

## Education
### University of British Columbia, Sauder School of Business (Sep 2017 – May 2021)
- Bachelor of Commerce, Business Technology Management · GPA 3.7/4.0 · Dean's List 2019–2021

## Additional Information
- **Leadership:** Co-organizer, Women in Product Vancouver — grew community from 120 to 600 members
- **Awards:** Clio Customer Impact Award (2024)
- **Test:** GMAT 705
- **Skills:** SQL, Figma, A/B testing, Jira
- **Languages:** English (fluent), Mandarin (native)`;

async function demoFunction(name: string, body: any): Promise<any> {
  if (name === "resume-import") {
    await sleep(2500);
    return { data: { data: LUCY_RESUME }, error: null };
  }
  if (name === "generate-resume") {
    await sleep(2500);
    return { data: { resume: LUCY_MD }, error: null };
  }
  await wait(900);
  if (name === "meeting-assistant" && body.action === "organize") {
    const ubc = (body.goals || []).find((g: any) => /UBC/.test(g.text) && !g.completed);
    return { data: {
      title: "研究机会落实 + SHAD 终稿",
      summary: "王教授同意冬季让学生每周去实验室 4 小时做水样数据整理；SHAD 文书第三稿基本定稿；AP Chem 期中 94 分；12 月起备赛 Euclid。",
      decisions: ["冬季研究：王教授实验室，每周 4 小时", "Euclid 从 12 月开始，每周两套真题", "暑期项目下次会议讨论"],
      tasks: [
        { text: "提交 SHAD 申请终稿", owner: "student", due: iso(4) },
        { text: "和王教授确认冬季实验室时间表", owner: "student", due: iso(7) },
        { text: "整理 3 个暑期项目选项，下次会议讨论", owner: "counselor", due: iso(14) },
      ],
      goal_updates: [...(ubc ? [{ kind: "done", goal_id: ubc.id }] : []), { kind: "add", text: "12 月起每周两套 Euclid 真题" }],
      team_note: "最近睡得晚，提醒注意节奏；妈妈关心暑期项目。",
    }, error: null };
  }
  if (name === "meeting-assistant" && body.action === "save") {
    const m = body.meeting;
    const id = `m${seq++}`;
    tables.student_meetings.unshift({ id, student_id: body.student_id, meeting_date: `${m.date}T12:00:00Z`, title: m.title, quarter: m.quarter, academic_year: m.academic_year, summary: m.summary, decision_list: m.decisions, emailed_to: [body.email?.student && "学生", body.email?.parent && "家长"].filter(Boolean) });
    tables.meeting_private.push({ meeting_id: id, team_note: m.team_note });
    let todos = 0;
    for (const t of m.tasks) {
      let todoId = null;
      if (t.owner === "student") {
        todos++;
        todoId = `t${seq++}`;
        tables.todos.push({ id: todoId, title: t.text, completed: false, author_id: body.student_id, due_date: t.due, created_at: new Date().toISOString() });
      }
      tables.meeting_action_items.push({ id: `a${seq++}`, meeting_id: id, student_id: body.student_id, title: t.text, owner: t.owner, due_date: t.due, completed: false, todo_id: todoId, created_at: new Date().toISOString() });
    }
    const q = tables.student_quarters.find((r) => r.student_id === body.student_id && r.quarter === m.quarter && r.academic_year === m.academic_year);
    if (q && body.goal_updates?.length) {
      let goals = JSON.parse(q.quarter_kpi || "[]");
      for (const u of body.goal_updates) {
        if (u.kind === "done") goals = goals.map((g: any) => (g.id === u.goal_id ? { ...g, completed: true } : g));
        else goals.push({ id: `k${seq++}`, text: u.text, completed: false });
      }
      q.quarter_kpi = JSON.stringify(goals);
    }
    const emailed = [body.email?.student && "学生", body.email?.parent && "家长"].filter(Boolean);
    return { data: { ok: true, meeting_id: id, todos, goals_changed: !!body.goal_updates?.length, emailed, followup: ["Jamma Wu"] }, error: null };
  }
  if (name === "generate-quarter-plan") {
    return { data: { suggestions: { focus: "冲刺 SHAD 申请，落实冬季研究机会", kpi: ["提交 SHAD 申请终稿（12/1 前）", "确定冬季研究助理安排，每周 4 小时", "AP Chem 期中考试 ≥ 90%", "开始 Euclid 备赛，每周两套真题"] } }, error: null };
  }
  if (name === "generate-planning-report") {
    const en = body.language === "en";
    return { data: { report: en
      ? "## Quarterly Review\n\n### 1. Key achievements\n- AP Chem unit test 94%\n- SHAD application nearly final\n\n### 2. Priorities for next quarter\n- Start the winter research position"
      : "## 季度评估报告\n\n### 1. 本季度核心成果\n- AP Chem 单元测验 94%\n- SHAD 文书第三稿基本定稿\n\n### 2. 目标完成情况\n- 2/4 已完成，冬季研究机会已落实\n\n### 3. 下季度重点建议\n- 开始实验室工作，记录研究日志\n- Euclid 每周两套真题" }, error: null };
  }
  return { data: { ok: true }, error: null };
}

export const supabase: any = {
  from: (t: string) => new Query(t),
  rpc: async (name: string, args: any) => {
    if (name === "set_current_plan") {
      const doc = tables.planning_documents.find((d) => d.id === args.p_doc_id);
      tables.planning_documents.forEach((d) => { if (d.student_id === doc?.student_id) d.is_primary = d.id === args.p_doc_id; });
    }
    return { data: true, error: null };
  },
  auth: {
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user }, error: null }),
    onAuthStateChange: (cb: any) => {
      setTimeout(() => cb("SIGNED_IN", session), 0);
      return { data: { subscription: { unsubscribe() {} } } };
    },
    signOut: async () => {
      alert("这是演示页面，不会真的退出登录。");
      return { error: null };
    },
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: {}, error: null }),
      remove: async () => ({ data: {}, error: null }),
      download: async () => ({ data: new Blob(["demo"]), error: null }),
      createSignedUrl: async () => ({ data: { signedUrl: "about:blank" }, error: null }),
    }),
  },
  functions: { invoke: (name: string, opts: any) => demoFunction(name, opts?.body || {}) },
  channel: () => {
    const ch: any = { on: () => ch, subscribe: () => ch, unsubscribe: () => undefined };
    return ch;
  },
  removeChannel: () => undefined,
};
export default supabase;
