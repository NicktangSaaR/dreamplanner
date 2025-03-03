import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, Bell, Loader2, AlertCircle } from "lucide-react";
import TodoForm from "./todos/TodoForm";
import BulkImportForm from "./todos/BulkImportForm";
import TodoList from "./todos/TodoList";
import { Button } from "@/components/ui/button";
import { useTodoReminder } from "@/hooks/todos/useTodoReminder";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

export default function TodoSection() {
  const { studentId } = useParams();
  const { profile } = useProfile();
  const [lastReminderSent, setLastReminderSent] = useState<Date | null>(null);
  const {
    todos,
    createTodo,
    toggleTodoStatus,
    toggleStarred,
    updateTodo,
    deleteTodo,
  } = useStudentTodos(studentId);
  const { sendReminder, isLoading } = useTodoReminder(studentId);

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
      
      // Record the time when reminder was sent
      setLastReminderSent(new Date());
    } catch (error) {
      console.error("Failed to send reminder:", error);
      toast.error("提醒发送失败，请稍后再试");
    }
  }, [sendReminder, studentId]);

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
                    {lastReminderText && (
                      <span className="text-xs text-muted-foreground mt-1">
                        {lastReminderText}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  {!hasUncompletedTodos ? (
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
