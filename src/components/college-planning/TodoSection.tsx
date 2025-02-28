import { useCallback } from "react";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";
import TodoForm from "./todos/TodoForm";
import BulkImportForm from "./todos/BulkImportForm";
import TodoList from "./todos/TodoList";
import { useStudentTodos } from "@/hooks/todos/useStudentTodos";

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          <CardTitle>To-Do List</CardTitle>
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