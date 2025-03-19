
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentEvaluation, UniversityType } from "../../types";
import { getCriteriaLabel } from '../displayUtils';
import { preparePdfTableRows } from './criteriaKeyMapping';
import { getCoreTotalScore, getTraditionalTotalScore } from '../scoringUtils';
import { applyDocumentFont, sanitizeText } from './fontUtils';

/**
 * Adds scores table to PDF document
 */
export const addScoresTable = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType) => {
  // Use the evaluation's stored university type if available
  const evalType = evaluation.university_type || universityType;
  
  // Get table rows for traditional criteria
  const traditionalTableRows = preparePdfTableRows(evaluation, evalType);
  
  // Handle core admission factors - use default values if not present in the evaluation
  const admissionFactorsRows = [
    ['Academic Excellence', evaluation.academic_excellence_score || 3],
    ['Impact & Leadership', evaluation.impact_leadership_score || 3],
    ['Unique Personal Narrative', evaluation.unique_narrative_score || 3],
  ];
  
  // Calculate core score and average
  const coreScore = getCoreTotalScore(evaluation);
  const coreCount = 3; // Always 3 core criteria
  const coreAverage = Math.round((coreScore / coreCount) * 100) / 100;
  
  // Add core average score
  admissionFactorsRows.push(['Core Average Score', coreAverage]);
  
  // Calculate traditional criteria count
  const traditionalCount = evalType === 'ucSystem' ? 5 : 6; // 5 criteria for UC, 6 for others
  
  // Calculate traditional score and average
  const traditionalScore = getTraditionalTotalScore(evaluation, evalType);
  const traditionalAverage = Math.round((traditionalScore / traditionalCount) * 100) / 100;
  
  // Add traditional average score to traditional rows
  traditionalTableRows.push(['Traditional Average Score', traditionalAverage]);
  
  // Add admission factors table with appropriate labels
  autoTable(doc, {
    startY: 90,
    head: [['Core Admission Factors', 'Score (1 is highest, 6 is lowest)']],
    body: admissionFactorsRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [99, 102, 241], // Updated to match website primary color #6366F1
      textColor: [255, 255, 255],
      font: 'helvetica',
      fontStyle: 'bold' 
    },
    styles: {
      font: 'helvetica',
      fontStyle: 'normal'
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 40 } // Add top margin to ensure proper spacing from header
  });
  
  // Get the Y position after the admission factors table
  const admissionTableEndY = (doc as any).lastAutoTable?.finalY || 130;
  
  // Add traditional criteria table
  autoTable(doc, {
    startY: admissionTableEndY + 10, // Add some space between tables
    head: [['Traditional Evaluation Criteria', 'Score (1 is highest, 6 is lowest)']],
    body: traditionalTableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [99, 102, 241], // Updated to match website primary color #6366F1
      textColor: [255, 255, 255],
      font: 'helvetica',
      fontStyle: 'bold' 
    },
    styles: {
      font: 'helvetica',
      fontStyle: 'normal'
    },
    alternateRowStyles: { fillColor: [240, 240, 240] }
  });
  
  // Return the final Y position
  return (doc as any).lastAutoTable?.finalY || 250;
};
