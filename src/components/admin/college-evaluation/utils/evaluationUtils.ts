
import { EvaluationCriteria, UniversityType } from "../types";

/**
 * Calculate total evaluation score based on criteria scores
 * Lower score is better (1 is best, 6 is worst)
 */
export const calculateTotalScore = (criteria: EvaluationCriteria, universityType: UniversityType): number => {
  console.log("Calculating score for university type:", universityType);
  
  // First convert all scores to an array for easier manipulation
  const scoreArray = [
    criteria.academics,
    criteria.extracurriculars,
    criteria.athletics,
    criteria.personalQualities,
    criteria.recommendations,
    criteria.interview
  ];
  
  // For UC System - don't count interview scores
  if (universityType === 'ucSystem') {
    // Remove interview score (last item)
    scoreArray.pop();
  }
  
  // For Ivy League and Top30 - don't count athletics if score is 4 or higher (not competitive)
  if ((universityType === 'ivyLeague' || universityType === 'top30') && criteria.athletics >= 4) {
    // Find index of athletics (it's at position 2 in our array) and remove it
    scoreArray.splice(2, 1);
  }
  
  // Sum all remaining scores
  const totalScore = scoreArray.reduce((sum, score) => sum + score, 0);
  
  console.log("Total score:", totalScore, "from scores:", scoreArray);
  return totalScore;
};
