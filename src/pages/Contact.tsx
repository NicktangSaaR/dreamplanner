import { useLanguage } from "@/i18n/LanguageProvider";

export default function Contact() {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-4xl font-bold">{t("contact.title")}</h1>
        <div className="prose prose-lg">
          <p>{t("contact.body")}</p>
          <p className="font-bold text-black">
            {t("contact.email", { email: "" })}
            <a href="mailto:Nickt@nexusadmission.com">Nickt@nexusadmission.com</a>
          </p>
        </div>
      </div>
    </div>
  );
}
