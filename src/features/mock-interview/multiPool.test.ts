import { describe, expect, it } from "vitest";
import { blueprintAvailable, drawFromBlueprint, sectionPools, withPools, type BankQuestion, type InterviewBank } from "./types";

const q = (pool: string, n: number): BankQuestion[] =>
  Array.from({ length: n }, (_, i) => ({ id: `${pool}${i}`, bank_id: pool, title: `${pool} question ${i}`, description: null, question_type: "video", preparation_time: null, response_time: null, sort_order: i }));
const pools = { A: q("A", 3), B: q("B", 3), C: q("C", 1) };
const school = (blueprint: InterviewBank["blueprint"]) => ({ id: "s", kind: "school", title: "UBC", description: null, school: "UBC", program: null, preparation_time: 30, response_time: 60, is_active: true, blueprint, sim_shuffle: false, sim_retakes: 0, created_at: "" }) as InterviewBank;

describe("parts drawing from several pools", () => {
  it("keeps old single-pool parts working", () => {
    expect(sectionPools({ pool_id: "A", count: 1, question_type: null, prep: 30, response: 60 })).toEqual(["A"]);
  });
  it("draws from all chosen pools over many runs", () => {
    const sec = withPools({ pool_id: "A", count: 1, question_type: null, prep: 30, response: 60 }, ["A", "B"]);
    expect(sec.pool_id).toBe("A");
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) seen.add(drawFromBlueprint(school([sec]), pools)[0].key[5]);
    expect([...seen].sort()).toEqual(["A", "B"]);
  });
  it("never repeats a question across parts sharing pools, and counts what is available", () => {
    const s1 = withPools({ pool_id: "A", count: 2, question_type: null, prep: 30, response: 60 }, ["A", "C"]);
    const s2 = withPools({ pool_id: "C", count: 2, question_type: null, prep: 30, response: 60 }, ["C", "A"]);
    const out = drawFromBlueprint(school([s1, s2]), pools);
    expect(new Set(out.map((o) => o.key)).size).toBe(out.length);
    expect(out.length).toBe(4);
    expect(blueprintAvailable(school([s1, s2, { pool_id: "C", count: 1, question_type: null, prep: 30, response: 60 }]), pools)).toBe(4);
  });
  it("single pool again drops pool_ids", () => {
    expect(withPools({ pool_id: "A", pool_ids: ["A", "B"], count: 1, question_type: null, prep: 30, response: 60 }, ["B"])).toEqual({ pool_id: "B", count: 1, question_type: null, prep: 30, response: 60 });
  });
});
