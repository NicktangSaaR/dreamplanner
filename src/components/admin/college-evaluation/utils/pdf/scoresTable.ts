
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
  
  // Calculate core score
  const coreScore = getCoreTotalScore(evaluation);
  
  // Add core total score
  admissionFactorsRows.push(['Core Total Score', `${coreScore}/18`]);
  
  // Calculate max possible score for traditional criteria
  let traditionalMaxScore = 36; // Default: 6 criteria × 6 points
  
  // For UC System, we don't count interview (5 criteria × 6 points = 30)
  if (evalType === 'ucSystem') {
    traditionalMaxScore = 30;
  }
  
  // Calculate traditional score
  const traditionalScore = getTraditionalTotalScore(evaluation, evalType);
  
  // Add traditional total score to traditional rows
  traditionalTableRows.push(['Traditional Total Score', `${traditionalScore}/${traditionalMaxScore}`]);
  
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
