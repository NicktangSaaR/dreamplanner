import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Upload, ListTodo, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Student {
  id: string;
  full_name: string | null;
  email: string | null;
}

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  starred: boolean;
  due_date: string | null;
  created_at: string;
}

export default function StudentTodoManagement() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [bulkContent, setBulkContent] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("user_type", "student")
        .order("full_name");

      if (error) throw error;
      return data as Student[];
    },
  });

  // Fetch todos for selected student
  const { data: todos, isLoading: todosLoading } = useQuery({
    queryKey: ["admin-student-todos", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("author_id", selectedStudentId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Todo[];
    },
    enabled: !!selectedStudentId,
  });

  // Add single todo mutation
  const addTodoMutation = useMutation({
    mutationFn: async (title: string) => {
      if (!selectedStudentId) throw new Error("No student selected");
      
      const { data, error } = await supabase
        .from("todos")
        .insert({
          title,
          author_id: selectedStudentId,
          completed: false,
          starred: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-student-todos", selectedStudentId] });
      setNewTodoTitle("");
      toast.success("Todo added successfully!");
    },
    onError: (error) => {
      console.error("Error adding todo:", error);
      toast.error("Failed to add todo");
    },
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (titles: string[]) => {
      if (!selectedStudentId) throw new Error("No student selected");
      
      const todosToInsert = titles.map((title) => ({
        title: title.trim(),
        author_id: selectedStudentId,
        completed: false,
        starred: false,
      }));

      const { data, error } = await supabase
        .from("todos")
        .insert(todosToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-student-todos", selectedStudentId] });
      setBulkContent("");
      setShowBulkImport(false);
      toast.success(`Successfully imported ${data.length} todos!`);
    },
    onError: (error) => {
      console.error("Error importing todos:", error);
      toast.error("Failed to import todos");
    },
  });

  // Toggle todo completion mutation
  const toggleTodoMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("todos")
        .update({ completed })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-student-todos", selectedStudentId] });
    },
    onError: (error) => {
      console.error("Error toggling todo:", error);
      toast.error("Failed to update todo");
    },
  });

  // Delete todo mutation
  const deleteTodoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-student-todos", selectedStudentId] });
      toast.success("Todo deleted!");
    },
    onError: (error) => {
      console.error("Error deleting todo:", error);
      toast.error("Failed to delete todo");
    },
  });

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    addTodoMutation.mutate(newTodoTitle.trim());
  };

  const handleBulkImport = () => {
    const titles = bulkContent
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (titles.length === 0) {
      toast.error("Please enter at least one todo item");
      return;
    }

    bulkImportMutation.mutate(titles);
  };

  const selectedStudent = students?.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            Student Todo Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Student Selection */}
          <div className="mb-6">
            <Label htmlFor="student-select" className="mb-2 block">
              Select Student
            </Label>
            {studentsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading students...
              </div>
            ) : (
              <Select
                value={selectedStudentId}
                onValueChange={setSelectedStudentId}
              >
                <SelectTrigger id="student-select" className="w-full max-w-md">
                  <SelectValue placeholder="Choose a student..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name || student.email || "Unnamed Student"}
                    </SelectItem>
                  ))
                  }
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedStudentId && (
            <>
              {/* Add Single Todo */}
              <div className="mb-6">
                <Label className="mb-2 block">Add Single Todo</Label>
                <form onSubmit={handleAddTodo} className="flex gap-2">
                  <Input
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    placeholder="Enter todo title..."
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    disabled={!newTodoTitle.trim() || addTodoMutation.isPending}
                  >
                    {addTodoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Add
                  </Button>
                </form>
              </div>

              {/* Bulk Import Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <Label>Bulk Import</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBulkImport(!showBulkImport)}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {showBulkImport ? "Hide" : "Show"} Bulk Import
                  </Button>
                </div>
                {showBulkImport && (
                  <div className="space-y-2 p-4 border rounded-lg bg-muted/30">
                    <Textarea
                      value={bulkContent}
                      onChange={(e) => setBulkContent(e.target.value)}
                      placeholder="Paste multiple todos (one per line)..."
                      rows={6}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBulkImport}
                        disabled={!bulkContent.trim() || bulkImportMutation.isPending}
                        className="flex-1"
                      >
                        {bulkImportMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        Import All
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setBulkContent("");
                          setShowBulkImport(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Existing Todos List */}
              <div>
                <Label className="mb-2 block">
                  Current Todos for {selectedStudent?.full_name || "Student"}
                </Label>
                {todosLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading todos...
                  </div>
                ) : todos && todos.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-2">
                    {todos.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group"
                      >
                        <Checkbox
                          checked={todo.completed}
                          onCheckedChange={(checked) =>
                            toggleTodoMutation.mutate({
                              id: todo.id,
                              completed: !!checked,
                            })
                          }
                        />
                        <span
                          className={`flex-1 ${
                            todo.completed
                              ? "line-through text-muted-foreground"
                              : ""
                          }`}
                        >
                          {todo.title}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteTodoMutation.mutate(todo.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground py-4">
                    No todos yet for this student.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
