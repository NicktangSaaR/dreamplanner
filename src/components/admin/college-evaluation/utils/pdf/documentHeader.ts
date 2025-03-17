
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../../types";
import { getUniversityTypeDisplay } from '../displayUtils';

/**
 * Adds student information and header to PDF document
 */
export const addDocumentHeader = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType) => {
  // Use the evaluation's stored university type if available
  const evalType = evaluation.university_type || universityType;
  
  // Set standard font for entire document
  doc.setFont("Helvetica", "normal");
  
  // Add title (center aligned) with increased top margin to make room for the header
  doc.setFontSize(18);
  doc.setFont("Helvetica", "bold");
  const universityTypeDisplay = getUniversityTypeDisplay(evalType);
  doc.text(`US Undergraduate Admission Evaluation - ${universityTypeDisplay}`, 105, 45, { align: 'center' });
  
  // Add student information with increased top margin
  doc.setFontSize(12);
  doc.setFont("Helvetica", "normal");
  doc.text(`Student Name: ${evaluation.student_name}`, 15, 60);
  doc.text(`Evaluation Date: ${new Date(evaluation.evaluation_date).toLocaleDateString('en-US')}`, 15, 70);
};
