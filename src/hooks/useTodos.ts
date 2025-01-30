import { useState } from "react";
import { useTodoQuery } from "./todos/useTodoQuery";
import { useCreateTodo } from "./todos/useCreateTodo";
import { useUpdateTodo } from "./todos/useUpdateTodo";
import { useToggleTodo } from "./todos/useToggleTodo";
import { useDeleteTodo } from "./todos/useDeleteTodo";

export function useTodos() {
  const [error, setError] = useState<string | null>(null);
  const { data: todos = [], isLoading } = useTodoQuery();
  const createTodo = useCreateTodo();
  const updateTodo = useUpdateTodo();
  const { toggleStatus: toggleTodoStatus, toggleStarred } = useToggleTodo();
  const deleteTodo = useDeleteTodo();

  return {
    todos,
    isLoading,
    error,
    createTodo,
    updateTodo,
    toggleTodoStatus,
    toggleStarred,
    deleteTodo,
  };
}