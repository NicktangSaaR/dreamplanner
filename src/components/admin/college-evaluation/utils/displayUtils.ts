
import { UniversityType } from "../types";
import { sanitizeText } from "./pdf/fontUtils";

/**
 * Get a display label for a criteria based on the university type
 */
export const getCriteriaLabel = (criteriaKey: string, universityType: UniversityType): string => {
  // For UC System, use different labels for some criteria
  if (universityType === 'ucSystem') {
    switch (criteriaKey) {
      case 'athletics_score':
        return 'Talents & Abilities';
      case 'recommendations_score':
        return 'Personal Insight Questions (PIQs)';
      case 'interview_score':
        return 'Not Applicable';
      case 'academic_excellence_score':
        return 'Academic Excellence';
      case 'impact_leadership_score':
        return 'Impact & Leadership';
      case 'unique_narrative_score':
        return 'Unique Personal Narrative';
      default:
        // Use standard labels for other criteria
        return getStandardCriteriaLabel(criteriaKey);
    }
  }
  
  // For all other university types, use standard labels
  return getStandardCriteriaLabel(criteriaKey);
};

/**
 * Helper function to get standard criteria labels
 */
const getStandardCriteriaLabel = (criteriaKey: string): string => {
  switch (criteriaKey) {
    case 'academics_score':
      return 'Academics';
    case 'extracurriculars_score':
      return 'Extracurriculars';
    case 'athletics_score':
      return 'Talents & Abilities';
    case 'personal_qualities_score':
      return 'Personal Qualities';
    case 'recommendations_score':
      return 'Recommendations';
    case 'interview_score':
      return 'Interview';
    case 'total_score':
      return 'Total Score';
    case 'academic_excellence_score':
      return 'Academic Excellence';
    case 'impact_leadership_score':
      return 'Impact & Leadership';
    case 'unique_narrative_score':
      return 'Unique Personal Narrative';
    default:
      return criteriaKey.replace('_score', '').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  }
};

/**
 * Format university type name for display
 */
export const formatUniversityType = (type: UniversityType | string): string => {
  switch (type) {
    case 'ivyLeague':
      return 'Ivy League';
    case 'top30':
      return 'Top 20-30';
    case 'ucSystem':
      return 'UC System';
    default:
      return type.toString();
  }
};

/**
 * Get display name for a university type
 */
export const getUniversityTypeDisplay = (type: UniversityType): string => {
  return formatUniversityType(type);
};
