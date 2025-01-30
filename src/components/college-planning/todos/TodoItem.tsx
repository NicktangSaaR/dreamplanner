import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Star, StarOff, Trash, Pencil, X } from "lucide-react";
import { toast } from "sonner";

interface TodoItemProps {
  todo: {
    id: string;
    title: string;
    completed: boolean;
    starred: boolean;
  };
  onToggleStatus: (id: string, completed: boolean) => Promise<void>;
  onToggleStarred: (id: string, starred: boolean) => Promise<void>;
  onUpdate: (id: string, title: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function TodoItem({
  todo,
  onToggleStatus,
  onToggleStarred,
  onUpdate,
  onDelete,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(todo.title);

  const handleUpdate = async () => {
    if (!editingTitle.trim()) return;
    try {
      await onUpdate(todo.id, editingTitle);
      setIsEditing(false);
      toast.success("Todo updated successfully");
    } catch (error) {
      toast.error("Failed to update todo");
    }
  };

  return (
    <div className="flex items-center justify-between p-2 rounded-lg border bg-card">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(todo.id, !todo.completed)}
        >
          <Check className={`h-4 w-4 ${todo.completed ? "text-green-500" : "text-gray-300"}`} />
        </Button>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              className="min-w-[200px]"
            />
            <Button size="sm" onClick={handleUpdate}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
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
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStarred(todo.id, !todo.starred)}
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
          onClick={() => onDelete(todo.id)}
        >
          <Trash className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  );
}