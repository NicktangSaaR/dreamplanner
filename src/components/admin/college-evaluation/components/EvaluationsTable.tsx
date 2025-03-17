
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { StudentEvaluation, UniversityType } from "../types";
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
    // Add default university type if not present
    const evaluationWithType = {
      ...evaluation,
      university_type: evaluation.university_type || 'ivyLeague'
    };
    exportEvaluationToPDF(evaluationWithType);
  };

  // Helper function to get university type display name
  const getUniversityTypeDisplay = (type?: UniversityType): string => {
    if (!type) return "Ivy League";
    
    switch (type) {
      case 'ivyLeague':
        return "Ivy League";
      case 'top30':
        return "Top 20-30";
      case 'ucSystem':
        return "UC System";
      default:
        return "Ivy League";
    }
  };

  // Function to get appropriate column label based on university type
  const getColumnLabel = (key: string, universityType?: UniversityType): string => {
    if (universityType === 'ucSystem') {
      switch (key) {
        case 'recommendations':
          return "PIQs";
        case 'athletics':
          return "Personal Talents";
        case 'interview':
          return "N/A";
        default:
          break;
      }
    }
    
    switch (key) {
      case 'academics':
        return "Academics";
      case 'extracurriculars':
        return "Extracurriculars";
      case 'athletics':
        return "Athletics";
      case 'personalQualities':
        return "Personal Qualities";
      case 'recommendations':
        return "Recommendations";
      case 'interview':
        return "Interview";
      default:
        return key;
    }
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
                  <TableHead>University Type</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead>Academics</TableHead>
                  <TableHead>Extracurriculars</TableHead>
                  <TableHead>Athletics/Talents</TableHead>
                  <TableHead>Personal Qualities</TableHead>
                  <TableHead>Recommendations/PIQs</TableHead>
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
                      <TableCell>{getUniversityTypeDisplay(evaluation.university_type as UniversityType)}</TableCell>
                      <TableCell className="font-semibold">{evaluation.total_score}</TableCell>
                      <TableCell>{evaluation.academics_score}</TableCell>
                      <TableCell>{evaluation.extracurriculars_score}</TableCell>
                      <TableCell>{evaluation.athletics_score}</TableCell>
                      <TableCell>{evaluation.personal_qualities_score}</TableCell>
                      <TableCell>{evaluation.recommendations_score}</TableCell>
                      <TableCell>{evaluation.university_type === 'ucSystem' ? 'N/A' : evaluation.interview_score}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleExportPDF(evaluation)}
                          title="Export Evaluation as PDF"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-4">
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
