
import { StudentEvaluation, UniversityType } from "../types";
import { generateEvaluationPdf } from "./pdfGenerator";

/**
 * Exports evaluation to PDF and triggers download
 */
export const exportEvaluationToPDF = (evaluation: StudentEvaluation) => {
  const universityType = evaluation.university_type as UniversityType || 'ivyLeague';
  
  // Generate PDF document
  const doc = generateEvaluationPdf(evaluation, universityType);
  
  // Save the PDF with student name
  doc.save(`${evaluation.student_name}_US_University_Evaluation.pdf`);
};

// Re-export utility functions for easier access
export * from './displayUtils';
export * from './criteriaUtils';
