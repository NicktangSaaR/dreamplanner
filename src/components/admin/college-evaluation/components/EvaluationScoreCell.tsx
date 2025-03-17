
import { StudentEvaluation, UniversityType } from "../types";
import { getCoreTotalScore, getTraditionalTotalScore, getMaxPossibleScore } from "../utils/scoringUtils";

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
    <div className="flex items-center space-x-3">
      <div className="text-sm">
        <span className="font-semibold">Core:</span> {coreScore}/18
      </div>
      <div className="text-sm">
        <span className="font-semibold">Trad:</span> {traditionalScore}/{maxScore - 18}
      </div>
    </div>
  );
};
