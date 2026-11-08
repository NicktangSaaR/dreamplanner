import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/i18n/LanguageProvider";
import { parsePastedQuestions } from "./types";
import {
  ACCEPTED_QUESTION_FILES, dedupeTitles, downloadQuestionTemplate, readQuestionFile, type QuestionMeta,
} from "./importQuestions";

/** State for a batch of questions typed, pasted or loaded from a file. */
export function useBulkQuestions(existingTitles: string[]) {
  const [text, setText] = useState("");
  const [meta, setMeta] = useState<Record<string, QuestionMeta>>({});
  const parsed = useMemo(() => parsePastedQuestions(text), [text]);
  const { fresh, skipped } = useMemo(() => dedupeTitles(parsed, existingTitles), [parsed, existingTitles]);

  const appendFile = (titles: string[], fileMeta: Record<string, QuestionMeta>) => {
    setText((prev) => [prev.trim(), ...titles].filter(Boolean).join("\n"));
    setMeta((prev) => ({ ...prev, ...fileMeta }));
  };
  const reset = () => {
    setText("");
    setMeta({});
  };
  return { text, setText, meta, fresh, skipped, appendFile, reset };
}

export type BulkQuestions = ReturnType<typeof useBulkQuestions>;

export default function BulkQuestionInput({
  bulk, placeholder, rows = 5, id,
}: {
  bulk: BulkQuestions;
  placeholder?: string;
  rows?: number;
  id?: string;
}) {
  const { t, lang } = useLanguage();
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setReading(true);
    try {
      const { titles, meta } = await readQuestionFile(file);
      if (!titles.length) {
        toast.error(t("mi3.fileEmpty"));
        return;
      }
      bulk.appendFile(titles, meta);
      toast.success(t("mi3.fileLoaded", { n: titles.length, name: file.name }));
    } catch (e) {
      toast.error(e instanceof Error && e.message === "UNSUPPORTED" ? t("mi3.fileUnsupported") : t("mi3.fileFailed"));
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const withMeta = bulk.fresh.filter((q) => bulk.meta[q]).length;

  return (
    <div className="space-y-2">
      <Textarea id={id} rows={rows} value={bulk.text} onChange={(e) => bulk.setText(e.target.value)} placeholder={placeholder} />
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <input ref={fileRef} type="file" accept={ACCEPTED_QUESTION_FILES} className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={reading}>
          {reading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileUp className="mr-1.5 h-4 w-4" />}
          {t("mi3.fromFile")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => downloadQuestionTemplate(lang === "zh" ? "zh" : "en")}>
          <Download className="mr-1.5 h-4 w-4" />
          {t("mi3.template")}
        </Button>
        <span className="text-muted-foreground">{t("mi3.fileTypes")}</span>
      </div>
      {(bulk.fresh.length > 0 || bulk.skipped > 0) && (
        <p className="text-xs text-muted-foreground">
          {t("mi3.willAdd", { n: bulk.fresh.length })}
          {bulk.skipped > 0 && ` · ${t("mi3.skipped", { n: bulk.skipped })}`}
          {withMeta > 0 && ` · ${t("mi3.withMeta", { n: withMeta })}`}
        </p>
      )}
    </div>
  );
}
