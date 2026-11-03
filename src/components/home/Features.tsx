import { ClipboardList, MessagesSquare, FileText, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import type { MessageKey } from "@/i18n/translations";

interface Feature {
  id: "profile" | "counselor" | "reports" | "interview";
  icon: LucideIcon;
}

const FEATURES: Feature[] = [
  { id: "profile", icon: ClipboardList },
  { id: "counselor", icon: MessagesSquare },
  { id: "reports", icon: FileText },
  { id: "interview", icon: Video },
];

export default function Features() {
  const { t } = useLanguage();
  return (
    <section className="mt-28" aria-labelledby="features-heading">
      <h2 id="features-heading" className="font-serif text-2xl font-semibold text-pine sm:text-3xl">
        {t("features.heading")}
      </h2>
      <div className="mt-10 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ id, icon: Icon }) => (
          <div key={id} className="border-t-2 border-primary pt-5">
            <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
            <h3 className="mt-4 text-lg font-semibold text-pine">{t(`features.${id}.title` as MessageKey)}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{t(`features.${id}.body` as MessageKey)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
