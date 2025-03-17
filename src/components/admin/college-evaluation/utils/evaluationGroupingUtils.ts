
import { StudentEvaluation, UniversityType } from "../types";

/**
 * Group evaluations by university type
 */
export const groupEvaluationsByType = (evals: StudentEvaluation[] | null | undefined) => {
  if (!evals) return {};
  
  return evals.reduce<Record<string, StudentEvaluation[]>>((groups, evaluation) => {
    const type = evaluation.university_type || 'ivyLeague';
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(evaluation);
    return groups;
  }, {});
};

/**
 * Get unique university types from evaluations
 */
export const getUniqueUniversityTypes = (evaluations: StudentEvaluation[] | null | undefined): UniversityType[] => {
  if (!evaluations) return [];
  
  return Array.from(new Set(evaluations.map(e => e.university_type || 'ivyLeague'))) as UniversityType[];
};
