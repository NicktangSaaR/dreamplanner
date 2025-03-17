
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentEvaluation, UniversityType } from "../../types";
import { getCriteriaLabel } from '../displayUtils';
import { preparePdfTableRows } from '../criteriaUtils';

/**
 * Adds scores table to PDF document
 */
export const addScoresTable = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType) => {
  // Use the evaluation's stored university type if available
  const evalType = evaluation.university_type || universityType;
  
  // Get table rows
  const tableRows = preparePdfTableRows(evaluation, evalType);
  
  // Check if athletics score should be excluded for Ivy League and Top30
  const athleticsScore = evaluation.athletics_score;
  const isAthleticsExcluded = (evalType === 'ivyLeague' || evalType === 'top30') && athleticsScore >= 4;
  
  // If athletics is excluded, add a note to the athletics row
  if (isAthleticsExcluded) {
    const athleticsIndex = tableRows.findIndex(row => row[0] === getCriteriaLabel('athletics_score', evalType));
    if (athleticsIndex !== -1) {
      tableRows[athleticsIndex][1] = `${athleticsScore} (Not included in total)`;
    }
  }
  
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
  
  // Add total score with max possible score
  tableRows.push([getCriteriaLabel('total_score', evalType), `${evaluation.total_score}/${maxScore}`]);
  
  // Add scores table with appropriate labels based on university type
  // Increase starting Y position to 85 to accommodate the header that will appear on every page
  autoTable(doc, {
    startY: 85,
    head: [['Evaluation Criteria', 'Score (1 is highest, 6 is lowest)']],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [66, 139, 202], 
      textColor: [255, 255, 255],
      font: 'Helvetica',
      fontStyle: 'bold' 
    },
    styles: {
      font: 'Helvetica',
      fontStyle: 'normal'
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  
  // Return the final Y position
  return (doc as any).lastAutoTable?.finalY || 150;
};
