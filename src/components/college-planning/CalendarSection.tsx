import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Calendar, Plus, Edit, Trash, Download, FileText, Grid, CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useParams } from "react-router-dom";
import { useStudentTodos } from "@/hooks/todos/useStudentTodos";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportCalendarAsListPDF, exportCalendarAsGridPDF } from "./calendar/CalendarPDFExport";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Get student profile for export
  const { data: profile } = useQuery({
    queryKey: ["student-profile", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", studentId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  // Filter todos by month and selected year
  const getTodosForMonth = (monthIndex: number) => {
    return todos.filter(todo => {
      if (!todo.due_date) return false;
      const todoDate = new Date(todo.due_date);
      return todoDate.getMonth() === monthIndex && todoDate.getFullYear() === selectedYear;
    });
  };

  const handleAddTodo = async () => {
    if (!todoTitle.trim() || !studentId) return;

    let dueDate: Date;
    if (selectedDate) {
      dueDate = selectedDate;
    } else if (selectedMonth !== null) {
      dueDate = new Date(selectedYear, selectedMonth, 1);
    } else {
      dueDate = new Date(); // Default to today
    }
    
    try {
      await createTodo.mutateAsync({ 
        title: todoTitle, 
        authorId: studentId,
        due_date: dueDate.toISOString()
      });
      setTodoTitle("");
      setSelectedDate(undefined);
      setIsDialogOpen(false);
      toast.success("Todo added successfully");
    } catch (error) {
      toast.error("Failed to add todo");
    }
  };

  const handleEditTodo = async () => {
    if (!todoTitle.trim() || !editingTodo) return;

    const updateData: any = { id: editingTodo.id, title: todoTitle };
    
    // Add due_date to update if a new date was selected
    if (selectedDate) {
      updateData.due_date = selectedDate.toISOString();
    }

    try {
      await updateTodo.mutateAsync(updateData);
      setTodoTitle("");
      setSelectedDate(undefined);
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
    setSelectedDate(new Date(selectedYear, monthIndex, 1)); // Set default date to first of month
    setIsDialogOpen(true);
  };

  const openEditDialog = (todo: any) => {
    setEditingTodo(todo);
    setTodoTitle(todo.title);
    setSelectedDate(todo.due_date ? new Date(todo.due_date) : undefined);
    setIsDialogOpen(true);
  };

  const handleExportList = () => {
    exportCalendarAsListPDF(todos, selectedYear, profile?.full_name || undefined);
    toast.success("Calendar list exported successfully");
  };

  const handleExportGrid = () => {
    exportCalendarAsGridPDF(todos, selectedYear, profile?.full_name || undefined);
    toast.success("Calendar grid exported successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="h-6 w-6" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(y => y - 1)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-2xl font-bold min-w-[100px] text-center">{selectedYear}</h2>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSelectedYear(y => y + 1)}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportList} className="gap-2">
              <FileText className="h-4 w-4" />
              Export as List
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportGrid} className="gap-2">
              <Grid className="h-4 w-4" />
              Export as Calendar Grid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
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
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarUI
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
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