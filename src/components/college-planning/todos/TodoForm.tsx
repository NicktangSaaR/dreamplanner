
import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface TodoFormProps {
  onSubmit: (title: string) => Promise<void>;
}

export default function TodoForm({ onSubmit }: TodoFormProps) {
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(newTodoTitle);
      setNewTodoTitle("");
    } catch (error) {
      console.error("Error submitting todo:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
      <Input
        value={newTodoTitle}
        onChange={(e) => setNewTodoTitle(e.target.value)}
        placeholder="Add a new todo..."
        className="flex-1"
      />
      <Button type="submit" size="sm" disabled={isSubmitting}>
        <Plus className="h-4 w-4 mr-2" />
        {isSubmitting ? "Adding..." : "Add"}
      </Button>
    </form>
  );
}
