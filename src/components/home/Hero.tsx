import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";

const GRADES = ["G9", "G10", "G11", "G12"] as const;
const QUARTERS_PER_GRADE = 4;

// Illustrative position on the rail: G11, second quarter.
const CURRENT = { grade: 2, quarter: 1 };

function PlanningRail() {
  const { t } = useLanguage();
  const totalSlots = GRADES.length * QUARTERS_PER_GRADE;
  const currentIndex = CURRENT.grade * QUARTERS_PER_GRADE + CURRENT.quarter;
  const progress = (currentIndex + 0.5) / totalSlots;

  return (
    <figure
      className="rounded-md border border-border bg-card p-5 sm:p-7"
      aria-label={t("rail.aria")}
    >
      <figcaption className="flex items-baseline justify-between gap-4">
        <span className="font-serif text-lg font-semibold text-pine">{t("rail.title")}</span>
        <span className="text-sm text-muted-foreground">{t("rail.perYear")}</span>
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
              <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">{t(`rail.${grade}`)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="flex items-center gap-2 text-sm font-medium text-pine">
          <span className="inline-block h-2 w-2 rounded-full bg-brass" aria-hidden="true" />
          {t("rail.current")}
        </p>
        <ul className="mt-3 space-y-2 text-sm text-foreground/80">
          <li>{t("rail.task1")}</li>
          <li>{t("rail.task2")}</li>
          <li>{t("rail.task3")}</li>
        </ul>
      </div>
    </figure>
  );
}

export default function Hero() {
  const { t } = useLanguage();
  return (
    <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
      <div className="max-w-xl">
        <h1 className="font-serif text-4xl font-bold leading-[1.2] text-pine [text-wrap:balance] sm:text-5xl sm:leading-[1.15]">
          {t("hero.title")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          {t("hero.body")}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg" className="text-base">
            <Link to="/signup">{t("hero.signup")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="text-base">
            <Link to="/about">{t("hero.learnMore")}</Link>
          </Button>
        </div>
      </div>

      <PlanningRail />
    </section>
  );
}
