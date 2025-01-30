import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTodos } from "@/hooks/useTodos";
import TodoForm from "./todos/TodoForm";
import BulkImportForm from "./todos/BulkImportForm";
import TodoItem from "./todos/TodoItem";

export default function TodoSection() {
  const {
    todos,
    createTodo,
    toggleTodoStatus,
    toggleStarred,
    updateTodo,
    deleteTodo,
  } = useTodos();

  const handleBulkImport = async (titles: string[]) => {
    for (const title of titles) {
      if (title.trim()) {
        await createTodo.mutateAsync(title.trim());
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>To-Do List</CardTitle>
      </CardHeader>
      <CardContent>
        <TodoForm onSubmit={createTodo.mutateAsync} />
        <BulkImportForm onImport={handleBulkImport} />
        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          <div className="space-y-2">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggleStatus={(id, completed) => toggleTodoStatus.mutate({ id, completed })}
                onToggleStarred={(id, starred) => toggleStarred.mutate({ id, starred })}
                onUpdate={(id, title) => updateTodo.mutateAsync({ id, title })}
                onDelete={(id) => deleteTodo.mutate(id)}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}