
import { EvaluationCriteria } from "../types";

export const calculateTotalScore = (criteria: EvaluationCriteria): number => {
  // Note: Lower score is better in Harvard's system (1 is best, 6 is worst)
  return Object.values(criteria).reduce((sum, score) => sum + score, 0);
};
