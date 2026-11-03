import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const GRADES = ["G9", "G10", "G11", "G12"] as const;
const QUARTERS_PER_GRADE = 4;

// Illustrative position on the rail: G11, second quarter.
const CURRENT = { grade: 2, quarter: 1 };

const MILESTONES: Record<(typeof GRADES)[number], string> = {
  G9: "适应高中，探索兴趣",
  G10: "确定方向，开始积累",
  G11: "深化项目，备考标化",
  G12: "定校选校，提交申请",
};

function PlanningRail() {
  const totalSlots = GRADES.length * QUARTERS_PER_GRADE;
  const currentIndex = CURRENT.grade * QUARTERS_PER_GRADE + CURRENT.quarter;
  const progress = (currentIndex + 0.5) / totalSlots;

  return (
    <figure
      className="rounded-md border border-border bg-card p-5 sm:p-7"
      aria-label="四年升学规划示意：从九年级到十二年级，每年分四个季度，目前位于十一年级第二季度"
    >
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="font-serif text-lg font-semibold text-pine">四年规划轨道</span>
        <span className="text-sm text-muted-foreground">每年 4 个季度</span>
      </figcaption>

      <div className="mt-6">
        {/* Rail: one segment per quarter, grouped by grade */}
        <div className="relative">
          <div className="grid grid-cols-4 gap-2" aria-hidden="true">
            {GRADES.map((grade, g) => (
              <div key={grade} className="grid grid-cols-4 gap-1">
                {Array.from({ length: QUARTERS_PER_GRADE }).map((_, q) => {
                  const index = g * QUARTERS_PER_GRADE + q;
                  const isCurrent = index === currentIndex;
                  return (
                    <span
                      key={q}
                      className={
                        "h-2 rounded-full " +
                        (isCurrent ? "bg-brass" : index < currentIndex ? "bg-primary/25" : "bg-muted")
                      }
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div
            className="rail-progress pointer-events-none absolute left-0 top-0 h-2 rounded-full bg-primary"
            style={{ width: `calc(${progress * 100}% - 0.25rem)` }}
            aria-hidden="true"
          />
        </div>

        <ol className="mt-4 grid grid-cols-4 gap-2">
          {GRADES.map((grade, g) => (
            <li key={grade}>
              <div
                className={
                  "font-serif text-base font-semibold sm:text-lg " +
                  (g === CURRENT.grade ? "text-pine" : "text-muted-foreground")
                }
              >
                {grade}
              </div>
              <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{MILESTONES[grade]}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="flex items-center gap-2 text-sm font-medium text-pine">
          <span className="inline-block h-2 w-2 rounded-full bg-brass" aria-hidden="true" />
          当前季度：G11 第二季度
        </p>
        <ul className="mt-3 space-y-2 text-sm text-foreground/80">
          <li>完成研究课题的初稿，与指导老师确认方向</li>
          <li>AP 微积分、AP 物理备考进度过半</li>
          <li>列出 12 所初选学校，标出冲刺、匹配与保底</li>
        </ul>
      </div>
    </figure>
  );
}

export default function Hero() {
  return (
    <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div className="max-w-xl">
        <h1 className="font-serif text-4xl font-bold leading-[1.2] text-pine [text-wrap:balance] sm:text-5xl sm:leading-[1.15]">
          把四年升学路，拆成每个季度能做完的事
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          学生和顾问在同一个地方记录课程、活动和标化成绩，按季度制定计划、跟进待办，申请季不再手忙脚乱。
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="text-base">
            <Link to="/signup">免费注册</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base">
            <Link to="/about">了解平台</Link>
          </Button>
        </div>
      </div>

      <PlanningRail />
    </section>
  );
}
