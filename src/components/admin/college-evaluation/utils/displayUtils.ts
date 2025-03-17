
import { UniversityType } from "../types";

/**
 * Converts university type to human-readable display text
 */
export const getUniversityTypeDisplay = (type?: UniversityType): string => {
  if (!type) return "美国大学";
  
  switch (type) {
    case 'ivyLeague':
      return "常青藤大学";
    case 'top30':
      return "Top 20-30 大学";
    case 'ucSystem':
      return "UC系统大学";
    default:
      return "美国大学";
  }
};

/**
 * Gets appropriate criteria label based on university type
 */
export const getCriteriaLabel = (key: string, universityType?: UniversityType): string => {
  if (universityType === 'ucSystem') {
    switch (key) {
      case 'recommendations_score':
        return 'Personal Insight Questions (PIQs)';
      case 'athletics_score':
        return 'Personal Talents';
      case 'interview_score':
        return 'Not Applicable for UC System';
      default:
        break;
    }
  }
  
  switch (key) {
    case 'academics_score':
      return 'Academics';
    case 'extracurriculars_score':
      return 'Extracurriculars';
    case 'athletics_score':
      return 'Athletics';
    case 'personal_qualities_score':
      return 'Personal Qualities';
    case 'recommendations_score':
      return 'Recommendations';
    case 'interview_score':
      return 'Interview';
    case 'total_score':
      return 'Total Score';
    default:
      return key;
  }
};

/**
 * Converts database column name to criteria key
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
    default:
      return '';
  }
};
