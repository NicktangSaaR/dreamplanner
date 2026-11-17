import { describe, expect, it } from "vitest";
import { emailLang, inOrder, subjectFor } from "../../../supabase/functions/_shared/emailLang";
import { studentEmail, counselorEmail } from "../../../supabase/functions/test-todo-reminders/email-templates";
import { transcriptEmail } from "../../../supabase/functions/_shared/transcriptEmail";

const todos = [{ title: "写文书", title_zh: "写文书", title_en: "Write essay", title_source: "写文书", due_date: "2026-12-01" }];

describe("email language", () => {
  it("defaults to both, English first", () => {
    expect(emailLang(null)).toBe("both");
    expect(emailLang("en")).toBe("en");
    expect(inOrder("both", "zh", "en")).toEqual(["en", "zh"]);
    expect(subjectFor("both", "待办提醒", "To-do reminder")).toBe("To-do reminder · 待办提醒");
  });

  it("student reminder: English only has no Chinese", () => {
    const { subject, html } = studentEmail(todos, "Ada", "en");
    expect(subject).toBe("To-do reminder: Ada");
    expect(html).toContain("Write essay");
    expect(html).not.toMatch(/[一-鿿]/);
  });

  it("student reminder: both puts English before Chinese", () => {
    const { html } = studentEmail(todos, "Ada");
    expect(html.indexOf("To-do reminder")).toBeLessThan(html.indexOf("待办提醒"));
  });

  it("counselor reminder: Chinese only", () => {
    const { subject, html } = counselorEmail(todos, "Ada", "Jamma", [], "zh");
    expect(subject).toBe("待办提醒: Ada");
    expect(html).not.toContain("To-do reminder");
  });

  it("report-card request in English", () => {
    const { subject, html } = transcriptEmail({ studentId: "x", name: "Ada", due: "2026-12-01", lang: "en" });
    expect(subject).toBe("Please upload your report card by 2026-12-01");
    expect(html).not.toMatch(/[一-鿿]/);
  });
});
