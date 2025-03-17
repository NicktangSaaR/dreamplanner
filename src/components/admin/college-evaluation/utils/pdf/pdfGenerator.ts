
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../../types";
import { addDocumentHeader } from './documentHeader'; 
import { addScoresTable } from './scoresTable';
import { addCriteriaDescriptions } from './criteriaUtils';
import { addCommentsSection } from './commentsSection';

/**
 * Generates and returns a PDF document for the evaluation
 */
export const generateEvaluationPdf = (evaluation: StudentEvaluation, universityType: UniversityType): jsPDF => {
  // Create PDF document with Times New Roman font
  const doc = new jsPDF();
  
  // Add special note about athletics scoring for Ivy League and Top30
  const athleticsScore = evaluation.athletics_score;
  const isAthleticsExcluded = (universityType === 'ivyLeague' || universityType === 'top30') && athleticsScore >= 4;
  
  // Add document sections
  addDocumentHeader(doc, evaluation, universityType);
  
  // Add special note about athletics scoring if applicable
  if (isAthleticsExcluded) {
    doc.setFontSize(10);
    doc.setFont("times", "italic");
    doc.text('* Note: For Ivy League and Top20-30 universities, athletics scores of 4 or higher are not included in the total score.', 15, 45);
  }
  
  const afterTableY = addScoresTable(doc, evaluation, universityType);
  const afterDescriptionsY = addCriteriaDescriptions(doc, evaluation, universityType, afterTableY);
  addCommentsSection(doc, evaluation, afterDescriptionsY);
  
  return doc;
};
