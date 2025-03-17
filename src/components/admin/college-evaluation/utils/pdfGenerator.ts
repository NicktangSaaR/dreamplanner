
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentEvaluation, UniversityType } from "../types";
import { getUniversityTypeDisplay, getCriteriaLabel, getCriteriaKeyFromColumn } from './displayUtils';
import { getCriteriaDescription, preparePdfTableRows } from './criteriaUtils';

/**
 * Adds student information and header to PDF document
 */
const addDocumentHeader = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType) => {
  // Add title
  doc.setFontSize(18);
  const universityTypeDisplay = getUniversityTypeDisplay(universityType);
  doc.text(`US Undergraduate Admission Evaluation - ${universityTypeDisplay}`, 15, 20);
  
  // Add student information
  doc.setFontSize(12);
  doc.text(`Student Name: ${evaluation.student_name}`, 15, 30);
  doc.text(`Evaluation Date: ${new Date(evaluation.evaluation_date).toLocaleDateString('en-US')}`, 15, 40);
};

/**
 * Adds scores table to PDF document
 */
const addScoresTable = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType) => {
  // Get table rows
  const tableRows = preparePdfTableRows(evaluation, universityType);
  
  // Check if athletics score should be excluded for Ivy League and Top30
  const athleticsScore = evaluation.athletics_score;
  const isAthleticsExcluded = (universityType === 'ivyLeague' || universityType === 'top30') && athleticsScore >= 4;
  
  // If athletics is excluded, add a note to the athletics row
  if (isAthleticsExcluded) {
    const athleticsIndex = tableRows.findIndex(row => row[0] === getCriteriaLabel('athletics_score', universityType));
    if (athleticsIndex !== -1) {
      tableRows[athleticsIndex][1] = `${athleticsScore} (不计入总分)`;
    }
  }
  
  // Add total score
  tableRows.push([getCriteriaLabel('total_score', universityType), evaluation.total_score]);
  
  // Add scores table with appropriate labels based on university type
  autoTable(doc, {
    startY: 50,
    head: [['Evaluation Criteria', 'Score (1 is highest, 6 is lowest)']],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
  });
  
  // Return the final Y position
  return (doc as any).lastAutoTable?.finalY || 130;
};

/**
 * Adds detailed criteria descriptions to PDF document
 */
const addCriteriaDescriptions = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType, startY: number) => {
  let finalY = startY + 10;
  
  // Add section header
  doc.setFontSize(14);
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
  if (universityType !== 'ucSystem') {
    criteriaColumns.push('interview_score');
  }
  
  // Loop through each criteria and add its description
  criteriaColumns.forEach(column => {
    if (column === 'interview_score' && universityType === 'ucSystem') {
      return; // Skip interview for UC System
    }
    
    const criteriaKey = getCriteriaKeyFromColumn(column);
    const score = evaluation[column] as number;
    const label = getCriteriaLabel(column, universityType);
    const description = getCriteriaDescription(criteriaKey, score, universityType);
    
    // Check if we need to add a new page
    if (finalY > 260) {
      doc.addPage();
      finalY = 20;
    }
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`${label} (Score: ${score})`, 15, finalY);
    doc.setFont(undefined, 'normal');
    
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
const addCommentsSection = (doc: jsPDF, evaluation: StudentEvaluation, startY: number) => {
  let finalY = startY;
  
  // Add new page if needed
  if (finalY > 240) {
    doc.addPage();
    finalY = 20;
  }
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Comments:', 15, finalY);
  doc.setFont(undefined, 'normal');
  
  // Add comments with improved word wrapping
  const maxCommentWidth = 180;
  const comments = evaluation.comments || 'None';
  const splitComments = doc.splitTextToSize(comments, maxCommentWidth);
  finalY += 8; // Better spacing
  doc.setFontSize(10);
  doc.text(splitComments, 15, finalY);
};

/**
 * Generates and saves PDF for evaluation
 */
export const generateEvaluationPdf = (evaluation: StudentEvaluation, universityType: UniversityType): jsPDF => {
  const doc = new jsPDF();
  
  // Add special note about athletics scoring for Ivy League and Top30
  const athleticsScore = evaluation.athletics_score;
  const isAthleticsExcluded = (universityType === 'ivyLeague' || universityType === 'top30') && athleticsScore >= 4;
  
  // Add document sections
  addDocumentHeader(doc, evaluation, universityType);
  
  // Add special note about athletics scoring if applicable
  if (isAthleticsExcluded) {
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.text('* 注意: 对于常青藤和Top20-30大学，体育分数4分及以上不计入总分。', 15, 45);
  }
  
  const afterTableY = addScoresTable(doc, evaluation, universityType);
  const afterDescriptionsY = addCriteriaDescriptions(doc, evaluation, universityType, afterTableY);
  addCommentsSection(doc, evaluation, afterDescriptionsY);
  
  return doc;
};
