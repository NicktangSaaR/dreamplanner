import { describe, expect, it } from "vitest";
import { blueprintAvailable, drawFromBlueprint, expandFollowUps, type BankQuestion, type InterviewBank } from "./types";
import { rowsToQuestions } from "./importQuestions";

const main = { key: "bank:1", text: "Why do some countries save more?", type: "video" as const, prep: 30, response: 120, followUpPool: [["Rates up?", "Ageing population?"], ["Counterexample?"], []] };

describe("follow-up chains", () => {
  it("puts one random wording per position right after the question", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const out = expandFollowUps([main, { key: "bank:2", text: "Next", type: "video", prep: 30, response: 60 }]);
      expect(out.map((q) => q.key)).toEqual(["bank:1", "bank:1#f1", "bank:1#f2", "bank:2"]);
      expect(out[2].text).toBe("Counterexample?");
      expect(out[1].followUp).toEqual({ of: main.text, n: 1, total: 2 });
      expect(out[1]).toMatchObject({ prep: 30, response: 120 });
      expect("followUpPool" in out[0]).toBe(false);
      seen.add(out[1].text);
    }
    expect([...seen].sort()).toEqual(["Ageing population?", "Rates up?"]);
  });

  it("school draws keep follow-ups attached even when shuffled, and count main questions only", () => {
    const qs: BankQuestion[] = [1, 2, 3].map((n) => ({ id: String(n), bank_id: "P", title: `Q${n}`, description: null, question_type: "video", preparation_time: null, response_time: null, sort_order: n, follow_ups: n === 2 ? [["F a", "F b"]] : [] }));
    const school = { id: "s", kind: "school", title: "Oxford PPE", description: null, school: "Oxford", program: "PPE", preparation_time: 30, response_time: 60, is_active: true, sim_shuffle: true, sim_retakes: 0, created_at: "",
      blueprint: [{ pool_id: "P", count: 3, question_type: null, prep: 30, response: 180, combined: true }] } as InterviewBank;
    for (let i = 0; i < 30; i++) {
      const out = drawFromBlueprint(school, { P: qs });
      expect(out.length).toBe(4);
      const at = out.findIndex((q) => q.key === "bank:2");
      expect(out[at + 1].key).toBe("bank:2#f1");
      expect(out[at + 1].combined).toBe(true);
    }
    expect(blueprintAvailable(school, { P: qs })).toBe(3);
  });

  it("reads 追问 columns from a spreadsheet", () => {
    const { titles, meta } = rowsToQuestions([
      ["题目", "题型", "追问1（多种问法用 | 分隔）", "追问2"],
      ["Why save?", "视频", "Rates up? | Ageing?", "Counterexample?"],
      ["Plain", "视频", "", ""],
    ]);
    expect(titles).toEqual(["Why save?", "Plain"]);
    expect(meta["Why save?"].followUps).toEqual([["Rates up?", "Ageing?"], ["Counterexample?"]]);
    expect(meta["Plain"]?.followUps).toBeUndefined();
  });
});
