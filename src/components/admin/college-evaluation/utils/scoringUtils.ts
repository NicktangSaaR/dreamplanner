
import { StudentEvaluation, UniversityType } from "../types";

/**
 * Calculates maximum possible score for a specific evaluation
 */
export const getMaxPossibleScore = (evaluation: StudentEvaluation, universityType: UniversityType | string): number => {
  const evalType = evaluation.university_type as UniversityType || universityType as UniversityType;
  
  let maxScore = 36;
  
  if (evalType === 'ucSystem') {
    maxScore = 30;
  }
  
  const isAthleticsExcluded = 
    (evalType === 'ivyLeague' || evalType === 'top30') && 
    evaluation.athletics_score >= 4;
  
  if (isAthleticsExcluded) {
    maxScore -= 6;
  }
  
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
  
  let criteriaCount = 6;
  
  if (evalType === 'ucSystem') {
    criteriaCount = 5;
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
