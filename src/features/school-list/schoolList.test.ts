import { describe, expect, it } from "vitest";
import { cleanSchools, cleanTodos } from "../../../supabase/functions/school-list-assist/logic";
import { byDeadline, daysUntil, systemsOf } from "./data";

describe("AI school list clean-up", () => {
  it("keeps valid fields, normalises the rest, drops blanks and duplicates", () => {
    const out = cleanSchools({ schools: [
      { college_name: "UCLA", major: "Economics", round: "RD", application_system: "uc", category: "reach", deadline: "2026-12-01", deadline_from_notes: false, evidence: "UCLA 冲刺" },
      { college_name: "ucla", major: "economics", application_system: "UC" },
      { college_name: "", major: "x" },
      { college_name: "LSE", round: "weird", application_system: "UCAS?", category: "maybe", deadline: "Jan 14" },
    ] });
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({ college_name: "UCLA", application_system: "UC", round: "RD", category: "reach", deadline: "2026-12-01", deadline_from_notes: false });
    expect(out[1]).toMatchObject({ college_name: "LSE", application_system: "OTHER", round: "", category: "", deadline: null });
    expect(cleanSchools(null)).toEqual([]);
  });
  it("to-dos: no dates in the past, sorted by date, owner defaults to student", () => {
    const out = cleanTodos({ todos: [
      { title: "提交 UC", due_date: "2026-11-26", owner: "student" },
      { title: "审核 PIQ", due_date: "2026-11-01", owner: "counselor" },
      { title: "  ", due_date: "2026-11-20" },
      { title: "请推荐信", due_date: null, owner: "x" },
    ] }, "2026-11-13");
    expect(out.map((t) => t.title)).toEqual(["审核 PIQ", "提交 UC", "请推荐信"]);
    expect(out[0]).toMatchObject({ due_date: "2026-11-13", owner: "counselor" });
    expect(out[2].owner).toBe("student");
  });
});

describe("school list helpers", () => {
  it("collects the systems in use, ignoring withdrawn and other", () => {
    expect(systemsOf([
      { application_system: "UC", status: "preparing" }, { application_system: "UC", status: "submitted" },
      { application_system: "UK", status: "withdrawn" }, { application_system: "OTHER", status: "preparing" }, { application_system: null, status: "preparing" },
    ]).sort()).toEqual(["UC"]);
  });
  it("orders by deadline and counts days", () => {
    const l = [{ deadline: null, college_name: "B" }, { deadline: "2027-01-02", college_name: "A" }, { deadline: "2026-12-01", college_name: "C" }].sort(byDeadline);
    expect(l.map((x) => x.college_name)).toEqual(["C", "A", "B"]);
    expect(daysUntil("2026-12-01", new Date(2026, 10, 13))).toBe(18);
    expect(daysUntil(null)).toBeNull();
  });
});
