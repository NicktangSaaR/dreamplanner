
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ListTodo, Star } from "lucide-react";
import { useStudentTodos } from "@/hooks/todos/useStudentTodos";

interface TodosCardProps {
  studentId: string;
}

export default function TodosCard({ studentId }: TodosCardProps) {
  // Use studentId to fetch todos
  const { todos } = useStudentTodos(studentId);
  
  const todoStats = {
    completed: todos.filter(todo => todo.completed).length,
    starred: todos.filter(todo => todo.starred).length,
    total: todos.length,
  };

  return (
    <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-950">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">
          <div className="flex items-center gap-2">
            <ListTodo className="h-5 w-5" />
            To-Dos
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{todoStats.total} Tasks</div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              {todoStats.completed} Done
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-400" />
              {todoStats.starred} Starred
            </span>
          </div>
          {todoStats.total > 0 && (
            <p className="text-xs text-muted-foreground">
              {Math.round((todoStats.completed / todoStats.total) * 100)}% completed
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
