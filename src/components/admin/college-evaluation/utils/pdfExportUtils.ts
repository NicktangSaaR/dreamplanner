
import { StudentEvaluation, UniversityType } from "../types";
import { generateEvaluationPdf } from "./pdf";

/**
 * Exports evaluation to PDF and triggers download
 */
export const exportEvaluationToPDF = (evaluation: StudentEvaluation) => {
  // Ensure we're using the evaluation's university_type if available
  const universityType = evaluation.university_type as UniversityType || 'ivyLeague';
  
  // Generate PDF document with the correct university type
  const doc = generateEvaluationPdf(evaluation, universityType);
  
  // Save the PDF with student name
  doc.save(`${evaluation.student_name}_US_University_Evaluation.pdf`);
};

// Re-export utility functions for easier access
export * from './displayUtils';
export * from './criteriaUtils';
