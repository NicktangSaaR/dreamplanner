import { describe, expect, it } from "vitest";
import { todoTitle } from "./todoTitle";

describe("to-do titles in two languages", () => {
  const t = { title: "完成主文书", title_source: "完成主文书", title_zh: "完成主文书", title_en: "Finish the main essay" };
  it("shows the current language", () => {
    expect(todoTitle(t, "en")).toBe("Finish the main essay");
    expect(todoTitle(t, "zh")).toBe("完成主文书");
  });
  it("shows the title as typed until it's translated", () => {
    expect(todoTitle({ title: "新待办" }, "en")).toBe("新待办");
    expect(todoTitle({ ...t, title: "完成主文书（改）" }, "en")).toBe("完成主文书（改）");
  });
});
