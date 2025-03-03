
import { memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import TodoItem from "./TodoItem";
import { Todo } from "@/hooks/todos/useTodoQuery";

interface TodoListProps {
  todos: Todo[];
  onToggleStatus: (id: string, completed: boolean) => Promise<void>;
  onToggleStarred: (id: string, starred: boolean) => Promise<void>;
  onUpdate: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TodoList = memo(({ 
  todos, 
  onToggleStatus, 
  onToggleStarred, 
  onUpdate, 
  onDelete 
}: TodoListProps) => (
  <ScrollArea className="h-[300px] w-full">
    <div className="p-4 space-y-2">
      {todos.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          No todos found
        </div>
      ) : (
        todos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggleStatus={onToggleStatus}
            onToggleStarred={onToggleStarred}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))
      )}
    </div>
  </ScrollArea>
));

TodoList.displayName = 'TodoList';

export default TodoList;
