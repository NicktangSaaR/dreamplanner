
import { StudentEvaluation, UniversityType } from "../../types";
import { generateEvaluationPdf } from './pdfGenerator';
import { addDocumentHeader } from './documentHeader';
import { addScoresTable } from './scoresTable';
import { addCriteriaDescriptions } from './criteriaUtils';
import { addCommentsSection } from './commentsSection';

/**
 * Exports evaluation to PDF and triggers download
 */
export const exportEvaluationToPDF = (evaluation: StudentEvaluation) => {
  const universityType = evaluation.university_type as UniversityType || 'ivyLeague';
  
  try {
    // Generate PDF document
    const doc = generateEvaluationPdf(evaluation, universityType);
    
    // Save the PDF with student name
    doc.save(`${evaluation.student_name}_US_University_Evaluation.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
  }
};

/**
 * Creates a PDF preview and returns it as a data URL
 */
export const previewEvaluationPDF = (evaluation: StudentEvaluation): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const universityType = evaluation.university_type as UniversityType || 'ivyLeague';
      
      // Generate PDF document
      const doc = generateEvaluationPdf(evaluation, universityType);
      
      // Convert to data URL for preview
      const dataUrl = doc.output('datauristring');
      resolve(dataUrl);
    } catch (error) {
      console.error("Error previewing PDF:", error);
      reject(error);
    }
  });
};

// Re-export components for easier access
export { 
  generateEvaluationPdf,
  addDocumentHeader,
  addScoresTable,
  addCriteriaDescriptions,
  addCommentsSection
};
