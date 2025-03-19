
import { StudentEvaluation, UniversityType } from "../types";
import { getCoreTotalScore, getTraditionalTotalScore, getMaxPossibleScore, hasCoreCriteria } from "../utils/scoringUtils";

interface EvaluationScoreCellProps {
  evaluation: StudentEvaluation;
  universityType: UniversityType | string;
}

export const EvaluationScoreCell = ({ evaluation, universityType }: EvaluationScoreCellProps) => {
  const evalType = evaluation.university_type as UniversityType || universityType as UniversityType;
  
  // Check if core criteria exist in this evaluation
  const hasCoreScores = hasCoreCriteria(evaluation);
  
  // Get the core and traditional scores
  const coreScore = getCoreTotalScore(evaluation);
  const traditionalScore = getTraditionalTotalScore(evaluation, evalType);
  
  // Calculate number of criteria for average
  const coreCount = hasCoreScores ? 3 : 0; // 3 core criteria if they exist
  const traditionalCount = evalType === 'ucSystem' ? 5 : 6; // 5 criteria for UC, 6 for others
  
  // Calculate averages (rounded to 2 decimal places)
  const coreAverage = coreCount > 0 ? Math.round((coreScore / coreCount) * 100) / 100 : 0;
  const traditionalAverage = Math.round((traditionalScore / traditionalCount) * 100) / 100;
  
  return (
    <div className="flex flex-col space-y-1">
      {hasCoreScores && (
        <div className="text-sm">
          <span className="font-semibold">Core:</span> {coreAverage}
        </div>
      )}
      <div className="text-sm">
        <span className="font-semibold">Trad:</span> {traditionalAverage}
      </div>
    </div>
  );
};
