
import { generateEvaluationPdf } from './pdfGenerator';
import { StudentEvaluation, UniversityType } from "../../types";

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

// Re-export components
export * from './pdfGenerator';
export * from './pdfSections';
