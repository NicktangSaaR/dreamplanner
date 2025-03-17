
import { StudentEvaluation, UniversityType } from "../types";
import { formatAverageScore, formatScore, getMaxPossibleScore } from "../utils/scoringUtils";

interface EvaluationScoreCellProps {
  evaluation: StudentEvaluation;
  universityType: UniversityType | string;
}

export const EvaluationScoreCell = ({ evaluation, universityType }: EvaluationScoreCellProps) => {
  const maxScore = getMaxPossibleScore(evaluation, universityType);
  
  return (
    <div>
      <div className="font-semibold">
        {formatScore(evaluation.total_score, maxScore)}
      </div>
      <div className="text-xs text-gray-500">
        Avg: {formatAverageScore(evaluation.total_score, universityType)}
      </div>
    </div>
  );
};
