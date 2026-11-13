// Prompts and clean-up for school-list-assist, kept apart so they can be tested.

export const SYSTEMS = ["CA", "CO", "UC", "OU", "BC", "UK", "HK", "SG", "GR", "OTHER"] as const;
export const EXTRACT_PROMPT = (today: string) => `You read a college counselor's notes about one student and list the universities the student plans to apply to.
Today is ${today}. Use ONLY schools the notes name as application targets (a final or current list wins over earlier brainstorms; skip schools the notes say were dropped). Never add schools of your own.
Return JSON {"schools":[...]} where each item has:
- college_name: official English name
- major: intended major or programme, if stated (else "")
- round: one of "ED", "ED2", "EA", "REA", "RD", "Rolling", "Priority", "" (unknown)
- application_system: one of ${SYSTEMS.join(", ")} — CA Common App, CO Coalition, UC University of California, OU OUAC (Ontario), BC EducationPlannerBC (BC incl. UBC, SFU, UVic), UK UCAS, HK Hong Kong university portal, SG Singapore university portal, GR graduate school portal, OTHER
- country: e.g. "US", "Canada", "UK", "Hong Kong", "Singapore"
- category: "reach", "target", "safety" or "" — only if the notes say so
- deadline: "YYYY-MM-DD". If the notes give a deadline for this school, use exactly that date, even if it differs from what you believe the deadline is. Only if the notes give none, use your best knowledge of the usual deadline for that round in the cycle after ${today.slice(0, 4)}; else null
- deadline_from_notes: true only if the date came from the notes
- evidence: where in the notes this school appears, a short quote (≤ 20 words)
Most important first if the notes rank them.`;

export const TODOS_PROMPT = (today: string) => `You plan the remaining work for a student's university applications.
Today is ${today}. For each school below, list the concrete steps still needed before its deadline, counting back from the deadline with sensible lead times (e.g. supplement essay first draft ~3–4 weeks before, final ~1 week before, recommendation requests ≥4 weeks before, submit 3–5 days before). Use what each application system usually requires (UC: 4 Personal Insight Questions and self-reported grades, no test scores; UCAS: one personal statement for all choices and a reference; Common App: supplements per school; OUAC/EducationPlannerBC: supplementary forms where the school has them). Merge steps shared by several schools on the same system into one item naming those schools. Skip schools already submitted. Never date anything before today; if a deadline is too close, compress.
Return JSON {"todos":[...]} each with:
- title: short, in Chinese, starting with a verb, naming the school(s) (e.g. "完成 UCLA / UCSD 第 4 篇 PIQ 初稿")
- due_date: "YYYY-MM-DD"
- owner: "student" or "counselor" (counselor: reviewing essays, checking forms, confirming recommenders, final review before submission)
- school: the school name(s) it is for`;

const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function cleanSchools(raw: unknown) {
  const list = Array.isArray((raw as { schools?: unknown })?.schools) ? (raw as { schools: Record<string, unknown>[] }).schools : [];
  const seen = new Set<string>();
  return list.flatMap((s) => {
    const name = String(s.college_name ?? "").trim().slice(0, 200);
    const major = String(s.major ?? "").trim().slice(0, 200);
    const key = `${name.toLowerCase()}|${major.toLowerCase()}`;
    if (!name || seen.has(key)) return [];
    seen.add(key);
    const sys = String(s.application_system ?? "").toUpperCase();
    const cat = String(s.category ?? "");
    return [{
      college_name: name, major,
      round: ["ED", "ED2", "EA", "REA", "RD", "Rolling", "Priority"].includes(String(s.round)) ? String(s.round) : "",
      application_system: (SYSTEMS as readonly string[]).includes(sys) ? sys : "OTHER",
      country: String(s.country ?? "").slice(0, 60),
      category: ["reach", "target", "safety"].includes(cat) ? cat : "",
      deadline: isDate(s.deadline) ? String(s.deadline) : null,
      deadline_from_notes: s.deadline_from_notes === true,
      evidence: String(s.evidence ?? "").slice(0, 200),
    }];
  });
}

export function cleanTodos(raw: unknown, today: string) {
  const list = Array.isArray((raw as { todos?: unknown })?.todos) ? (raw as { todos: Record<string, unknown>[] }).todos : [];
  return list.flatMap((t) => {
    const title = String(t.title ?? "").trim().slice(0, 300);
    if (!title) return [];
    let due = isDate(t.due_date) ? String(t.due_date) : null;
    if (due && due < today) due = today;
    return [{ title, due_date: due, owner: t.owner === "counselor" ? "counselor" : "student", school: String(t.school ?? "").slice(0, 200) }];
  }).sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));
}

