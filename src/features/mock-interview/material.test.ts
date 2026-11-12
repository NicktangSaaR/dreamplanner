import { describe, expect, it } from "vitest";
import { rowsToQuestions } from "./importQuestions";
import { expandFollowUps, materialOf } from "./types";

describe("material questions", () => {
  it("reads material and reading time from a spreadsheet", () => {
    const { titles, meta } = rowsToQuestions([
      ["题目", "回答时间(秒)", "材料", "阅读时间(秒)"],
      ["What does the table suggest?", "300", "Fare £2 → £1, riders 10k → 13k", "2分钟"],
      ["Plain question", "60", "", "90"],
    ]);
    expect(titles).toHaveLength(2);
    expect(meta["What does the table suggest?"]).toMatchObject({ material: "Fare £2 → £1, riders 10k → 13k", readingTime: 120 });
    expect(meta["Plain question"]?.material).toBeUndefined();
  });

  it("does not confuse the material column with the reading-time column (English headers)", () => {
    const { meta } = rowsToQuestions([
      ["Question", "Material (optional)", "Reading time (seconds)"],
      ["Q", "A passage", "90"],
    ]);
    expect(meta.Q).toMatchObject({ material: "A passage", readingTime: 90 });
  });

  it("materialOf defaults reading time and ignores blank material", () => {
    expect(materialOf({ material: "  text ", reading_time: null })).toEqual({ material: "text", readingTime: 120 });
    expect(materialOf({ material: "   ", reading_time: 60 })).toEqual({});
  });

  it("follow-ups keep the material but are not re-read", () => {
    const out = expandFollowUps([
      { id: "a", text: "Main", type: "video", prep: 0, response: 300, material: "M", readingTime: 120, followUpPool: [["F1"]] },
    ] as never, () => 0);
    expect(out[0]).toMatchObject({ material: "M", readingTime: 120 });
    expect(out[1]).toMatchObject({ material: "M", readingTime: 0 });
  });
});
