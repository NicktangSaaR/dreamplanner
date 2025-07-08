import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, Trash } from "lucide-react";
import { useParams } from "react-router-dom";
import { useStudentTodos } from "@/hooks/todos/useStudentTodos";
import { toast } from "sonner";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function CalendarSection() {
  const { studentId } = useParams();
  const { todos, createTodo, updateTodo, deleteTodo } = useStudentTodos(studentId);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<any>(null);
  const [todoTitle, setTodoTitle] = useState("");

  const currentYear = new Date().getFullYear();

  // Filter todos by month
  const getTodosForMonth = (monthIndex: number) => {
    return todos.filter(todo => {
      if (!todo.due_date) return false;
      const todoDate = new Date(todo.due_date);
      return todoDate.getMonth() === monthIndex && todoDate.getFullYear() === currentYear;
    });
  };

  const handleAddTodo = async () => {
    if (!todoTitle.trim() || selectedMonth === null || !studentId) return;

    // Set due date to first day of selected month
    const dueDate = new Date(currentYear, selectedMonth, 1);
    
    try {
      await createTodo.mutateAsync({ 
        title: todoTitle, 
        authorId: studentId,
        due_date: dueDate.toISOString()
      });
      setTodoTitle("");
      setIsDialogOpen(false);
      toast.success("Todo added successfully");
    } catch (error) {
      toast.error("Failed to add todo");
    }
  };

  const handleEditTodo = async () => {
    if (!todoTitle.trim() || !editingTodo) return;

    try {
      await updateTodo.mutateAsync({ 
        id: editingTodo.id, 
        title: todoTitle 
      });
      setTodoTitle("");
      setEditingTodo(null);
      setIsDialogOpen(false);
      toast.success("Todo updated successfully");
    } catch (error) {
      toast.error("Failed to update todo");
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await deleteTodo.mutateAsync(todoId);
      toast.success("Todo deleted successfully");
    } catch (error) {
      toast.error("Failed to delete todo");
    }
  };

  const openAddDialog = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setEditingTodo(null);
    setTodoTitle("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (todo: any) => {
    setEditingTodo(todo);
    setTodoTitle(todo.title);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Calendar className="h-6 w-6" />
        <h2 className="text-2xl font-bold">{currentYear} Calendar</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {MONTHS.map((month, index) => {
          const monthTodos = getTodosForMonth(index);
          
          return (
            <Card key={month} className="relative min-h-[200px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  {month}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAddDialog(index)}
                    className="h-6 w-6 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {monthTodos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No todos this month</p>
                ) : (
                  monthTodos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                    >
                      <span className={`flex-1 ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {todo.title}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(todo)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTodo ? 'Edit Todo' : `Add Todo for ${selectedMonth !== null ? MONTHS[selectedMonth] : ''}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter todo title..."
              value={todoTitle}
              onChange={(e) => setTodoTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  editingTodo ? handleEditTodo() : handleAddTodo();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={editingTodo ? handleEditTodo : handleAddTodo}>
                {editingTodo ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}