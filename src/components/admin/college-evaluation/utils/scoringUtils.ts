
import { StudentEvaluation, UniversityType } from "../types";

/**
 * Checks if the evaluation has core criteria fields
 */
export const hasCoreCriteria = (evaluation: StudentEvaluation): boolean => {
  return evaluation.academic_excellence_score !== undefined 
    && evaluation.impact_leadership_score !== undefined
    && evaluation.unique_narrative_score !== undefined;
};

/**
 * Gets the total score for core admission factors
 */
export const getCoreTotalScore = (evaluation: StudentEvaluation): number => {
  // If the core scores don't exist, return 0
  if (!hasCoreCriteria(evaluation)) {
    return 0;
  }
  
  // Sum core scores (or default to 3 if missing)
  return (evaluation.academic_excellence_score || 3) 
    + (evaluation.impact_leadership_score || 3) 
    + (evaluation.unique_narrative_score || 3);
};

/**
 * Gets the total score for traditional criteria
 */
export const getTraditionalTotalScore = (evaluation: StudentEvaluation, universityType: UniversityType): number => {
  let totalScore = 0;
  
  // Add all traditional scores
  totalScore += evaluation.academics_score;
  totalScore += evaluation.extracurriculars_score;
  totalScore += evaluation.personal_qualities_score;
  totalScore += evaluation.recommendations_score;
  
  // For Ivy League and Top30, don't count athletics if score is 4 or higher
  const isAthleticsExcluded = (universityType === 'ivyLeague' || universityType === 'top30') 
    && evaluation.athletics_score >= 4;
    
  if (!isAthleticsExcluded) {
    totalScore += evaluation.athletics_score;
  }
  
  // For non-UC System universities, include interview score
  if (universityType !== 'ucSystem') {
    totalScore += evaluation.interview_score;
  }
  
  return totalScore;
};

/**
 * Gets the maximum possible score for this evaluation
 */
export const getMaxPossibleScore = (evaluation: StudentEvaluation, universityType: UniversityType): number => {
  // Start with base max score: 6 traditional criteria x 6 points each = 36
  let maxScore = 36;
  
  // For UC System, we don't count interview (5 criteria x 6 points = 30)
  if (universityType === 'ucSystem') {
    maxScore = 30;
  }
  
  // For Ivy League and Top30, exclude athletics if it's 4 or higher
  const isAthleticsExcluded = (universityType === 'ivyLeague' || universityType === 'top30') 
    && evaluation.athletics_score >= 4;
    
  if (isAthleticsExcluded) {
    maxScore -= 6; // Reduce max by 6 points (the max value of athletics)
  }
  
  // If core criteria exist, add their max possible score (3 criteria x 6 points each = 18)
  if (hasCoreCriteria(evaluation)) {
    maxScore += 18;
  }
  
  return maxScore;
};
