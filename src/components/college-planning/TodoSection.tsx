
import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Bell } from "lucide-react";
import TodoForm from "./todos/TodoForm";
import BulkImportForm from "./todos/BulkImportForm";
import TodoList from "./todos/TodoList";
import { useStudentTodos } from "@/hooks/todos/useStudentTodos";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function TodoSection() {
  const { studentId } = useParams();
  const { profile } = useProfile();
  const {
    todos,
    createTodo,
    toggleTodoStatus,
    toggleStarred,
    updateTodo,
    deleteTodo,
  } = useStudentTodos(studentId);

  console.log("TodoSection - Current user type:", profile?.user_type);
  console.log("TodoSection - Student ID from params:", studentId);
  console.log("TodoSection - Filtered todos:", todos);

  const handleCreateTodo = useCallback(async (title: string) => {
    if (!studentId) {
      console.error("No student ID provided");
      return;
    }
    console.log("Creating todo for student:", studentId);
    await createTodo.mutateAsync({
      title,
      authorId: studentId // Use the student's ID as the author
    });
  }, [createTodo, studentId]);

  const handleBulkImport = useCallback(async (titles: string[]) => {
    if (!studentId) {
      console.error("No student ID provided");
      return;
    }
    console.log("Bulk importing todos for student:", studentId);
    for (const title of titles) {
      if (title.trim()) {
        await createTodo.mutateAsync({
          title: title.trim(),
          authorId: studentId // Use the student's ID as the author
        });
      }
    }
  }, [createTodo, studentId]);

  const handleToggleStatus = useCallback(async (id: string, completed: boolean) => {
    console.log("Toggling todo status:", { id, completed });
    await toggleTodoStatus.mutateAsync({ id, completed });
  }, [toggleTodoStatus]);

  const handleToggleStarred = useCallback(async (id: string, starred: boolean) => {
    console.log("Toggling todo starred:", { id, starred });
    await toggleStarred.mutateAsync({ id, starred });
  }, [toggleStarred]);

  const handleUpdateTodo = useCallback(async (id: string, title: string) => {
    console.log("Updating todo:", { id, title });
    await updateTodo.mutateAsync({ id, title });
  }, [updateTodo]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    console.log("Deleting todo:", id);
    await deleteTodo.mutateAsync(id);
  }, [deleteTodo]);

  const handleSendReminder = useCallback(async () => {
    if (!studentId) {
      console.error("No student ID provided");
      toast.error("无法发送提醒：未找到学生ID");
      return;
    }
    
    try {
      const toastId = toast.loading("发送提醒中...");
      
      console.log("Invoking Edge Function with studentId:", studentId);
      
      // 调用Edge Function，明确指定domain
      const { data, error } = await supabase.functions.invoke('test-todo-reminders', {
        body: { 
          studentId, 
          debug: true,
          domain: "dreamplaneredu.com"  // 显式传递验证的域名
        }
      });
      
      console.log("Edge Function response:", data);
      console.log("Edge Function error:", error);
      
      toast.dismiss(toastId);
      
      // 如果有错误，处理它
      if (error) {
        console.error("Error sending reminder (invoke error):", error);
        console.error("Error details:", JSON.stringify(error));
        
        // 提供更具体的错误信息
        if (typeof error === 'object' && error.message) {
          if (error.message.includes("Edge Function returned a non-2xx status code")) {
            toast.error("服务器错误：Edge Function 返回了错误状态码，请检查 Supabase Edge Function 日志以获取详细信息");
            return;
          }
        }
        
        // 通用错误处理
        toast.error(`发送提醒失败 (系统错误): ${JSON.stringify(error)}`);
        return;
      }
      
      // 处理Edge Function返回的错误
      if (data?.error) {
        console.error("Edge Function returned an error:", data.error);
        console.error("Error details:", JSON.stringify(data));
        
        // 检查错误类型并提供具体信息
        if (data.code === "from_address_not_allowed" || data.error.includes("from_address_not_allowed")) {
          toast.error(`域名验证错误: 请确认 ${data.domain || "dreamplaneredu.com"} 已在Resend.com正确验证。请转到Resend.com查看您的验证域名`);
        } else if (data.code === "unauthorized" || data.error.includes("unauthorized") || data.error.includes("API key")) {
          toast.error(`API密钥错误: 请检查Supabase Edge Function设置中的Resend API密钥是否有效`);
        } else if (data.code === "invalid_api_key_format" || data.error.includes("Invalid API key format")) {
          toast.error(`API密钥格式错误: Resend API密钥应以're_'开头，请检查设置`);
        } else {
          toast.error(`提醒发送失败: ${data.message || data.error}`);
        }
        return;
      }
      
      // 处理成功响应
      if (data?.success) {
        if (data?.note) {
          toast.success(`${data.message} (${data.note})`);
        } else if (data?.message) {
          toast.success(data.message);
        } else {
          toast.success("提醒邮件已发送");
        }
      } else if (data?.message === "No uncompleted todos to remind about") {
        toast.info("该学生没有未完成的待办事项");
      } else {
        toast.warning(`操作完成，但返回了意外响应: ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      console.error("Exception in send reminder:", err);
      console.error("Error details:", JSON.stringify(err));
      toast.dismiss();
      toast.error(`发送提醒失败 (应用错误): ${err.message || JSON.stringify(err)}`);
    }
  }, [studentId]);

  // Only show the reminder button for counselors
  const isCounselor = profile?.user_type === 'counselor' || profile?.user_type === 'admin';

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            <CardTitle>To-Do List</CardTitle>
          </div>
          {isCounselor && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSendReminder}
              className="flex items-center gap-1"
            >
              <Bell className="h-4 w-4" />
              发送提醒
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TodoForm onSubmit={handleCreateTodo} />
        <BulkImportForm onImport={handleBulkImport} />
        <div className="border rounded-md">
          <TodoList
            todos={todos}
            onToggleStatus={handleToggleStatus}
            onToggleStarred={handleToggleStarred}
            onUpdate={handleUpdateTodo}
            onDelete={handleDeleteTodo}
          />
        </div>
      </CardContent>
    </Card>
  );
}
