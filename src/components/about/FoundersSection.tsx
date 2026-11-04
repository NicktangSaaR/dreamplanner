import { GraduationCap } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";

interface Founder {
  name: string;
  photo: string;
  role: MessageKey;
  credentials: MessageKey[];
  paragraphs: { label?: MessageKey; body: MessageKey }[];
}

const FOUNDERS: Founder[] = [
  {
    name: "Nick Tang",
    photo: "/team/nick-tang.jpg",
    role: "founders.nick.role",
    credentials: ["founders.nick.ucla", "founders.nick.bcg", "founders.nick.years"],
    paragraphs: [{ label: "founders.nick.approachLabel", body: "founders.nick.approach" }],
  },
  {
    name: "Cloris Liu",
    photo: "/team/cloris-liu.jpg",
    role: "founders.cloris.role",
    credentials: ["founders.cloris.mba", "founders.cloris.years", "founders.cloris.bc"],
    paragraphs: [
      { body: "founders.cloris.bio" },
      { body: "founders.cloris.focus" },
      { label: "founders.cloris.aiLabel", body: "founders.cloris.ai" },
    ],
  },
];

export default function FoundersSection() {
  const { t, lang } = useLanguage();

  return (
    <section aria-labelledby="founders-heading">
      <h2 id="founders-heading" className="font-serif text-3xl font-semibold text-pine">
        {t("founders.heading")}
      </h2>
      <p className="mt-3 max-w-2xl text-muted-foreground">{t("founders.intro")}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {FOUNDERS.map((f) => (
          <article key={f.name} className="flex flex-col rounded-md border bg-card p-6">
            <div className="flex items-start gap-5">
              <img
                src={f.photo}
                alt={t("founders.photoAlt", { name: f.name })}
                width={112}
                height={150}
                loading="lazy"
                className="h-[150px] w-[112px] shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0">
                <h3 className="font-serif text-2xl font-semibold text-pine">{f.name}</h3>
                <p className="mt-1 text-sm font-medium text-brass">{t(f.role)}</p>
                <ul className="mt-4 space-y-2">
                  {f.credentials.map((c) => (
                    <li key={c} className="flex gap-2 text-sm leading-snug">
                      <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{t(c)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-5 space-y-3 border-t pt-5 text-sm leading-relaxed text-foreground/85">
              {f.paragraphs.map((p) => (
                <p key={p.body}>
                  {p.label && <span className="font-semibold text-pine">{t(p.label)}{lang === "zh" ? "：" : ": "}</span>}
                  {t(p.body)}
                </p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
