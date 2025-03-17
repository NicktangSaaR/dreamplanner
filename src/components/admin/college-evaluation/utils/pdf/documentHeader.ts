
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../../types";
import { getUniversityTypeDisplay } from '../displayUtils';

/**
 * Adds student information and header to PDF document
 */
export const addDocumentHeader = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType) => {
  // Use the evaluation's stored university type if available
  const evalType = evaluation.university_type || universityType;
  
  // Set Times New Roman font for entire document
  doc.setFont("times", "normal");
  
  // Add title
  doc.setFontSize(18);
  const universityTypeDisplay = getUniversityTypeDisplay(evalType);
  doc.text(`US Undergraduate Admission Evaluation - ${universityTypeDisplay}`, 15, 20);
  
  // Add student information
  doc.setFontSize(12);
  doc.text(`Student Name: ${evaluation.student_name}`, 15, 30);
  doc.text(`Evaluation Date: ${new Date(evaluation.evaluation_date).toLocaleDateString('en-US')}`, 15, 40);
};
