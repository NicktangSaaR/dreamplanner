import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Send, Eye, FileText, Calendar, Mail, Copy, Link } from "lucide-react";
import { format } from "date-fns";
import { ResumeRequest } from "./types";
import ResumePreviewDialog from "./ResumePreviewDialog";

export default function ResumeManagement() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewRequest, setPreviewRequest] = useState<ResumeRequest | null>(null);
  const queryClient = useQueryClient();

  // Fetch all students
  const { data: students = [] } = useQuery({
    queryKey: ["students-for-resume"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("user_type", "student")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch resume requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["resume-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resume_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      
      // Fetch student info for each request
      const studentIds = [...new Set(data.map(r => r.student_id))];
      const { data: studentData } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", studentIds);
      
      const studentMap = new Map(studentData?.map(s => [s.id, s]) || []);
      
      return data.map(r => ({
        ...r,
        student: studentMap.get(r.student_id),
      })) as (ResumeRequest & { public_token?: string })[];
    },
  });

  // Send resume request mutation
  const sendRequestMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("未登录");
      
      const { error } = await supabase
        .from("resume_requests")
        .insert({
          student_id: selectedStudentId,
          admin_id: userData.user.id,
          message: message || null,
          due_date: dueDate || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("简历信息表请求已发送");
      queryClient.invalidateQueries({ queryKey: ["resume-requests"] });
      setSelectedStudentId("");
      setMessage("");
      setDueDate("");
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("发送请求失败: " + error.message);
    },
  });

  // Send email notification mutation
  const sendEmailMutation = useMutation({
    mutationFn: async (request: ResumeRequest & { public_token?: string }) => {
      // Get the form URL with the public token
      const formUrl = `${window.location.origin}/resume-form?token=${request.public_token}`;
      
      const { data, error } = await supabase.functions.invoke("send-invitation", {
        body: {
          email: request.student?.email,
          subject: "请填写简历信息表 - DreamPlanner",
          content: `您好 ${request.student?.full_name}，\n\n请点击以下链接填写您的简历信息表：\n\n${formUrl}\n\n该链接无需登录即可填写。${request.message ? `\n\n备注：${request.message}` : ""}${request.due_date ? `\n\n截止日期：${format(new Date(request.due_date), "yyyy年MM月dd日")}` : ""}\n\n如有问题，请联系您的顾问。\n\n祝好，\nDreamPlanner团队`,
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("邮件通知已发送");
    },
    onError: () => {
      toast.error("发送邮件失败");
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { label: "待填写", variant: "secondary" },
      submitted: { label: "已提交", variant: "outline" },
      generated: { label: "已生成", variant: "default" },
      completed: { label: "已完成", variant: "default" },
    };
    const config = statusConfig[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            简历生成管理
          </CardTitle>
          <CardDescription>
            向学生推送简历信息收集表，收集完成后使用AI生成专业简历
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="mr-2 h-4 w-4" />
                发送新请求
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>发送简历信息收集请求</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">选择学生</label>
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择一个学生" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} ({student.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">截止日期（可选）</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">备注信息（可选）</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="添加给学生的备注信息..."
                    rows={3}
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={() => sendRequestMutation.mutate()}
                  disabled={!selectedStudentId || sendRequestMutation.isPending}
                >
                  {sendRequestMutation.isPending ? "发送中..." : "发送请求"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>请求列表</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">暂无请求记录</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>截止日期</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.student?.full_name || "未知"}</div>
                        <div className="text-sm text-muted-foreground">{request.student?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {request.due_date ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(request.due_date), "yyyy-MM-dd")}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{format(new Date(request.created_at), "yyyy-MM-dd HH:mm")}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const formUrl = `${window.location.origin}/resume-form?token=${(request as any).public_token}`;
                            navigator.clipboard.writeText(formUrl);
                            toast.success("链接已复制到剪贴板");
                          }}
                          title="复制表单链接"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendEmailMutation.mutate(request as any)}
                          disabled={sendEmailMutation.isPending}
                          title="发送邮件通知"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        {(request.status === 'submitted' || request.status === 'generated' || request.status === 'completed') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewRequest(request)}
                            title="查看提交内容"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {previewRequest && (
        <ResumePreviewDialog
          request={previewRequest}
          open={!!previewRequest}
          onOpenChange={(open) => !open && setPreviewRequest(null)}
        />
      )}
    </div>
  );
}
