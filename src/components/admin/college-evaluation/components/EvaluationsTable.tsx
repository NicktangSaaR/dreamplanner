
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StudentEvaluation } from "../types";

interface EvaluationsTableProps {
  evaluations: StudentEvaluation[] | null | undefined;
  isLoading: boolean;
}

export default function EvaluationsTable({ evaluations, isLoading }: EvaluationsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>已创建的评估表</CardTitle>
        <CardDescription>
          查看所有已完成的学生评估记录（评分标准：1为最高，6为最低）
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">加载评估数据中...</div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>评估日期</TableHead>
                  <TableHead>总分（满分36）</TableHead>
                  <TableHead>学术</TableHead>
                  <TableHead>课外</TableHead>
                  <TableHead>运动</TableHead>
                  <TableHead>个人素质</TableHead>
                  <TableHead>推荐信</TableHead>
                  <TableHead>面试</TableHead>
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
                      <TableCell>{evaluation.athletics_score}</TableCell>
                      <TableCell>{evaluation.personal_qualities_score}</TableCell>
                      <TableCell>{evaluation.recommendations_score}</TableCell>
                      <TableCell>{evaluation.interview_score}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-4">
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
  );
}
