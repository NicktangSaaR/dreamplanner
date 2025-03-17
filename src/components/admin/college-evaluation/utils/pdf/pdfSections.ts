
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentEvaluation, UniversityType } from "../../types";
import { getUniversityTypeDisplay, getCriteriaLabel } from '../displayUtils';
import { getCriteriaDescription, preparePdfTableRows } from '../criteriaUtils';

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
  autoTable(doc, {
    startY: 50,
    head: [['Evaluation Criteria', 'Score (1 is highest, 6 is lowest)']],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [66, 139, 202], 
      textColor: [255, 255, 255],
      font: 'times',
      fontStyle: 'bold' 
    },
    styles: {
      font: 'times',
      fontStyle: 'normal'
    },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  
  // Return the final Y position
  return (doc as any).lastAutoTable?.finalY || 130;
};

/**
 * Adds detailed criteria descriptions to PDF document
 */
export const addCriteriaDescriptions = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType, startY: number) => {
  // Use the evaluation's stored university type if available
  const evalType = evaluation.university_type || universityType;
  
  let finalY = startY + 10;
  
  // Add section header
  doc.setFontSize(14);
  doc.setFont("times", "bold");
  doc.text('Detailed Scoring Criteria Descriptions:', 15, finalY);
  finalY += 20;
  
  // Define criteria columns to process
  const criteriaColumns = [
    'academics_score',
    'extracurriculars_score',
    'athletics_score',
    'personal_qualities_score',
    'recommendations_score'
  ];
  
  // Only include interview for non-UC System
  if (evalType !== 'ucSystem') {
    criteriaColumns.push('interview_score');
  }
  
  // Loop through each criteria and add its description
  criteriaColumns.forEach(column => {
    if (column === 'interview_score' && evalType === 'ucSystem') {
      return; // Skip interview for UC System
    }
    
    const criteriaKey = getCriteriaKeyFromColumn(column);
    const score = evaluation[column] as number;
    const label = getCriteriaLabel(column, evalType);
    const description = getCriteriaDescription(criteriaKey, score, evalType);
    
    // Check if we need to add a new page
    if (finalY > 260) {
      doc.addPage();
      doc.setFont("times", "normal"); // Ensure font is set for new page
      finalY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont("times", "bold");
    doc.text(`${label} (Score: ${score})`, 15, finalY);
    doc.setFont("times", "normal");
    
    // Add description with improved word wrapping - maximize page width usage
    const maxWidth = 180;
    const splitDescription = doc.splitTextToSize(description, maxWidth);
    finalY += 8; // Increase spacing between label and description
    doc.setFontSize(10);
    doc.text(splitDescription, 15, finalY);
    
    // Update Y position for next criteria - ensure proper spacing
    const textHeight = splitDescription.length * 5; // Calculate text height
    finalY += textHeight + 12; // Add more spacing between criteria sections
  });
  
  return finalY;
};

/**
 * Adds comments section to PDF document
 */
export const addCommentsSection = (doc: jsPDF, evaluation: StudentEvaluation, startY: number) => {
  let finalY = startY;
  
  // Add new page if needed
  if (finalY > 240) {
    doc.addPage();
    doc.setFont("times", "normal"); // Ensure font is set for new page
    finalY = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont("times", "bold");
  doc.text('Comments:', 15, finalY);
  doc.setFont("times", "normal");
  
  // Add comments with improved word wrapping
  const maxCommentWidth = 180;
  const comments = evaluation.comments || 'None';
  const splitComments = doc.splitTextToSize(comments, maxCommentWidth);
  finalY += 8; // Better spacing
  doc.setFontSize(10);
  doc.text(splitComments, 15, finalY);
};

/**
 * Helper to get criteria key from column name
 */
export const getCriteriaKeyFromColumn = (columnName: string): string => {
  switch (columnName) {
    case 'academics_score':
      return 'academics';
    case 'extracurriculars_score':
      return 'extracurriculars';
    case 'athletics_score':
      return 'athletics';
    case 'personal_qualities_score':
      return 'personalQualities';
    case 'recommendations_score':
      return 'recommendations';
    case 'interview_score':
      return 'interview';
    default:
      return '';
  }
};
