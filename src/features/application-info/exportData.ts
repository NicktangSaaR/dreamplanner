// Everything one application system needs, in English labels, for copying
// into the form by hand or handing to the AI form filler.
import type { Activity } from "../activities/model";
import { byOrder, CATEGORIES, LEVELS, period, STATUSES, TIMINGS } from "../activities/model";
import { type Address, type Answers, type Applicant, isFilled, type System, SYSTEMS, visibleSections } from "./fields";

type Row = Record<string, unknown>;

const addressText = (a: Address) => [a.line1, a.line2, a.city, a.region, a.postal, a.country].filter((x) => String(x ?? "").trim()).join(", ");

export function activityRows(list: Activity[]) {
  return [...list].sort(byOrder).map((a) => ({
    name: a.name_en || a.name, position: a.role || "", organization: a.organization || "",
    type: CATEGORIES[a.category].en, status: STATUSES[a.status].en, period: period(a, "en"),
    hours_per_week: a.hours_per_week ?? "", weeks_per_year: a.weeks_per_year ?? "",
    timing: a.timing ? TIMINGS[a.timing].en : "", level: a.level ? LEVELS[a.level].en : "",
    grades: (a.grade_levels ?? []).join(", "), description: a.description_en || a.description || "",
    continue_in_college: a.continue_in_college == null ? "" : a.continue_in_college ? "Yes" : "No",
  }));
}

/** { system, applicant, sections: { "Personal details": { "Legal first/given name": "…", … } }, activities } */
export function buildExport(system: System, who: Applicant, answers: Answers, activities: Activity[]) {
  const out: Record<string, Row> = {};
  for (const s of visibleSections([system], who, answers)) {
    const block: Row = {};
    for (const fl of s.fields) {
      if (fl.level === "skip" || fl.kind === "external") continue;
      const v = answers[s.key]?.[fl.key];
      if (!isFilled(fl, v)) continue;
      if (fl.kind === "address") block[fl.en] = addressText(v as Address);
      else if (fl.kind === "repeat") {
        const subs = fl.subs ?? [];
        block[fl.en] = (v as Row[])
          .filter((row) => Object.values(row ?? {}).some((x) => String(x ?? "").trim()))
          .map((row) => Object.fromEntries(subs.filter((sb) => String(row[sb.key] ?? "").trim()).map((sb) => [sb.en, row[sb.key]])));
      } else block[fl.en] = v;
    }
    if (Object.keys(block).length) out[s.en] = block;
  }
  const name = SYSTEMS.find((x) => x.key === system)?.en ?? system;
  return { system: name, applicant: who, sections: out, activities: activityRows(activities.filter((a) => a.status !== "planned")) };
}

/** The same, as readable text. */
export function exportAsText(e: ReturnType<typeof buildExport>) {
  const lines: string[] = [`${e.system} — ${e.applicant}`, ""];
  for (const [section, block] of Object.entries(e.sections)) {
    lines.push(`## ${section}`);
    for (const [label, v] of Object.entries(block)) {
      if (Array.isArray(v)) {
        lines.push(`${label}:`);
        v.forEach((row, i) => lines.push(`  ${i + 1}. ${Object.entries(row as Row).map(([k, x]) => `${k}: ${x}`).join(" · ")}`));
      } else lines.push(`${label}: ${v}`);
    }
    lines.push("");
  }
  if (e.activities.length) {
    lines.push("## Activities");
    e.activities.forEach((a, i) => {
      lines.push(`  ${i + 1}. ${[a.name, a.position, a.organization].filter(Boolean).join(" · ")}`);
      lines.push(`     ${[a.type, a.period, a.hours_per_week !== "" ? `${a.hours_per_week} hr/wk` : "", a.weeks_per_year !== "" ? `${a.weeks_per_year} wk/yr` : "", a.grades && `Grades ${a.grades}`].filter(Boolean).join(" · ")}`);
      if (a.description) lines.push(`     ${a.description}`);
    });
  }
  return lines.join("\n");
}
