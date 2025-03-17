
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
    // Use the evaluation's stored university_type if available, otherwise fall back to the current tab's type
    const evalUniversityType = evaluation.university_type || universityType as UniversityType || 'ivyLeague';
    
    // Ensure university_type is included in the evaluation
    const evaluationWithType = {
      ...evaluation,
      university_type: evalUniversityType
    };
    
    exportEvaluationToPDF(evaluationWithType);
  };

  // Function to get appropriate column label based on university type
  const getColumnLabel = (key: string, evaluation: StudentEvaluation): string => {
    // Use the evaluation's stored university type if available
    const evalType = evaluation.university_type as UniversityType || universityType as UniversityType;
    
    if (evalType === 'ucSystem') {
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

  // Calculate maximum possible score for a specific evaluation
  const getMaxPossibleScore = (evaluation: StudentEvaluation): number => {
    // Use evaluation's stored university type if available
    const evalType = evaluation.university_type as UniversityType || universityType as UniversityType;
    
    // Standard max is 6 criteria × 6 points = 36
    let maxScore = 36;
    
    // For UC System, we don't count interview (5 criteria × 6 points = 30)
    if (evalType === 'ucSystem') {
      maxScore = 30;
    }
    
    // For Ivy League and Top30, exclude athletics if it's 4 or higher
    const isAthleticsExcluded = 
      (evalType === 'ivyLeague' || evalType === 'top30') && 
      evaluation.athletics_score >= 4;
    
    if (isAthleticsExcluded) {
      maxScore -= 6; // Reduce max by 6 points (the max value of athletics)
    }
    
    return maxScore;
  };

  // Format score as actual/maximum
  const formatScore = (score: number, maxScore: number): string => {
    return `${score}/${maxScore}`;
  };

  // Check if any evaluation is UC System
  const hasUcSystemEval = evaluations.some(e => (e.university_type || universityType) === 'ucSystem');

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
            <TableHead>Athletics/Talents</TableHead>
            <TableHead>Personal Qualities</TableHead>
            <TableHead>Recommendations/PIQs</TableHead>
            {!hasUcSystemEval && <TableHead>Interview</TableHead>}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {evaluations.map((evaluation) => {
            const maxScore = getMaxPossibleScore(evaluation);
            const evalType = evaluation.university_type as UniversityType || universityType as UniversityType;
            const isUcSystem = evalType === 'ucSystem';
            
            return (
              <TableRow key={evaluation.id}>
                <TableCell className="font-medium">{evaluation.student_name}</TableCell>
                <TableCell>{formatDate(evaluation.evaluation_date)}</TableCell>
                <TableCell className="font-semibold">{formatScore(evaluation.total_score, maxScore)}</TableCell>
                <TableCell>{evaluation.academics_score}/6</TableCell>
                <TableCell>{evaluation.extracurriculars_score}/6</TableCell>
                <TableCell>{evaluation.athletics_score}/6</TableCell>
                <TableCell>{evaluation.personal_qualities_score}/6</TableCell>
                <TableCell>{evaluation.recommendations_score}/6</TableCell>
                {!isUcSystem && <TableCell>{evaluation.interview_score}/6</TableCell>}
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
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
