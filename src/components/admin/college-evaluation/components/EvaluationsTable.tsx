
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { StudentEvaluation } from "../types";
import { exportEvaluationToPDF } from "../utils/pdfExportUtils";

interface EvaluationsTableProps {
  evaluations: StudentEvaluation[] | null | undefined;
  isLoading: boolean;
}

export default function EvaluationsTable({ evaluations, isLoading }: EvaluationsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const handleExportPDF = (evaluation: StudentEvaluation) => {
    exportEvaluationToPDF(evaluation);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Created Evaluations</CardTitle>
        <CardDescription>
          View all completed student evaluations (Scoring criteria: 1 is highest, 6 is lowest)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading evaluation data...</div>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Evaluation Date</TableHead>
                  <TableHead>Total Score (Lower is better)</TableHead>
                  <TableHead>Academics</TableHead>
                  <TableHead>Extracurriculars</TableHead>
                  <TableHead>Athletics</TableHead>
                  <TableHead>Personal Qualities</TableHead>
                  <TableHead>Recommendations</TableHead>
                  <TableHead>Interview</TableHead>
                  <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleExportPDF(evaluation)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-4">
                      No evaluation data available
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
