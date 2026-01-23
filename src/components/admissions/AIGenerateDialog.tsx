import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Wand2, Loader2, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { NewCaseForm } from "./types";

interface AIGenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (data: Partial<NewCaseForm>) => void;
}

const examplePrompts = [
  "理工科学霸，竞赛获奖，MIT录取",
  "艺术特长生，创意设计，RISD录取",
  "社科方向，社会公益，哈佛录取",
  "商科精英，创业经历，沃顿录取",
];

export default function AIGenerateDialog({ open, onOpenChange, onGenerated }: AIGenerateDialogProps) {
  const [keywords, setKeywords] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      toast.error("请输入关键词");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-admission-case", {
        body: { keywords, type: "generate" },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        onGenerated({
          profile_style: data.data.profile_style || "",
          academic_background: data.data.academic_background || "",
          activities: data.data.activities || [""],
          courses: data.data.courses || [""],
        });
        toast.success("AI生成成功！");
        setKeywords("");
        onOpenChange(false);
      } else {
        throw new Error(data?.error || "生成失败");
      }
    } catch (error: any) {
      console.error("AI generation error:", error);
      toast.error(error.message || "AI生成失败，请重试");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI智能生成案例
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>输入关键词</Label>
            <Textarea
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="例如：理工科背景、竞赛获奖、MIT录取、热爱编程..."
              rows={4}
              disabled={generating}
            />
            <p className="text-xs text-muted-foreground">
              输入学生特点、目标学校、专业方向等关键词，AI将自动生成完整的学生画像和背景描述
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">快速示例</Label>
            <div className="flex flex-wrap gap-2">
              {examplePrompts.map((prompt, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setKeywords(prompt)}
                  disabled={generating}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            取消
          </Button>
          <Button onClick={handleGenerate} disabled={generating || !keywords.trim()}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                生成案例
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
