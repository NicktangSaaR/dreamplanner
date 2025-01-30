import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Star, StarOff, Trash, Plus, Upload, Pencil, X } from "lucide-react";
import { useTodos } from "@/hooks/useTodos";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function TodoSection() {
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const { todos, createTodo, toggleTodoStatus, toggleStarred, deleteTodo, updateTodo } = useTodos();

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    await createTodo.mutateAsync(newTodoTitle);
    setNewTodoTitle("");
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const todoTitles = text.split('\n').filter(title => title.trim());
    
    if (todoTitles.length === 0) {
      toast.error("Please enter at least one todo item");
      return;
    }

    try {
      console.log("Bulk importing todos:", todoTitles);
      
      for (const title of todoTitles) {
        if (title.trim()) {
          await createTodo.mutateAsync(title.trim());
        }
      }

      setContent("");
      toast.success(`Successfully imported ${todoTitles.length} todos!`);
    } catch (error) {
      console.error("Error importing todos:", error);
      toast.error("Failed to import todos. Please try again.");
    }
  };

  const startEditing = (todo: { id: string; title: string }) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleUpdate = async (id: string) => {
    if (!editingTitle.trim()) return;
    try {
      await updateTodo.mutateAsync({ id, title: editingTitle });
      setEditingId(null);
      setEditingTitle("");
      toast.success("Todo updated successfully");
    } catch (error) {
      toast.error("Failed to update todo");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>To-Do List</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreateTodo} className="flex gap-2 mb-4">
          <Input
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1"
          />
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </form>

        <div className="mb-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste multiple todos (one per line) for bulk import..."
            className="mb-2"
          />
          <Button 
            onClick={() => handleBulkImport({ target: { value: content } } as React.ChangeEvent<HTMLTextAreaElement>)}
            disabled={!content.trim()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Import
          </Button>
        </div>

        <ScrollArea className="h-[300px] w-full rounded-md border p-4">
          <div className="space-y-2">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-center justify-between p-2 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTodoStatus.mutate({ id: todo.id, completed: !todo.completed })}
                  >
                    <Check className={`h-4 w-4 ${todo.completed ? "text-green-500" : "text-gray-300"}`} />
                  </Button>
                  {editingId === todo.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="min-w-[200px]"
                      />
                      <Button size="sm" onClick={() => handleUpdate(todo.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className={`${todo.completed ? "line-through text-gray-500" : ""}`}>
                      {todo.title}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {editingId !== todo.id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startEditing(todo)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStarred.mutate({ id: todo.id, starred: !todo.starred })}
                  >
                    {todo.starred ? (
                      <Star className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <StarOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo.mutate(todo.id)}
                  >
                    <Trash className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}