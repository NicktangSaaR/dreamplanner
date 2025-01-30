import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, Star, StarOff, Trash, Plus, Wand2, Upload } from "lucide-react";
import { useTodos } from "@/hooks/useTodos";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function TodoSection() {
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [content, setContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { todos, createTodo, toggleTodoStatus, toggleStarred, deleteTodo } = useTodos();

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    await createTodo.mutateAsync(newTodoTitle);
    setNewTodoTitle("");
  };

  const handleGenerateTodos = async () => {
    if (!content.trim()) {
      toast.error("Please enter some content to generate todos from");
      return;
    }

    setIsGenerating(true);
    try {
      console.log("Generating todos with content:", content);
      
      const { data, error } = await supabase.functions.invoke('generate-todos', {
        body: { content }
      });

      if (error) {
        console.error("Error generating todos:", error);
        throw error;
      }

      console.log("Generated todos response:", data);
      const { todos: generatedTodos } = data;
      
      // Create each generated todo
      for (const todoTitle of generatedTodos) {
        await createTodo.mutateAsync(todoTitle);
      }

      setContent("");
      toast.success("Successfully generated todos!");
    } catch (error) {
      console.error("Error generating todos:", error);
      toast.error("Failed to generate todos. Please try again.");
    } finally {
      setIsGenerating(false);
    }
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
      
      // Create todos in sequence
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
            placeholder="Enter text to generate todos from, or paste multiple todos (one per line) for bulk import..."
            className="mb-2"
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleGenerateTodos} 
              disabled={isGenerating || !content.trim()}
              className="flex-1"
            >
              <Wand2 className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "Generate Todos"}
            </Button>
            <Button 
              onClick={() => handleBulkImport({ target: { value: content } } as React.ChangeEvent<HTMLTextAreaElement>)}
              disabled={!content.trim()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Bulk Import
            </Button>
          </div>
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
                  <span className={`${todo.completed ? "line-through text-gray-500" : ""}`}>
                    {todo.title}
                  </span>
                </div>
                <div className="flex items-center gap-1">
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