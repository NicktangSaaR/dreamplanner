import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  reminder_emails: string[];
  reminder_sent: boolean;
}

interface EditMilestoneDialogProps {
  milestone: Milestone | null;
  studentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export default function EditMilestoneDialog({
  milestone,
  studentId,
  open,
  onOpenChange,
  onSave,
}: EditMilestoneDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title);
      setDescription(milestone.description || "");
      setDueDate(new Date(milestone.due_date));
    }
  }, [milestone]);

  const handleSave = async () => {
    if (!milestone || !title.trim() || !dueDate) {
      toast.error("请填写标题和日期");
      return;
    }

    setIsSaving(true);
    try {
      const formattedDate = format(dueDate, "yyyy-MM-dd");
      
      // Update milestone
      const { error: milestoneError } = await supabase
        .from("planning_milestones")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          due_date: formattedDate,
        })
        .eq("id", milestone.id);

      if (milestoneError) throw milestoneError;

      // Also update the corresponding todo (with 📌 prefix)
      const todoTitle = `📌 ${title.trim()}`;
      const { error: todoError } = await supabase
        .from("todos")
        .update({
          title: todoTitle,
          due_date: formattedDate,
        })
        .eq("author_id", studentId)
        .like("title", `📌 ${milestone.title}`);

      if (todoError) {
        console.warn("Failed to update corresponding todo:", todoError);
      }

      toast.success("节点已更新");
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update milestone:", error);
      toast.error("更新失败，请重试");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!milestone) return;

    setIsDeleting(true);
    try {
      // Delete milestone
      const { error: milestoneError } = await supabase
        .from("planning_milestones")
        .delete()
        .eq("id", milestone.id);

      if (milestoneError) throw milestoneError;

      // Also delete the corresponding todo
      const { error: todoError } = await supabase
        .from("todos")
        .delete()
        .eq("author_id", studentId)
        .like("title", `📌 ${milestone.title}`);

      if (todoError) {
        console.warn("Failed to delete corresponding todo:", todoError);
      }

      toast.success("节点已删除");
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete milestone:", error);
      toast.error("删除失败，请重试");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑规划节点</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入节点标题"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入节点描述（可选）"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>截止日期 *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "yyyy年M月d日", { locale: zhCN }) : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  locale={zhCN}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || isSaving}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            删除
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isDeleting}>
              {isSaving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              保存
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
