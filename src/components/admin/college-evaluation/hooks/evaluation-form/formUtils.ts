
import { ScoreValue } from "../../types";

/**
 * Ensures that a score value is valid (between 1 and 6)
 * and returns it as a ScoreValue type
 */
export const ensureValidScore = (score: number | undefined): ScoreValue => {
  if (score === undefined) return 3 as ScoreValue;
  return (Math.min(Math.max(1, score), 6)) as ScoreValue;
};

/**
 * Creates initial form values from an existing evaluation or default values
 */
export const createInitialFormValues = (existingEvaluation?: any) => {
  return {
    criteria: {
      academics: ensureValidScore(existingEvaluation?.academics_score),
      extracurriculars: ensureValidScore(existingEvaluation?.extracurriculars_score),
      athletics: ensureValidScore(existingEvaluation?.athletics_score),
      personalQualities: ensureValidScore(existingEvaluation?.personal_qualities_score),
      recommendations: ensureValidScore(existingEvaluation?.recommendations_score),
      interview: ensureValidScore(existingEvaluation?.interview_score),
      // Core admission factors
      academicExcellence: ensureValidScore(existingEvaluation?.academic_excellence_score),
      impactLeadership: ensureValidScore(existingEvaluation?.impact_leadership_score),
      uniqueNarrative: ensureValidScore(existingEvaluation?.unique_narrative_score)
    },
    comments: existingEvaluation?.comments || ""
  };
};
