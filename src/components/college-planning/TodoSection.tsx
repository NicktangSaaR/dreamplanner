import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTodos } from "@/hooks/useTodos";
import TodoForm from "./todos/TodoForm";
import BulkImportForm from "./todos/BulkImportForm";
import TodoItem from "./todos/TodoItem";
import { useCallback, memo } from "react";
import { Todo } from "@/hooks/todos/useTodoQuery";
import { useParams } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

// Define props interface for TodoList
interface TodoListProps {
  todos: Todo[];
  onToggleStatus: (id: string, completed: boolean) => Promise<void>;
  onToggleStarred: (id: string, starred: boolean) => Promise<void>;
  onUpdate: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

// Memoize TodoList component to prevent unnecessary re-renders
const TodoList = memo(({ 
  todos, 
  onToggleStatus, 
  onToggleStarred, 
  onUpdate, 
  onDelete 
}: TodoListProps) => (
  <div className="space-y-2">
    {todos.map((todo) => (
      <TodoItem
        key={todo.id}
        todo={todo}
        onToggleStatus={onToggleStatus}
        onToggleStarred={onToggleStarred}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    ))}
  </div>
));

TodoList.displayName = 'TodoList';

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
  } = useTodos();

  // Filter todos based on the current context
  const filteredTodos = todos.filter(todo => {
    if (profile?.user_type === 'counselor' && studentId) {
      return todo.author_id === studentId;
    }
    return todo.author_id === profile?.id;
  });

  console.log("TodoSection - Current user type:", profile?.user_type);
  console.log("TodoSection - Student ID from params:", studentId);
  console.log("TodoSection - Filtered todos:", filteredTodos);

  const handleCreateTodo = useCallback(async (title: string) => {
    await createTodo.mutateAsync({
      title,
      authorId: studentId || profile?.id
    });
  }, [createTodo, studentId, profile?.id]);

  const handleBulkImport = useCallback(async (titles: string[]) => {
    for (const title of titles) {
      if (title.trim()) {
        await createTodo.mutateAsync({
          title: title.trim(),
          authorId: studentId || profile?.id
        });
      }
    }
  }, [createTodo, studentId, profile?.id]);

  const handleToggleStatus = useCallback(async (id: string, completed: boolean) => {
    await toggleTodoStatus.mutateAsync({ id, completed });
  }, [toggleTodoStatus]);

  const handleToggleStarred = useCallback(async (id: string, starred: boolean) => {
    await toggleStarred.mutateAsync({ id, starred });
  }, [toggleStarred]);

  const handleUpdateTodo = useCallback(async (id: string, title: string) => {
    await updateTodo.mutateAsync({ id, title });
  }, [updateTodo]);

  const handleDeleteTodo = useCallback(async (id: string) => {
    await deleteTodo.mutateAsync(id);
  }, [deleteTodo]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>To-Do List</CardTitle>
      </CardHeader>
      <CardContent>
        <TodoForm onSubmit={handleCreateTodo} />
        <BulkImportForm onImport={handleBulkImport} />
        <div className="h-[300px] w-full rounded-md border">
          <ScrollArea className="h-full w-full">
            <div className="p-4">
              <TodoList
                todos={filteredTodos}
                onToggleStatus={handleToggleStatus}
                onToggleStarred={handleToggleStarred}
                onUpdate={handleUpdateTodo}
                onDelete={handleDeleteTodo}
              />
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}