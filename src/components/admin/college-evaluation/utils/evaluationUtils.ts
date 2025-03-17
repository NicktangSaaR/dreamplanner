
import { EvaluationCriteria, UniversityType } from "../types";

export const calculateTotalScore = (criteria: EvaluationCriteria, universityType?: UniversityType): number => {
  // For Ivy League and Top30 universities, exclude athletics scores of 4 or above
  const shouldCountAthletics = !(
    (universityType === 'ivyLeague' || universityType === 'top30') && 
    criteria.athletics >= 4
  );
  
  // Calculate total by summing all criteria scores
  let totalScore = 0;
  
  // Add each score individually to allow for exclusion
  totalScore += criteria.academics;
  totalScore += criteria.extracurriculars;
  totalScore += criteria.personalQualities;
  totalScore += criteria.recommendations;
  totalScore += criteria.interview;
  
  // Only add athletics if it should be counted
  if (shouldCountAthletics) {
    totalScore += criteria.athletics;
  }
  
  return totalScore;
};

