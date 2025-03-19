
import { UniversityType } from "../../types";
import { getCriteriaLabel } from '../displayUtils';

/**
 * Converts column name to criteria key
 */
export const getCriteriaKeyFromColumn = (columnName: string): string => {
  switch (columnName) {
    case 'academics_score':
      return 'academics';
    case 'extracurriculars_score':
      return 'extracurriculars';
    case 'athletics_score':
      return 'athletics';
    case 'personal_qualities_score':
      return 'personalQualities';
    case 'recommendations_score':
      return 'recommendations';
    case 'interview_score':
      return 'interview';
    case 'academic_excellence_score':
      return 'academicExcellence';
    case 'impact_leadership_score':
      return 'impactLeadership';
    case 'unique_narrative_score':
      return 'uniqueNarrative';
    default:
      return '';
  }
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
    
    // Get label
    const label = getCriteriaLabel(column, universityType);
    return [label, score];
  }).filter(Boolean); // Remove null entries
};
