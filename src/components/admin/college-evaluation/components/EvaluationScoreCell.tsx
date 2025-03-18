
import { StudentEvaluation, UniversityType } from "../types";
import { getCoreTotalScore, getTraditionalTotalScore, getMaxPossibleScore, hasCoreCriteria } from "../utils/scoringUtils";

interface EvaluationScoreCellProps {
  evaluation: StudentEvaluation;
  universityType: UniversityType | string;
}

export const EvaluationScoreCell = ({ evaluation, universityType }: EvaluationScoreCellProps) => {
  const evalType = evaluation.university_type as UniversityType || universityType as UniversityType;
  const maxScore = getMaxPossibleScore(evaluation, evalType);
  
  // Check if core criteria exist in this evaluation
  const hasCoreScores = hasCoreCriteria(evaluation);
  
  // Get the core and traditional separate scores
  const coreScore = getCoreTotalScore(evaluation);
  const traditionalScore = getTraditionalTotalScore(evaluation, evalType);
  
  // Calculate max possible scores
  const maxCoreScore = hasCoreScores ? 18 : 0; // 3 criteria x 6 points max each
  const maxTraditionalScore = maxScore - maxCoreScore;
  
  return (
    <div className="flex flex-col space-y-1">
      {hasCoreScores && (
        <div className="text-sm">
          <span className="font-semibold">Core:</span> {coreScore}/{maxCoreScore}
        </div>
      )}
      <div className="text-sm">
        <span className="font-semibold">Trad:</span> {traditionalScore}/{maxTraditionalScore}
      </div>
      <div className="text-sm font-medium">
        <span className="font-semibold">Total:</span> {evaluation.total_score}/{maxScore}
      </div>
    </div>
  );
};
