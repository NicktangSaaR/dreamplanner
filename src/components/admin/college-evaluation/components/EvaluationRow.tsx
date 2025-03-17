
import { TableCell, TableRow } from "@/components/ui/table";
import { StudentEvaluation, UniversityType } from "../types";
import { formatDate } from "../utils/scoringUtils";
import { EvaluationActions } from "./EvaluationActions";
import { EvaluationScoreCell } from "./EvaluationScoreCell";

interface EvaluationRowProps {
  evaluation: StudentEvaluation;
  universityType: UniversityType | string;
}

export const EvaluationRow = ({ evaluation, universityType }: EvaluationRowProps) => {
  const evalType = evaluation.university_type as UniversityType || universityType as UniversityType;
  const isUcSystem = evalType === 'ucSystem';
  
  return (
    <TableRow>
      <TableCell className="font-medium">{evaluation.student_name}</TableCell>
      <TableCell>{formatDate(evaluation.evaluation_date)}</TableCell>
      <TableCell>{evalType}</TableCell>
      <TableCell>
        <EvaluationScoreCell 
          evaluation={evaluation} 
          universityType={universityType} 
        />
      </TableCell>
      <TableCell>{evaluation.academics_score}/6</TableCell>
      <TableCell>{evaluation.extracurriculars_score}/6</TableCell>
      <TableCell>{evaluation.athletics_score}/6</TableCell>
      <TableCell>{evaluation.personal_qualities_score}/6</TableCell>
      <TableCell>{evaluation.recommendations_score}/6</TableCell>
      {!isUcSystem && <TableCell>{evaluation.interview_score}/6</TableCell>}
      <TableCell>
        <EvaluationActions evaluation={evaluation} />
      </TableCell>
    </TableRow>
  );
};
