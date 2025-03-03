
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Bell, Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import TodoForm from "./todos/TodoForm";
import BulkImportForm from "./todos/BulkImportForm";
import TodoList from "./todos/TodoList";
import { Button } from "@/components/ui/button";
import { useTodoReminder } from "@/hooks/todos/useTodoReminder";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useStudentTodos } from "@/hooks/todos/useStudentTodos";

export default function TodoSection() {
  const { studentId } = useParams();
  const { profile } = useProfile();
  const [lastReminderSent, setLastReminderSent] = useState<Date | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const {
    todos,
    createTodo,
    toggleTodoStatus,
    toggleStarred,
    updateTodo,
    deleteTodo,
  } = useStudentTodos(studentId);
  const { sendReminder, isLoading, connectionError } = useTodoReminder(studentId);

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
      toast.error("无法发送提醒：未找到学生ID");
      return;
    }
    
    try {
      console.log("Sending reminder for student:", studentId);
      await sendReminder();
      
      // Only record the time when reminder was successfully sent
      if (!connectionError) {
        setLastReminderSent(new Date());
      }
    } catch (error) {
      console.error("Failed to send reminder:", error);
      toast.error("提醒发送失败，请稍后再试");
    }
  }, [sendReminder, studentId, connectionError]);

  const handleRetryConnection = useCallback(async () => {
    setIsRetrying(true);
    try {
      toast.info("正在尝试重新连接到 Supabase...");
      // Import the check function to avoid circular dependencies
      const { checkSupabaseConnectivity } = await import("@/hooks/todos/services/todoReminderService");
      const isConnected = await checkSupabaseConnectivity();
      
      if (isConnected) {
        toast.success("已成功连接到 Supabase");
        // If connection is restored, try sending the reminder
        handleSendReminder();
      } else {
        toast.error("无法连接到 Supabase，请确保项目处于活动状态");
      }
    } catch (error) {
      console.error("Error checking connectivity:", error);
      toast.error("检查连接时发生错误");
    } finally {
      setIsRetrying(false);
    }
  }, [handleSendReminder]);

  // Only show the reminder button for counselors
  const isCounselor = profile?.user_type === 'counselor' || profile?.user_type === 'admin';
  const hasUncompletedTodos = todos.some(todo => !todo.completed);
  
  // Format the last reminder time
  const lastReminderText = lastReminderSent 
    ? `上次提醒发送时间: ${lastReminderSent.toLocaleString('zh-CN')}`
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            <CardTitle>To-Do List</CardTitle>
          </div>
          {isCounselor && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-end">
                    {connectionError ? (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleRetryConnection}
                          className="flex items-center gap-1 text-amber-500 hover:text-amber-600 border-amber-200"
                          disabled={isRetrying}
                        >
                          {isRetrying ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              连接中...
                            </>
                          ) : (
                            <>
                              <RefreshCcw className="h-4 w-4" />
                              重试连接
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSendReminder}
                          className="flex items-center gap-1 opacity-50"
                          disabled={true}
                        >
                          <Bell className="h-4 w-4" />
                          发送提醒
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleSendReminder}
                        className="flex items-center gap-1"
                        disabled={isLoading || !hasUncompletedTodos}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            发送中...
                          </>
                        ) : (
                          <>
                            <Bell className="h-4 w-4" />
                            发送提醒
                          </>
                        )}
                      </Button>
                    )}
                    {lastReminderText && !connectionError && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {lastReminderText}
                      </span>
                    )}
                    {connectionError && (
                      <span className="text-xs text-amber-500 mt-1">
                        连接错误：请激活 Supabase 项目后重试
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {connectionError ? (
                    <div className="max-w-xs">
                      <div className="flex items-center gap-1 mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold">连接错误</span>
                      </div>
                      <p>无法连接到 Supabase Edge Function，可能原因:</p>
                      <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
                        <li>Supabase 项目处于休眠状态</li>
                        <li>网络连接问题</li>
                        <li>Edge Function 部署问题</li>
                      </ul>
                      <p className="mt-1 text-sm">请尝试访问 Supabase 控制台以激活项目，然后点击"重试连接"</p>
                    </div>
                  ) : !hasUncompletedTodos ? (
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      <span>没有未完成的待办事项可以提醒</span>
                    </div>
                  ) : (
                    <div>
                      <p>发送邮件提醒学生和辅导员未完成的待办事项</p>
                      <p className="text-xs mt-1">提醒将发送到学生和辅导员的邮箱</p>
                    </div>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
