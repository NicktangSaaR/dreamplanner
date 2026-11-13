import { describe, expect, it } from "vitest";
import { type Activity, exportText, isActivityRequest, period, requestTitle, staleness } from "./model";
import { fit, normalize } from "../../../supabase/functions/activity-assist/logic";

let n = 0;
const act = (p: Partial<Activity>): Activity => ({
  id: `a${++n}`, student_id: "s", name: `A${n}`, role: null, description: null, category: "activity", status: "ongoing",
  start_date: null, end_date: null, hours_per_week: null, weeks_per_year: null, timing: null, organization: null, level: null,
  name_en: null, description_en: null, ca_text: null, uc_text: null, ca_type: null, uc_category: null, evidence_url: null,
  continue_in_college: null, grade_levels: null, sort_order: n, reviewed_at: null, needs_review: false,
  updated_at: new Date().toISOString(), updated_by: null, created_at: new Date(2026, 0, n).toISOString(), ...p,
});

describe("export", () => {
  it("lists every entry in English, falling back to the student's words", () => {
    const list = Array.from({ length: 25 }, (_, i) => act({ name: `活动${i}` }));
    list[0] = act({ name: "机器人社", name_en: "Robotics Club", role: "Captain", organization: "Byng", description_en: "Led 6", hours_per_week: 5, start_date: "2025-09-01" });
    list[1] = act({ name: "图书馆志愿者", description: "周末读书" });
    const t = exportText(list);
    expect(t).toContain("1. Robotics Club · Captain · Byng");
    expect(t).toContain("Activity · Ongoing · Sep 2025 – present · 5 hr/wk");
    expect(t).toContain("Led 6");
    expect(t).toContain("2. 图书馆志愿者");
    expect(t).toContain("周末读书");
    expect(t).toContain("25. 活动24"); // no limit
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
  });
  it("keeps the four fields and reports over-long ones", () => {
    const { s, over } = normalize({ name_en: "x".repeat(120), position: "Captain", description_en: " Did things. " });
    expect(Object.keys(s).sort()).toEqual(["description_en", "name_en", "organization", "position"]);
    expect(over).toEqual(["name_en"]);
    expect(s.description_en).toBe("Did things.");
  });
});
