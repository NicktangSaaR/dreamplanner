
import { StudentEvaluation, UniversityType } from "../types";

/**
 * Calculates maximum possible score for a specific evaluation
 */
export const getMaxPossibleScore = (evaluation: StudentEvaluation, universityType: UniversityType | string): number => {
  const evalType = evaluation.university_type as UniversityType || universityType as UniversityType;
  
  // Base score calculation (traditional criteria)
  let maxScore = 36; // Default: 6 criteria × 6 points
  
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
  
  // Add maximum points for the three admission factors (3 criteria × 6 points = 18)
  maxScore += 18;
  
  return maxScore;
};

/**
 * Format score as actual/maximum
 */
export const formatScore = (score: number, maxScore: number): string => {
  return `${score}/${maxScore}`;
};

/**
 * Calculate and format average score out of 6
 */
export const formatAverageScore = (totalScore: number, universityType: UniversityType | string): string => {
  const evalType = universityType as UniversityType;
  
  // Count number of criteria including the three new admission factors
  let criteriaCount = 9; // Base: 6 traditional + 3 admission factors
  
  // For UC System, we don't use interview (so 5 traditional + 3 admission factors = 8)
  if (evalType === 'ucSystem') {
    criteriaCount = 8;
  }
  
  // If athletics is excluded for Ivy League or Top30 (so 5 traditional + 3 admission factors = 8)
  const hasAthleticsExcluded = (evalType === 'ivyLeague' || evalType === 'top30');
  if (hasAthleticsExcluded) {
    criteriaCount = 8;
  }
  
  const average = ((totalScore / criteriaCount)).toFixed(2);
  
  return `${average}/6`;
};

/**
 * Format date to localized string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US');
};
