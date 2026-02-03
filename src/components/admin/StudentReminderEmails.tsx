import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Loader2, Mail, User } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ReminderEmail {
  id: string;
  student_id: string;
  email: string;
  name: string | null;
  notes: string | null;
}

interface StudentReminderEmailsProps {
  studentId: string;
  studentName: string;
}

export default function StudentReminderEmails({
  studentId,
  studentName,
}: StudentReminderEmailsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<ReminderEmail | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  // Fetch reminder emails for this student
  const { data: reminderEmails, isLoading } = useQuery({
    queryKey: ["student-reminder-emails", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from("student_reminder_emails")
        .select("*")
        .eq("student_id", studentId)
        .order("name");

      if (error) throw error;
      return data as ReminderEmail[];
    },
    enabled: !!studentId,
  });

  // Add email mutation
  const addEmailMutation = useMutation({
    mutationFn: async (emailData: { name: string; email: string; notes: string }) => {
      const { data, error } = await supabase
        .from("student_reminder_emails")
        .insert({
          student_id: studentId,
          name: emailData.name.trim() || null,
          email: emailData.email.trim(),
          notes: emailData.notes.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-reminder-emails", studentId] });
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("提醒邮箱已添加 / Reminder email added!");
    },
    onError: (error: any) => {
      console.error("Error adding email:", error);
      if (error.code === "23505") {
        toast.error("该邮箱已存在 / This email already exists");
      } else {
        toast.error("添加失败 / Failed to add");
      }
    },
  });

  // Update email mutation
  const updateEmailMutation = useMutation({
    mutationFn: async ({ id, ...emailData }: { id: string; name: string; email: string; notes: string }) => {
      const { data, error } = await supabase
        .from("student_reminder_emails")
        .update({
          name: emailData.name.trim() || null,
          email: emailData.email.trim(),
          notes: emailData.notes.trim() || null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-reminder-emails", studentId] });
      setIsEditDialogOpen(false);
      setSelectedEmail(null);
      resetForm();
      toast.success("提醒邮箱已更新 / Reminder email updated!");
    },
    onError: (error: any) => {
      console.error("Error updating email:", error);
      if (error.code === "23505") {
        toast.error("该邮箱已存在 / This email already exists");
      } else {
        toast.error("更新失败 / Failed to update");
      }
    },
  });

  // Delete email mutation
  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("student_reminder_emails")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-reminder-emails", studentId] });
      toast.success("提醒邮箱已删除 / Reminder email deleted!");
    },
    onError: (error) => {
      console.error("Error deleting email:", error);
      toast.error("删除失败 / Failed to delete");
    },
  });

  const resetForm = () => {
    setName("");
    setEmail("");
    setNotes("");
  };

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("请填写邮箱地址 / Please enter an email address");
      return;
    }
    addEmailMutation.mutate({ name, email, notes });
  };

  const handleEditEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !email.trim()) {
      toast.error("请填写邮箱地址 / Please enter an email address");
      return;
    }
    updateEmailMutation.mutate({
      id: selectedEmail.id,
      name,
      email,
      notes,
    });
  };

  const openEditDialog = (reminderEmail: ReminderEmail) => {
    setSelectedEmail(reminderEmail);
    setName(reminderEmail.name || "");
    setEmail(reminderEmail.email);
    setNotes(reminderEmail.notes || "");
    setIsEditDialogOpen(true);
  };

  if (!studentId) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {studentName} 的提醒邮箱
          </span>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                添加
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加提醒邮箱</DialogTitle>
                <DialogDescription>
                  为 {studentName} 添加自动提醒邮箱，系统将自动发送待办提醒到这些邮箱
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEmail}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="add-name">收件人姓名</Label>
                    <Input
                      id="add-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="如：家长、妈妈、爸爸..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-email">邮箱地址 *</Label>
                    <Input
                      id="add-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="add-notes">备注</Label>
                    <Input
                      id="add-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="可选备注..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      resetForm();
                    }}
                  >
                    取消
                  </Button>
                  <Button type="submit" disabled={addEmailMutation.isPending}>
                    {addEmailMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    保存
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          系统会在每月1日推送40天内待办，每个待办截止前7天自动提醒
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        ) : reminderEmails && reminderEmails.length > 0 ? (
          <ScrollArea className="h-[180px]">
            <div className="space-y-2">
              {reminderEmails.map((re) => (
                <div
                  key={re.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {re.name || "未命名"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {re.email}
                    </p>
                    {re.notes && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {re.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(re)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteEmailMutation.mutate(re.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>暂无提醒邮箱</p>
            <p className="text-sm">添加邮箱后，系统将自动发送待办提醒</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑提醒邮箱</DialogTitle>
              <DialogDescription>
                修改提醒邮箱信息
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditEmail}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">收件人姓名</Label>
                  <Input
                    id="edit-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="如：家长、妈妈、爸爸..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">邮箱地址 *</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">备注</Label>
                  <Input
                    id="edit-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="可选备注..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedEmail(null);
                    resetForm();
                  }}
                >
                  取消
                </Button>
                <Button type="submit" disabled={updateEmailMutation.isPending}>
                  {updateEmailMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  保存
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
