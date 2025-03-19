
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../../types";
import { addCoreAdmissionFactorsDescriptions, addTraditionalCriteriaDescriptions } from './criteriaDescriptions';

/**
 * Adds criteria descriptions to the PDF document
 */
export const addCriteriaDescriptions = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType, startY: number) => {
  // Start position for criteria descriptions
  let currentY = startY + 10; // Add some spacing after the table
  
  // Add core admission factors descriptions
  currentY = addCoreAdmissionFactorsDescriptions(doc, evaluation, universityType, currentY);
  
  // Add traditional criteria descriptions
  currentY = addTraditionalCriteriaDescriptions(doc, evaluation, universityType, currentY);
  
  return currentY;
};

// Re-export functions from other files to maintain API compatibility
export { getCriteriaKeyFromColumn, preparePdfTableRows } from './criteriaKeyMapping';
