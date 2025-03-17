
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentEvaluation, UniversityType } from "../../types";
import { getCriteriaLabel } from '../displayUtils';
import { preparePdfTableRows } from './criteriaUtils';

/**
 * Adds scores table to PDF document
 */
export const addScoresTable = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType) => {
  // Use the evaluation's stored university type if available
  const evalType = evaluation.university_type || universityType;
  
  // Get table rows for traditional criteria
  const traditionalTableRows = preparePdfTableRows(evaluation, evalType);
  
  // Check if athletics score should be excluded for Ivy League and Top30
  const athleticsScore = evaluation.athletics_score;
  const isAthleticsExcluded = (evalType === 'ivyLeague' || evalType === 'top30') && athleticsScore >= 4;
  
  // If athletics is excluded, add a note to the athletics row
  if (isAthleticsExcluded) {
    const athleticsIndex = traditionalTableRows.findIndex(row => row[0] === getCriteriaLabel('athletics_score', evalType));
    if (athleticsIndex !== -1) {
      traditionalTableRows[athleticsIndex][1] = `${athleticsScore} (Not included in total)`;
    }
  }
  
  // Add the admission factors scores
  const admissionFactorsRows = [
    ["Academic Excellence (学术卓越)", evaluation.academic_excellence_score || 3],
    ["Impact & Leadership (影响力和领导力)", evaluation.impact_leadership_score || 3],
    ["Unique Personal Narrative (个人特色和独特故事)", evaluation.unique_narrative_score || 3],
  ];
  
  // Calculate max possible score
  let maxScore = 36; // Default: 6 criteria × 6 points
  
  // For UC System, we don't count interview (5 criteria × 6 points = 30)
  if (evalType === 'ucSystem') {
    maxScore = 30;
  }
  
  // For Ivy League and Top30, exclude athletics if it's 4 or higher
  if (isAthleticsExcluded) {
    maxScore -= 6; // Reduce max by 6 points (the max value of athletics)
  }
  
  // Add points for the admission factors (3 criteria × 6 points = 18)
  maxScore += 18;
  
  // Add total score with max possible score
  const totalRow = [getCriteriaLabel('total_score', evalType), `${evaluation.total_score}/${maxScore}`];
  
  // Add admission factors table with appropriate labels
  autoTable(doc, {
    startY: 90,
    head: [['核心录取三要素 (Core Admission Factors)', 'Score (1 is highest, 6 is lowest)']],
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
  
  // Get the Y position after the traditional criteria table
  const traditionalTableEndY = (doc as any).lastAutoTable?.finalY || 220;
  
  // Add total score table
  autoTable(doc, {
    startY: traditionalTableEndY + 5,
    body: [totalRow],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontStyle: 'bold',
      halign: 'center',
      fillColor: [230, 230, 250]
    },
    margin: { left: 50, right: 50 } // Center the total score table
  });
  
  // Return the final Y position
  return (doc as any).lastAutoTable?.finalY || 250;
};
