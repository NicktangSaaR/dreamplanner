
import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import TodoList from './todos/TodoList';
import TodoForm from './todos/TodoForm';
import BulkImportForm from './todos/BulkImportForm';
import { ChevronDown, ChevronUp, SendIcon, ExternalLink } from 'lucide-react';
import { useTodos } from '@/hooks/useTodos';
import { useTodoReminder } from '@/hooks/todos/useTodoReminder';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useUserStatus } from '@/hooks/useUserStatus';

const TodoSection = () => {
  const { studentId } = useParams();
  const { todos, isLoading, error, createTodo, updateTodo, toggleTodoStatus, toggleStarred, deleteTodo } = useTodos();
  const { sendReminder, isLoading: isSendingReminder, connectionError, lastAttempt } = useTodoReminder(studentId);
  const [expanded, setExpanded] = useState(true);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const { userType } = useAuth();
  const { isAdmin } = useUserStatus();

  // Filter todos for this student
  const filteredTodos = useMemo(() => {
    if (!studentId) return [];
    console.log("TodoSection - Current user type:", userType);
    console.log("TodoSection - Student ID from params:", studentId);
    const filtered = todos.filter(todo => todo.author_id === studentId);
    console.log("TodoSection - Filtered todos:", filtered);
    return filtered;
  }, [todos, studentId]);

  const completedTodos = useMemo(() => {
    return filteredTodos.filter(todo => todo.completed);
  }, [filteredTodos]);

  const incompleteTodos = useMemo(() => {
    return filteredTodos.filter(todo => !todo.completed);
  }, [filteredTodos]);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  const toggleShowBulkImport = () => {
    setShowBulkImport(!showBulkImport);
  };

  const handleSendReminder = async () => {
    if (!studentId) {
      toast.error("无法发送提醒：未找到学生ID");
      return;
    }

    try {
      await sendReminder();
    } catch (err) {
      console.error("Error sending reminder:", err);
      toast.error(`发送提醒失败：${err.message || '未知错误'}`);
    }
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard/project/fyxnuhqzgkzfuldqurej', '_blank');
  };

  // Format the last attempt time
  const formattedLastAttemptTime = lastAttempt ? 
    new Intl.DateTimeFormat('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    }).format(lastAttempt) : null;

  // Create wrapper functions to match the expected prop types
  const handleToggleStatus = async (id: string, completed: boolean) => {
    await toggleTodoStatus({ id, completed });
  };

  const handleToggleStarred = async (id: string, starred: boolean) => {
    await toggleStarred({ id, starred });
  };

  const handleUpdateTodo = async (id: string, title: string) => {
    await updateTodo({ id, title });
  };

  const handleDeleteTodo = async (id: string) => {
    await deleteTodo(id);
  };

  const handleCreateTodo = async (title: string) => {
    if (!studentId) return;
    await createTodo({ title, authorId: studentId });
  };

  const handleBulkImport = async (titles: string[]) => {
    if (!studentId) return;
    for (const title of titles) {
      await createTodo({ title, authorId: studentId });
    }
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="p-4 flex flex-row items-center justify-between border-b cursor-pointer" onClick={toggleExpanded}>
        <h3 className="text-lg font-semibold">To-Do List</h3>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toggleExpanded(); }} className="rounded-full p-0 h-6 w-6 flex items-center justify-center">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CardHeader>
      
      {expanded && (
        <>
          <CardContent className="p-0">
            <Tabs defaultValue="incomplete" className="w-full">
              <TabsList className="w-full rounded-none border-b">
                <TabsTrigger value="incomplete" className="flex-1">待完成 ({incompleteTodos.length})</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1">已完成 ({completedTodos.length})</TabsTrigger>
                <TabsTrigger value="all" className="flex-1">全部 ({filteredTodos.length})</TabsTrigger>
              </TabsList>
              
              <TabsContent value="incomplete" className="p-4">
                <TodoList
                  todos={incompleteTodos}
                  onToggleStatus={handleToggleStatus}
                  onToggleStarred={handleToggleStarred}
                  onDelete={handleDeleteTodo}
                  onUpdate={handleUpdateTodo}
                />
              </TabsContent>
              
              <TabsContent value="completed" className="p-4">
                <TodoList
                  todos={completedTodos}
                  onToggleStatus={handleToggleStatus}
                  onToggleStarred={handleToggleStarred}
                  onDelete={handleDeleteTodo}
                  onUpdate={handleUpdateTodo}
                />
              </TabsContent>
              
              <TabsContent value="all" className="p-4">
                <TodoList
                  todos={filteredTodos}
                  onToggleStatus={handleToggleStatus}
                  onToggleStarred={handleToggleStarred}
                  onDelete={handleDeleteTodo}
                  onUpdate={handleUpdateTodo}
                />
              </TabsContent>
            </Tabs>
            
            {!showBulkImport ? (
              <div className="p-4 border-t">
                <TodoForm onSubmit={handleCreateTodo} />
              </div>
            ) : (
              <div className="p-4 border-t">
                <BulkImportForm onImport={handleBulkImport} onCancel={toggleShowBulkImport} />
              </div>
            )}
          </CardContent>
          
          <CardFooter className="p-4 border-t flex flex-wrap gap-2 justify-between items-center">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleShowBulkImport}
              >
                {showBulkImport ? '取消批量导入' : '批量导入'}
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
              {connectionError && (
                <div className="text-xs text-red-500 mr-2">
                  {formattedLastAttemptTime && (
                    <span className="block">{formattedLastAttemptTime} 尝试失败</span>
                  )}
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs" 
                      onClick={openSupabaseDashboard}
                    >
                      打开 Supabase <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleSendReminder}
                disabled={isSendingReminder || incompleteTodos.length === 0}
                className="flex items-center gap-1"
                variant="outline"
                size="sm"
              >
                <SendIcon className="h-3.5 w-3.5" />
                {isSendingReminder ? '发送中...' : '发送提醒邮件'}
              </Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default TodoSection;
