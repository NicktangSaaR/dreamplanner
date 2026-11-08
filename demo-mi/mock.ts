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

export const DEMO_USER = "11111111-1111-1111-1111-111111111111";
let order = 0;
const base = (id: string, kind: string, title: string, extra: Record<string, unknown> = {}) => ({
  id, kind, title, description: null, school: null, program: null, preparation_time: 30, response_time: 60, is_active: true,
  created_at: `2026-10-01T00:00:${String(++order).padStart(2, "0")}Z`, blueprint: [], sim_shuffle: false, sim_retakes: 0, ...extra,
});
const pool = (id: string, title: string, description: string) => base(id, "pool", title, { description });
const sec = (pool_id: string, count: number, prep: number, response: number, question_type: string | null = null) => ({ pool_id, count, question_type, prep, response });
const school = (id: string, school: string, program: string, blueprint: unknown[], extra: Record<string, unknown> = {}) =>
  base(id, "school", `${school} · ${program}`, { school, program, blueprint, ...extra });
let qn = 0;
const q = (bank_id: string, title: string, type = "video") => ({
  id: `bq${++qn}`, bank_id, title, description: null, question_type: type, preparation_time: null, response_time: null, sort_order: qn,
});
const POOLS: Record<string, string[]> = {
  p1: ["Tell me about a person or an event that has markedly changed you.", "Have you ever tried something and failed, but were glad you did it?", "Tell me about yourself.", "Tell me about a time you influenced someone.", "Anything you have done or experienced of which you are most proud?", "How have you left your mark on your community?"],
  p2: ["What would you do with a free day?", "What books do you recommend?", "What is something that you can't stop talking about?", "Tell us about a skill you taught yourself."],
  p3: ["What motivates you?", "What are your strengths and weaknesses?", "If we were privy to your peer evaluation right now, what would it say?", "Which defining principle do you most embody?", "How would you want to be remembered?"],
  p4: ["What is your usual role on a team?", "Tell me about a time when you dealt with conflict.", "You are working on a group project and one member is not contributing. What do you do?", "Your team disagrees on the direction of a project two days before the deadline. How do you handle it?"],
  p5: ["If you had the ability to travel back in time, when would you travel to and why?", "If you could meet anyone, dead or alive, who would it be?", "What would you do if you did not attend college next year?", "If you could add one course that every high school student must take, what would it be?"],
  p6: ["Why do you want to study {program} at {school}?", "What will you contribute to the {school} community?", "How do you think you can make an impact at college?"],
};
const tables: Record<string, any[]> = {
  profiles: [{ id: DEMO_USER, full_name: "Amy Chen", user_type: "admin", email: "amy@example.com" }],
  mock_interview_questions: [
    pool("p1", "个人经历类", "成长经历、挑战与失败、成就、影响你的人或事"),
    pool("p2", "兴趣爱好特长类", "课外活动、爱好、书、热爱的事"),
    pool("p3", "个人品质类", "优缺点、价值观、动力、别人如何评价你"),
    pool("p4", "小组合作情景类", "团队角色、冲突、领导与说服、情景题"),
    pool("p5", "创造性问题类", "假设性、开放性的问题，考察临场思考"),
    pool("p6", "择校与专业动机类", "Why this school / program；可用 {school} {program} 占位"),
    school("s1", "UBC", "Sauder School of Business", [sec("p1", 1, 30, 60), sec("p4", 1, 30, 60), sec("p5", 1, 30, 60), sec("p1", 1, 60, 300, "written")], { description: "演示设置：3 道视频题 + 1 道书面题，每题一次机会。" }),
    school("s2", "University of Waterloo", "Engineering", [sec("p6", 1, 60, 120), sec("p1", 1, 45, 90), sec("p4", 1, 45, 90)], { sim_retakes: 1 }),
    school("s3", "Western University", "Ivey AEO", [sec("p3", 1, 30, 60), sec("p5", 1, 30, 60)], { sim_shuffle: true }),
  ],
  mock_interview_bank_questions: Object.entries(POOLS).flatMap(([id, list]) => list.map((t) => q(id, t))),
  mock_interview_custom_questions: [
    { id: "c1", user_id: DEMO_USER, title: "Why did you choose materials engineering?", question_type: "video", preparation_time: 30, response_time: 60, created_at: iso(-2) },
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
  select() { return this; }
  insert(v: any) { this.mode = "insert"; this.payload = v; return this; }
  update(v: any) { this.mode = "update"; this.payload = v; return this; }
  upsert(v: any) { this.mode = "upsert"; this.payload = v; return this; }
  delete() { this.mode = "delete"; return this; }
  eq(c: string, v: any) { this.filters.push((r) => r[c] === v); return this; }
  neq(c: string, v: any) { this.filters.push((r) => r[c] !== v); return this; }
  is(c: string, v: any) { this.filters.push((r) => (r[c] ?? null) === v); return this; }
  contains(c: string, v: any[]) { this.filters.push((r) => v.every((x) => (r[c] ?? []).some((y: any) => Object.entries(x).every(([k, val]) => y[k] === val)))); return this; }
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

const user = { id: DEMO_USER, email: "amy@example.com", user_metadata: { full_name: "Amy Chen" } };
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
