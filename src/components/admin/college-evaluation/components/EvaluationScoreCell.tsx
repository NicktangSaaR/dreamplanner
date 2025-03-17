
import { StudentEvaluation, UniversityType } from "../types";
import { formatAverageScore, formatScore, getMaxPossibleScore, getCoreTotalScore, getTraditionalTotalScore } from "../utils/scoringUtils";

interface EvaluationScoreCellProps {
  evaluation: StudentEvaluation;
  universityType: UniversityType | string;
}

export const EvaluationScoreCell = ({ evaluation, universityType }: EvaluationScoreCellProps) => {
  const evalType = evaluation.university_type as UniversityType || universityType as UniversityType;
  const maxScore = getMaxPossibleScore(evaluation, evalType);
  
  // Get the core and traditional separate scores
  const coreScore = getCoreTotalScore(evaluation);
  const traditionalScore = getTraditionalTotalScore(evaluation, evalType);
  
  return (
    <div>
      <div className="font-semibold">
        {formatScore(evaluation.total_score, maxScore)}
      </div>
      <div className="text-xs text-gray-500">
        Core: {coreScore}/18 | Trad: {traditionalScore}/{maxScore - 18}
      </div>
    </div>
  );
};
