
import { StudentEvaluation, UniversityType } from "../types";
import { generateEvaluationPdf } from "./pdf";

/**
 * Exports evaluation to PDF and triggers download
 */
export const exportEvaluationToPDF = async (evaluation: StudentEvaluation) => {
  // Ensure we're using the evaluation's university_type if available
  const universityType = evaluation.university_type as UniversityType || 'ivyLeague';
  
  try {
    // Generate PDF document with the correct university type and await it
    const doc = await generateEvaluationPdf(evaluation, universityType);
    
    // Save the PDF with student name
    doc.save(`${evaluation.student_name}_US_University_Evaluation.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};

// Re-export utility functions for easier access
export * from './displayUtils';
export * from './criteriaUtils';
