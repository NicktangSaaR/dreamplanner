
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { StudentEvaluation, UniversityType } from "../types";
import { exportEvaluationToPDF } from "../utils/pdfExportUtils";

interface EvaluationTableProps {
  evaluations: StudentEvaluation[];
  universityType: UniversityType | string;
}

export const EvaluationTable = ({ evaluations, universityType }: EvaluationTableProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
  };

  const handleExportPDF = (evaluation: StudentEvaluation) => {
    // Add default university type if not present
    const evaluationWithType = {
      ...evaluation,
      university_type: evaluation.university_type || universityType as UniversityType || 'ivyLeague'
    };
    exportEvaluationToPDF(evaluationWithType);
  };

  // Function to get appropriate column label based on university type
  const getColumnLabel = (key: string, uniType?: UniversityType): string => {
    if (uniType === 'ucSystem') {
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
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student Name</TableHead>
            <TableHead>Evaluation Date</TableHead>
            <TableHead>Total Score</TableHead>
            <TableHead>Academics</TableHead>
            <TableHead>Extracurriculars</TableHead>
            <TableHead>{universityType === 'ucSystem' ? 'Personal Talents' : 'Athletics'}</TableHead>
            <TableHead>Personal Qualities</TableHead>
            <TableHead>{universityType === 'ucSystem' ? 'Personal Insight Questions (PIQs)' : 'Recommendations'}</TableHead>
            {universityType !== 'ucSystem' && <TableHead>Interview</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((evaluation) => (
            <TableRow key={evaluation.id}>
              <TableCell className="font-medium">{evaluation.student_name}</TableCell>
              <TableCell>{formatDate(evaluation.evaluation_date)}</TableCell>
              <TableCell className="font-semibold">{evaluation.total_score}</TableCell>
              <TableCell>{evaluation.academics_score}</TableCell>
              <TableCell>{evaluation.extracurriculars_score}</TableCell>
              <TableCell>{evaluation.athletics_score}</TableCell>
              <TableCell>{evaluation.personal_qualities_score}</TableCell>
              <TableCell>{evaluation.recommendations_score}</TableCell>
              {universityType !== 'ucSystem' && <TableCell>{evaluation.interview_score}</TableCell>}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
