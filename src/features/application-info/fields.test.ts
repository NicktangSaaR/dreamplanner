import { describe, expect, it } from "vitest";
import { isFilled, problem, progress, SECTIONS, visibleSections } from "./fields";
import { prefill } from "./data";
import { buildExport, exportAsText } from "./exportData";

const keys = (secs: ReturnType<typeof visibleSections>) => secs.flatMap((s) => s.fields.map((f) => f.key));

describe("which fields show", () => {
  it("UCAS-only first-year sees UCAS things and not Common App things", () => {
    const k = keys(visibleSections(["UK"], "first_year", { schools: { curriculum: "A-Level" } }));
    expect(k).toEqual(expect.arrayContaining(["legal_first", "uk_residency", "ucas_choices", "predicted", "recommenders"]));
    expect(k).not.toContain("household");
    expect(k).not.toContain("sat_act");
    expect(k).not.toContain("colleges_attended");
    expect(k).not.toContain("degrees");
  });
  it("transfer applicants get the transfer section; master's get theirs and no family/high-school grades", () => {
    expect(keys(visibleSections(["CA", "UC"], "transfer"))).toEqual(expect.arrayContaining(["colleges_attended", "college_courses", "transfer_reason", "igetc"]));
    const g = keys(visibleSections(["GR"], "graduate"));
    expect(g).toEqual(expect.arrayContaining(["degrees", "programmes", "gre_gmat", "english_test", "recommenders"]));
    expect(g).not.toContain("parents");
    expect(g).not.toContain("transcript");
  });
  it("before systems are chosen, only the basics every system asks for", () => {
    const k = keys(visibleSections([], "first_year"));
    expect(k).toEqual(expect.arrayContaining(["legal_first", "dob", "email", "address", "current_school", "english_test", "recommenders", "intended_major"]));
    expect(k).not.toContain("household");
    expect(k).not.toContain("ucas_choices");
    expect(k).not.toContain("sat_act");
    expect(keys(visibleSections([], "graduate"))).toEqual(expect.arrayContaining(["degrees", "gre_gmat"]));
  });
  it("curriculum-specific fields appear only for that curriculum", () => {
    const none = keys(visibleSections(["BC", "UK"], "first_year"));
    expect(none).not.toContain("bc_pen");
    expect(none).not.toContain("predicted");
    const bc = keys(visibleSections(["BC", "UK"], "first_year", { schools: { curriculum: "BC Dogwood" } }));
    expect(bc).toEqual(expect.arrayContaining(["bc_pen", "bc_grades"]));
    expect(bc).not.toContain("predicted");
    const ib = keys(visibleSections(["BC", "UK"], "first_year", { schools: { curriculum: "IB Diploma" } }));
    expect(ib).toEqual(expect.arrayContaining(["predicted", "ib"]));
    expect(ib).not.toContain("bc_pen");
  });
  it("every section and field has both languages", () => {
    for (const s of SECTIONS) for (const f of s.fields) { expect(f.zh).toBeTruthy(); expect(f.en).toBeTruthy(); }
  });
});

describe("progress and checks", () => {
  it("counts only required, collected fields", () => {
    const secs = visibleSections(["CA"], "first_year");
    const empty = progress(secs, {});
    expect(empty.done).toBe(0);
    const filled = progress(secs, { personal: { legal_first: "Xiaoming", legal_middle: "X", pronouns: "she" } });
    expect(filled.done).toBe(1); // middle name is optional, pronouns aren't collected
  });
  it("repeat and address fields need real content", () => {
    const parents = SECTIONS.find((s) => s.key === "family")!.fields.find((f) => f.key === "parents")!;
    expect(isFilled(parents, [{}])).toBe(false);
    expect(isFilled(parents, [{ name: "Wang" }])).toBe(true);
    const addr = SECTIONS.find((s) => s.key === "contact")!.fields.find((f) => f.key === "address")!;
    expect(isFilled(addr, { line1: "1 Main St" })).toBe(false);
    expect(isFilled(addr, { line1: "1 Main St", city: "Vancouver", country: "Canada" })).toBe(true);
  });
  it("flags bad emails, phones, links and numbers", () => {
    expect(problem("email", "a@b", "zh")).toBeTruthy();
    expect(problem("email", "a@b.co", "zh")).toBeNull();
    expect(problem("phone", "604-555", "en")).toBeTruthy();
    expect(problem("phone", "+1 604 555 0123", "en")).toBeNull();
    expect(problem("url", "example.com", "en")).toBeTruthy();
    expect(problem("number", "3.5", "en")).toBeNull();
  });
});

describe("prefill and export", () => {
  it("starts from sign-up details, skipping placeholder emails", () => {
    const p = prefill({ english_name: "Amy", email: "amy@student.dreamplaneredu.com", school: "Byng", interested_majors: "Economics,Undecided", applicant_type: "graduate" });
    expect(p.applicant_type).toBe("graduate");
    expect(p.systems).toEqual(["GR"]);
    expect(prefill({ status: "Transfer Student" }).applicant_type).toBe("transfer");
    expect(prefill({ grade: "11" })).toMatchObject({ applicant_type: "first_year", systems: [] });
    // majors come back from the database as a list
    expect(prefill({ interested_majors: ["Economics", "Undecided", "Computer Science"] }).data.choices.intended_major).toBe("Economics; Computer Science");
    expect(prefill({ interested_majors: null }).data.choices).toBeUndefined();
    expect(p.data.personal.preferred_name).toBe("Amy");
    expect(p.data.contact).toBeUndefined();
    expect(p.data.choices.intended_major).toBe("Economics");
  });
  it("exports only what the system needs, never uncollected fields, plus activities", () => {
    const answers = {
      personal: { legal_first: "Xiaoming", legal_last: "Wang", name_chinese: "王小明", pronouns: "he" },
      contact: { address: { line1: "1 Main St", city: "Vancouver", region: "BC", postal: "V6H", country: "Canada" } },
      family: { parents: [{ relationship: "Mother", name: "Li Hua", occupation: "" }, {}] },
    };
    const acts = [{ id: "1", name: "机器人社", name_en: "Robotics", role: "Captain", organization: null, description: "带队", description_en: "Led team", category: "activity", status: "ongoing", start_date: "2025-09-01", end_date: null, hours_per_week: 5, weeks_per_year: 30, timing: null, level: null, grade_levels: ["11"], continue_in_college: null, sort_order: 1, created_at: "2026-01-01" },
      { id: "2", name: "计划", category: "activity", status: "planned", sort_order: 2, created_at: "2026-01-02" }] as never;
    const e = buildExport("CA", "first_year", answers, acts);
    expect(e.sections["Personal details"]).toEqual({ "Legal first/given name": "Xiaoming", "Legal last/family name": "Wang" });
    expect(e.sections["Contact and address"]["Permanent home address"]).toBe("1 Main St, Vancouver, BC, V6H, Canada");
    expect(e.sections["Family"]["Parents / guardians"]).toEqual([{ Relationship: "Mother", Name: "Li Hua" }]);
    expect(e.activities).toHaveLength(1);
    const t = exportAsText(e);
    expect(t).toContain("1. Robotics · Captain");
    expect(t).not.toContain("王小明"); // Chinese name isn't a Common App field
  });
});
