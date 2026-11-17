import { Lock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from "@/i18n/LanguageProvider";

/** Shown when a student whose mock interview is turned off clicks the (greyed) button. */
export default function InterviewLockedDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { lang } = useLanguage();
  const Z = (zh: string, en: string) => (lang === "zh" ? zh : en);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            {Z("模拟面试暂未开通", "Mock interview isn't available")}
          </AlertDialogTitle>
          <AlertDialogDescription>{Z("请联系你的顾问。", "Please contact your counselor.")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>{Z("知道了", "OK")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
