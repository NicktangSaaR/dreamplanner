import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "./LanguageProvider";

export default function LanguageToggle({ className }: { className?: string }) {
  const { t, toggle } = useLanguage();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label={t("lang.switchLabel")}
      className={cn("gap-1.5 text-muted-foreground hover:text-primary", className)}
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      {t("lang.switchTo")}
    </Button>
  );
}
