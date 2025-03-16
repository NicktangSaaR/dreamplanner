
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserPlus } from "lucide-react";
import EvaluationForm from "./EvaluationForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StudentEvaluation } from "./types";
import { useUserStatus } from "@/hooks/useUserStatus";

interface Student {
  id: string;
  full_name: string;
  grade: string;
  school: string;
}

export default function StudentEvaluationManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isAdmin } = useUserStatus();

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      console.log("Fetching student data for evaluation manager");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, grade, school")
        .eq("user_type", "student");
      
      if (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
      console.log("Fetched students:", data);
      return data as Student[];
    },
    enabled: isAdmin, // Only run query if user is admin
  });

  // Fetch existing evaluations
  const { data: evaluations, isLoading: isLoadingEvals, refetch: refetchEvaluations } = useQuery({
    queryKey: ["student-evaluations"],
    queryFn: async () => {
      console.log("Fetching evaluation data");
      const { data, error } = await supabase
        .from("student_evaluations")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching evaluations:", error);
        throw error;
      }
      console.log("Fetched evaluations:", data);
      return data as StudentEvaluation[];
    },
    enabled: isAdmin, // Only run query if user is admin
  });

  const filteredStudents = students?.filter(student => 
    student.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    refetchEvaluations();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  if (!isAdmin) {
    return <div className="p-4 text-center">您没有访问该页面的权限</div>;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>学生评估管理</CardTitle>
          <CardDescription>
            搜索学生并创建藤校（Ivy League）录取评估表
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="搜索学生姓名..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoadingStudents ? (
            <div className="text-center py-4">加载学生数据中...</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>学校</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.full_name || "未知姓名"}</TableCell>
                        <TableCell>{student.grade || "未知年级"}</TableCell>
                        <TableCell>{student.school || "未知学校"}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleSelectStudent(student)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            创建评估
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        {searchQuery ? "没有找到匹配的学生" : "暂无学生数据"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>已创建的评估表</CardTitle>
          <CardDescription>
            查看所有已完成的学生评估记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingEvals ? (
            <div className="text-center py-4">加载评估数据中...</div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>评估日期</TableHead>
                    <TableHead>总分（满分30）</TableHead>
                    <TableHead>学术</TableHead>
                    <TableHead>课外</TableHead>
                    <TableHead>奖项</TableHead>
                    <TableHead>个人素质</TableHead>
                    <TableHead>文书</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations && evaluations.length > 0 ? (
                    evaluations.map((evaluation) => (
                      <TableRow key={evaluation.id}>
                        <TableCell className="font-medium">{evaluation.student_name}</TableCell>
                        <TableCell>{formatDate(evaluation.evaluation_date)}</TableCell>
                        <TableCell className="font-semibold">{evaluation.total_score}</TableCell>
                        <TableCell>{evaluation.academics_score}</TableCell>
                        <TableCell>{evaluation.extracurriculars_score}</TableCell>
                        <TableCell>{evaluation.awards_score}</TableCell>
                        <TableCell>{evaluation.personal_qualities_score}</TableCell>
                        <TableCell>{evaluation.essays_score}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        暂无评估数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evaluation Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>创建藤校录取评估表</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <EvaluationForm 
              studentId={selectedStudent.id} 
              studentName={selectedStudent.full_name || "未知学生"}
              onSuccess={handleSuccess}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
