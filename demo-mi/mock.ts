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
const bank = (id: string, title: string, school: string, program: string, prep: number, resp: number, sim: Partial<Record<string, unknown>> = {}) => ({
  id, title, description: null, school, program, preparation_time: prep, response_time: resp, is_active: true, created_at: iso(-30),
  sim_enabled: true, sim_question_count: null, sim_shuffle: false, sim_retakes: 0, ...sim,
});
let qn = 0;
const q = (bank_id: string, title: string, type = "video", prep: number | null = null, resp: number | null = null) => ({
  id: `bq${++qn}`, bank_id, title, description: null, question_type: type, preparation_time: prep, response_time: resp, sort_order: qn,
});
const tables: Record<string, any[]> = {
  profiles: [{ id: DEMO_USER, full_name: "Amy Chen", user_type: "admin", email: "amy@example.com" }],
  mock_interview_questions: [
    bank("b1", "UBC Sauder · Kira", "UBC", "Sauder School of Business", 30, 60, { sim_question_count: 4, sim_shuffle: true }),
    bank("b2", "Waterloo Engineering · AIF Video", "University of Waterloo", "Engineering", 45, 90, { sim_retakes: 1 }),
    bank("b3", "Western Ivey AEO", "Western University", "Ivey AEO", 30, 60),
    bank("b4", "通用行为面试题", "", "", 30, 90, { sim_enabled: false }),
  ],
  mock_interview_bank_questions: [
    q("b1", "Why are you interested in studying business at {school}?"),
    q("b1", "Tell us about a time you worked on a team and things did not go as planned."),
    q("b1", "Describe a time you had to persuade someone to see your point of view."),
    q("b1", "What does leadership mean to you? Give an example."),
    q("b1", "In 150 words, describe a challenge you overcame.", "written", 30, 300),
    q("b1", "If you could change one thing about your community, what would it be?"),
    q("b2", "Why do you want to study {program} at {school}?", "video", 60, 120),
    q("b2", "Describe a project you built. What would you do differently?"),
    q("b2", "Tell us about a time you failed and what you learned."),
    q("b3", "Describe your most meaningful leadership experience."),
    q("b3", "What is a business you admire, and why?"),
    q("b4", "Tell me about yourself."),
    q("b4", "What is your greatest strength?"),
    q("b4", "Describe a time you showed resilience."),
  ],
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
