
import { UniversityType } from "../types";
import { getUniversityCriteriaDescriptions } from "../evaluationConstants";
import { getCriteriaLabel, getCriteriaKeyFromColumn } from "./displayUtils";

/**
 * Gets criteria description for a specific score
 */
export const getCriteriaDescription = (
  criteriaKey: string,
  score: number,
  universityType: UniversityType
): string => {
  const descriptions = getUniversityCriteriaDescriptions(universityType);
  return descriptions[criteriaKey]?.[score] || "";
};

/**
 * Prepares table rows for PDF export based on evaluation and university type
 */
export const preparePdfTableRows = (evaluation: any, universityType: UniversityType) => {
  // Define criteria columns to include
  const criteriaColumns = [
    'academics_score',
    'extracurriculars_score',
    'athletics_score',
    'personal_qualities_score',
    'recommendations_score'
  ];
  
  // Only Include Interview For Non-UC System
  if (universityType !== 'ucSystem') {
    criteriaColumns.push('interview_score');
  }
  
  // Map columns to table rows
  return criteriaColumns.map(column => {
    const score = evaluation[column];
    // Skip interview for UC System
    if (universityType === 'ucSystem' && column === 'interview_score') {
      return null;
    }
    
    // Fix: Import displayUtils at the top instead of using require
    return [getCriteriaLabel(column, universityType), score];
  }).filter(Boolean); // Remove null entries
};
