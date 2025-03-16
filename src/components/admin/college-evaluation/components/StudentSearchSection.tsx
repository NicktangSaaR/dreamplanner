import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, UserPlus } from "lucide-react";
interface Student {
  id: string;
  full_name: string;
  grade: string;
  school: string;
}
interface StudentSearchSectionProps {
  students: Student[] | undefined;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectStudent: (student: Student) => void;
}
export default function StudentSearchSection({
  students,
  isLoading,
  searchQuery,
  setSearchQuery,
  onSelectStudent
}: StudentSearchSectionProps) {
  const filteredStudents = students?.filter(student => student.full_name?.toLowerCase().includes(searchQuery.toLowerCase())) || [];
  return <Card>
      <CardHeader>
        <CardTitle>学生评估管理</CardTitle>
        <CardDescription>搜索学生并创建大学本科录取评估表</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="搜索学生姓名..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {isLoading ? <div className="text-center py-4">加载学生数据中...</div> : <div className="border rounded-md">
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
                {filteredStudents.length > 0 ? filteredStudents.map(student => <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.full_name || "未知姓名"}</TableCell>
                      <TableCell>{student.grade || "未知年级"}</TableCell>
                      <TableCell>{student.school || "未知学校"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => onSelectStudent(student)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          创建评估
                        </Button>
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      {searchQuery ? "没有找到匹配的学生" : "暂无学生数据"}
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>}
      </CardContent>
    </Card>;
}