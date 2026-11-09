import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Copy, Download, FileText, Loader2, Pencil, Save, Sparkles } from "lucide-react";
import { MD } from "@/components/engines/markdownStyles";
import { downloadResumeDocx } from "@/components/engines/reportExport";
import { downloadOriginal } from "./resumeApi";

/** The AI-polished resume: preview, light edits, Word download. */
export default function OptimizedResume({
  markdown, busy, onOptimize, onSave, fileName, originalPath,
}: {
  markdown: string;
  busy: boolean;
  onOptimize: (language: "en" | "zh") => void;
  onSave: (markdown: string) => Promise<void>;
  fileName: string;
  originalPath: string | null;
}) {
  const [language, setLanguage] = useState<"en" | "zh">("en");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(markdown);
  const [copied, setCopied] = useState(false);
  useEffect(() => setDraft(markdown), [markdown]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" />优化后的简历</CardTitle>
            <CardDescription>根据上面的信息由 AI 润色排版，不会编造经历或数字。修改上面的信息后可以重新优化。</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "zh")}>
              <SelectTrigger className="h-9 w-[7.5rem]" aria-label="简历语言"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">英文简历</SelectItem>
                <SelectItem value="zh">中文简历</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => onOptimize(language)} disabled={busy}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              {markdown ? "重新优化" : "生成优化简历"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {busy && !markdown ? (
          <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />正在优化简历…</p>
        ) : !markdown ? (
          <p className="py-6 text-sm text-muted-foreground">还没有优化版。填好信息后点「生成优化简历」。</p>
        ) : editing ? (
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="h-[420px] font-mono text-sm" aria-label="编辑简历" />
        ) : (
          <div className="max-h-[520px] space-y-1.5 overflow-y-auto rounded-md border bg-background p-5 text-sm leading-relaxed">
            <ReactMarkdown components={MD}>{markdown}</ReactMarkdown>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          {markdown && (editing ? (
            <>
              <Button size="sm" onClick={async () => { await onSave(draft); setEditing(false); }}><Save className="mr-1.5 h-4 w-4" />保存修改</Button>
              <Button size="sm" variant="ghost" onClick={() => { setDraft(markdown); setEditing(false); }}>取消</Button>
            </>
          ) : (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}><Pencil className="mr-1.5 h-4 w-4" />编辑</Button>
              <Button size="sm" variant="outline" onClick={() => void downloadResumeDocx(fileName, markdown).catch(() => toast.error("下载失败"))}>
                <Download className="mr-1.5 h-4 w-4" />下载 Word
              </Button>
              <Button size="sm" variant="outline" onClick={async () => { await navigator.clipboard.writeText(markdown); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}{copied ? "已复制" : "复制文字"}
              </Button>
            </>
          ))}
          {originalPath && !editing && (
            <Button size="sm" variant="ghost" onClick={() => void downloadOriginal(originalPath).catch(() => toast.error("下载失败"))}>
              <FileText className="mr-1.5 h-4 w-4" />原始简历文件
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
