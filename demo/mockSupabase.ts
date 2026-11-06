/* In-memory stand-in for the Supabase client, used only by the demo build. */
/* eslint-disable @typescript-eslint/no-explicit-any */
export const DEMO_STUDENT = "11111111-1111-1111-1111-111111111111";
const today = new Date();
const iso = (d: number) => {
  const x = new Date(today);
  x.setDate(x.getDate() + d);
  return x.toISOString().slice(0, 10);
};
const y = today.getMonth() >= 8 ? today.getFullYear() : today.getFullYear() - 1;
const m = today.getMonth();
const quarter = m >= 8 && m <= 10 ? "Q1_fall" : m >= 11 || m <= 1 ? "Q2_winter" : m >= 2 && m <= 4 ? "Q3_spring" : "Q4_summer";

const tables: Record<string, any[]> = {
  profiles: [{ id: DEMO_STUDENT, full_name: "Amy Chen", user_type: "student", status: "G10", grade: "10", email: "amy@example.com", school: "Point Grey Secondary" }],
  todos: [
    { id: "t1", title: "AP Chem 第三单元复习", completed: false, starred: false, author_id: DEMO_STUDENT, due_date: iso(-2), created_at: iso(-10) },
    { id: "t2", title: "给 UBC 实验室导师发 3 封邮件", completed: false, starred: false, author_id: DEMO_STUDENT, due_date: iso(9), created_at: iso(-8) },
    { id: "t3", title: "完成 SHAD 申请文书初稿", completed: false, starred: false, author_id: DEMO_STUDENT, due_date: iso(25), created_at: iso(-7) },
    { id: "t4", title: "整理课外活动清单", completed: false, starred: false, author_id: DEMO_STUDENT, due_date: null, created_at: iso(-6) },
    { id: "t5", title: "注册 AMC 10", completed: true, starred: false, author_id: DEMO_STUDENT, due_date: iso(-14), created_at: iso(-20) },
  ],
  student_quarters: [{
    id: "q1", student_id: DEMO_STUDENT, academic_year: `${y}-${y + 1}`, quarter,
    quarter_focus: "AP Chem 打基础，联系 UBC 实验室，准备 SHAD 申请",
    quarter_kpi: JSON.stringify([
      { id: "k1", text: "AP Chem 单元测验 ≥ 90%", completed: true },
      { id: "k2", text: "确定一个 UBC 实验室研究机会", completed: false },
      { id: "k3", text: "提交 SHAD 申请", completed: false },
    ]),
  }],
  planning_documents: [{
    id: "d1", student_id: DEMO_STUDENT, title: "2026-27 定位阶段规划方案", file_path: null, file_name: null,
    source_url: "https://docs.google.com/document/d/example", updated_at: iso(-5),
    content: "一、阶段目标\n确定材料工程方向，建立学术与研究的连续性。\n\n二、本学年重点\n1. 学术：AP Chemistry、Pre-Calculus 12 保持 A。\n2. 研究：争取 UBC 材料实验室暑期研究机会。\n3. 活动：SHAD 夏校申请；学校科学社担任项目负责人。\n\n三、时间节点\n- 11 月：联系实验室导师\n- 12 月：提交 SHAD 申请\n- 2 月：确定暑期安排",
  }],
  planning_reports: [{
    id: "r1", student_id: DEMO_STUDENT, title: "Q4 夏季 · 季度评估", status: "published", report_type: "quarterly", created_at: iso(-60),
    final_content: "## 本季度完成情况\n- 完成 UBC 夏校化学课程，成绩 A\n- 开始准备 AP Chemistry\n\n## 下季度重点\n- 联系 UBC 实验室导师\n- 准备 SHAD 申请",
  }],
  shared_folders: [{ id: "f1", created_by: DEMO_STUDENT, title: "Amy 申请材料", folder_url: "https://drive.google.com/drive/folders/example" }],
  academic_report_requests: [{ id: "a1", student_id: DEMO_STUDENT, due_date: iso(12), message: "请上传期中成绩单（Interim Report）", fulfilled_at: null }],
  academic_reports: [],
  notes: [{ id: "n1", title: "和顾问的会议记录", content: "SHAD 文书主题：从修理旧收音机说起。", author_id: DEMO_STUDENT, created_at: iso(-3), date: iso(-3), stars: 0 }],
  user_resumes: [],
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
  select() { return this; }
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
    const copy = JSON.parse(JSON.stringify(list));
    if (this.singleMode) return { data: copy[0] ?? null, error: null };
    return { data: copy, error: null };
  }
}

const user = { id: DEMO_STUDENT, email: "amy@example.com", user_metadata: { full_name: "Amy Chen" } };
const session = { user, access_token: "demo", expires_at: Math.floor(Date.now() / 1000) + 36000 };

export const supabase: any = {
  from: (t: string) => new Query(t),
  rpc: async () => ({ data: true, error: null }),
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
  functions: { invoke: async () => ({ data: { ok: true }, error: null }) },
  channel: () => {
    const ch: any = { on: () => ch, subscribe: () => ch, unsubscribe: () => undefined };
    return ch;
  },
  removeChannel: () => undefined,
};
export default supabase;
