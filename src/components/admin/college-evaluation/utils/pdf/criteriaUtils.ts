
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../../types";
import { getCriteriaLabel } from '../displayUtils';
import { getCriteriaDescription, getCriteriaKeyFromColumn } from '../criteriaUtils';

/**
 * Adds detailed criteria descriptions to PDF document
 */
export const addCriteriaDescriptions = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType, startY: number) => {
  // Use the evaluation's stored university type if available
  const evalType = evaluation.university_type || universityType;
  
  let finalY = startY + 15; // Add extra spacing after the table
  
  // Add section header
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
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
    
    // Check if we need to add a new page - leave extra space for header on new pages
    if (finalY > 250) {
      doc.addPage();
      doc.setFont("Helvetica", "normal"); // Ensure font is set for new page
      finalY = 45; // Start content lower on new pages to account for header area
    }
    
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text(`${label} (Score: ${score})`, 15, finalY);
    doc.setFont("Helvetica", "normal");
    
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
