
import { StudentEvaluation, UniversityType } from "../types";

/**
 * Get maximum possible score for a university type
 */
export function getMaxPossibleScore(evaluation: StudentEvaluation, universityType: UniversityType): number {
  // Base score is always 5 categories * 6 maximum points
  let maxScore = 5 * 6;
  
  // For non-UC schools, add interview score (6 more points)
  if (universityType !== 'ucSystem') {
    maxScore += 6;
  }
  
  // Add the core evaluation criteria (3 fields * 6 max points)
  // Check if the core scores exist in the evaluation
  if (hasCoreCriteria(evaluation)) {
    maxScore += 3 * 6;
  }
  
  return maxScore;
}

/**
 * Check if the evaluation has core criteria scores
 */
export function hasCoreCriteria(evaluation: StudentEvaluation): boolean {
  return (
    typeof evaluation.academic_excellence_score !== 'undefined' &&
    typeof evaluation.impact_leadership_score !== 'undefined' &&
    typeof evaluation.unique_narrative_score !== 'undefined'
  );
}

/**
 * Get the total score for core factors only
 */
export function getCoreTotalScore(evaluation: StudentEvaluation): number {
  // If core scores don't exist, return 0
  if (!hasCoreCriteria(evaluation)) {
    return 0;
  }
  
  // Sum the core scores
  return (
    (evaluation.academic_excellence_score || 0) +
    (evaluation.impact_leadership_score || 0) +
    (evaluation.unique_narrative_score || 0)
  );
}

/**
 * Get the total score for traditional factors only
 */
export function getTraditionalTotalScore(evaluation: StudentEvaluation, universityType: UniversityType): number {
  let traditionalScores = [
    evaluation.academics_score,
    evaluation.extracurriculars_score,
    evaluation.athletics_score,
    evaluation.personal_qualities_score,
    evaluation.recommendations_score
  ];
  
  // Add interview score for non-UC System schools
  if (universityType !== 'ucSystem') {
    traditionalScores.push(evaluation.interview_score);
  }
  
  // Sum all scores
  return traditionalScores.reduce((sum, score) => sum + (score || 0), 0);
}
