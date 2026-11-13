import { describe, expect, it } from "vitest";
import { type Activity, applicationLists, exportText, isActivityRequest, period, requestTitle, staleness } from "./model";
import { fit, normalize } from "../../../supabase/functions/activity-assist/logic";

let n = 0;
const act = (p: Partial<Activity>): Activity => ({
  id: `a${++n}`, student_id: "s", name: `A${n}`, role: null, description: null, category: "activity", status: "ongoing",
  start_date: null, end_date: null, hours_per_week: null, weeks_per_year: null, timing: null, organization: null, level: null,
  name_en: null, description_en: null, ca_text: null, uc_text: null, ca_type: null, uc_category: null, evidence_url: null,
  continue_in_college: null, grade_levels: null, sort_order: n, reviewed_at: null, needs_review: false,
  updated_at: new Date().toISOString(), updated_by: null, created_at: new Date(2026, 0, n).toISOString(), ...p,
});

describe("application lists", () => {
  it("splits activities and honours, keeps order, drops planned, applies limits", () => {
    const all = [
      ...Array.from({ length: 12 }, (_, i) => act({ sort_order: 20 - i })),
      act({ category: "honor", sort_order: 1 }),
      act({ category: "competition", level: "national", sort_order: 2 }),
      act({ category: "competition", sort_order: 3 }),
      act({ status: "planned", sort_order: 0 }),
    ];
    const l = applicationLists(all);
    expect(l.commonApp).toHaveLength(10);
    expect(l.commonApp[0].sort_order).toBe(3); // competition without a level counts as an activity
    expect(l.honors.map((a) => a.category)).toEqual(["honor", "competition"]);
    expect(l.uc).toHaveLength(15);
    expect(l.uc.some((a) => a.status === "planned")).toBe(false);
  });

  it("exports a pasteable list", () => {
    const t = exportText([act({ name: "机器人社", name_en: "Robotics Club", role: "Captain", ca_text: "Led 6", ca_type: "Robotics", hours_per_week: 5, weeks_per_year: 30 })], "commonApp");
    expect(t).toContain("1. Robotics Club");
    expect(t).toContain("Type: Robotics");
    expect(t).toContain("Description: Led 6");
    expect(t).toContain("5 hr/wk · 30 wk/yr");
  });
});

describe("helpers", () => {
  it("flags stale entries", () => {
    const today = new Date("2026-11-13");
    expect(staleness(act({ updated_at: "2026-07-01T00:00:00Z" }), today)).toBe("old");
    expect(staleness(act({ end_date: "2026-10-01" }), today)).toBe("ended");
    expect(staleness(act({ status: "ended", updated_at: "2020-01-01T00:00:00Z" }), today)).toBeNull();
  });
  it("formats periods", () => {
    expect(period({ start_date: "2025-09-01", end_date: null, status: "ongoing" }, "zh")).toBe("2025.9 – 至今");
    expect(period({ start_date: "2025-09-01", end_date: "2026-06-01", status: "ended" }, "en")).toBe("Sep 2025 – Jun 2026");
  });
  it("recognises the request to-do", () => {
    expect(isActivityRequest(requestTitle("加上暑期科研"))).toBe(true);
    expect(isActivityRequest("📋 交成绩单")).toBe(false);
  });
});

describe("AI answer clean-up", () => {
  it("cuts at a word boundary within the limit", () => {
    const s = "Led a team of six students; designed and built the competition robot; placed third at provincials out of forty teams";
    const out = fit(s, 60);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(s.startsWith(out)).toBe(true);
    expect(out.endsWith(";")).toBe(false);
  });
  it("normalises categories and reports over-long fields", () => {
    const { s, over } = normalize({ name_en: "Robotics", ca_text: "x ".repeat(100), ca_type: "robotics", uc_category: "nonsense" });
    expect(s.ca_type).toBe("Robotics");
    expect(s.uc_category).toBe("Extracurricular activity");
    expect(over).toEqual(["ca_text"]);
    expect(s.ca_text.length).toBeLessThanOrEqual(150);
  });
});
