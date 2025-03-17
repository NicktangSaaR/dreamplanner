
import { UniversityType } from "../types";

/**
 * Get display name for university type
 */
export const getUniversityTypeDisplay = (type: string | UniversityType): string => {
  switch (type) {
    case 'ivyLeague':
      return "Ivy League University";
    case 'top30':
      return "Top 20-30 University";
    case 'ucSystem':
      return "UC System University";
    case 'all':
      return "All Universities";
    default:
      return "US University";
  }
};

/**
 * Get column label based on university type
 */
export const getCriteriaLabel = (key: string, universityType: UniversityType | string): string => {
  if (universityType === 'ucSystem') {
    switch(key) {
      case 'recommendations_score':
        return "PIQs Score";
      case 'athletics_score':
        return "Personal Talents Score";
      case 'interview_score':
        return "N/A";
      case 'total_score':
        return "Total Score";
      case 'academics_score':
        return "Academics Score";
      case 'extracurriculars_score':
        return "Extracurriculars Score";
      case 'personal_qualities_score':
        return "Personal Qualities Score";
      default:
        return key.replace('_score', '').replace(/_/g, ' ');
    }
  }
  
  switch(key) {
    case 'total_score':
      return "Total Score";
    case 'academics_score':
      return "Academics Score";
    case 'extracurriculars_score':
      return "Extracurriculars Score";
    case 'athletics_score':
      return "Athletics Score";
    case 'personal_qualities_score':
      return "Personal Qualities Score";
    case 'recommendations_score':
      return "Recommendations Score";
    case 'interview_score':
      return "Interview Score";
    default:
      return key.replace('_score', '').replace(/_/g, ' ');
  }
};
