
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentEvaluation, UniversityType } from "../../types";
import { getUniversityCriteriaDescriptions } from "../../evaluationConstants";
// Remove the conflicting import
// import { getCriteriaKeyFromColumn } from './criteriaUtils';
import { getCriteriaLabel } from '../displayUtils';

/**
 * Adds criteria descriptions to the PDF document
 */
export const addCriteriaDescriptions = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType, startY: number) => {
  // Define which criteria to include based on university type
  const criteriaToInclude = [
    'academics_score',
    'extracurriculars_score',
    'athletics_score',
    'personal_qualities_score',
    'recommendations_score'
  ];
  
  // Only include interview for non-UC System
  if (universityType !== 'ucSystem') {
    criteriaToInclude.push('interview_score');
  }
  
  // Skip athletics for Ivy League and Top30 if score >= 4
  const athleticsScore = evaluation.athletics_score;
  const isAthleticsExcluded = (universityType === 'ivyLeague' || universityType === 'top30') && athleticsScore >= 4;
  
  // Get criteria descriptions for this university type
  const descriptions = getUniversityCriteriaDescriptions(universityType);
  
  // Start position for criteria descriptions
  let currentY = startY + 10; // Add some spacing after the table
  
  // Ensure font is set correctly for handling Chinese characters
  doc.setFont("Helvetica", "normal");
  
  // Add each criteria description
  criteriaToInclude.forEach(criteriaColumn => {
    // Skip athletics if excluded
    if (criteriaColumn === 'athletics_score' && isAthleticsExcluded) {
      return;
    }
    
    // Skip interview for UC System
    if (universityType === 'ucSystem' && criteriaColumn === 'interview_score') {
      return;
    }
    
    const score = evaluation[criteriaColumn];
    const criteriaKey = getCriteriaKeyFromColumn(criteriaColumn);
    
    if (!criteriaKey || !score) {
      return;
    }
    
    // Get description for this score
    const description = descriptions[criteriaKey]?.[score];
    
    if (!description) {
      return;
    }
    
    // Check if we need a new page
    if (currentY > 240) {
      doc.addPage();
      doc.setFont("Helvetica", "normal"); // Reset font for new page
      currentY = 45; // Start content lower on new pages to account for header area
    }
    
    // Add criteria name
    doc.setFontSize(11);
    doc.setFont("Helvetica", "bold");
    doc.text(`${criteriaKey} - Score ${score}:`, 15, currentY);
    
    // Add description with proper line breaks (for Chinese text)
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    
    // Use proper text splitting to handle Chinese characters
    const maxWidth = 180;
    const splitText = doc.splitTextToSize(description, maxWidth);
    currentY += 5;
    doc.text(splitText, 15, currentY);
    
    // Calculate height of text based on number of lines
    const lineHeight = 4; // Approximate line height in mm
    currentY += (splitText.length * lineHeight) + 5; // Add extra spacing between criteria
  });
  
  return currentY;
};

/**
 * Converts column name to criteria key
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

/**
 * Prepares table rows for PDF export based on evaluation and university type
 */
export const preparePdfTableRows = (evaluation: any, universityType: UniversityType) => {
  // Define criteria columns to include
  const criteriaColumns = [
    'academics_score',
    'extracurriculars_score',
    'athletics_score',
    'personal_qualities_score',
    'recommendations_score'
  ];
  
  // Only Include Interview For Non-UC System
  if (universityType !== 'ucSystem') {
    criteriaColumns.push('interview_score');
  }
  
  // Map columns to table rows
  return criteriaColumns.map(column => {
    const score = evaluation[column];
    // Skip interview for UC System
    if (universityType === 'ucSystem' && column === 'interview_score') {
      return null;
    }
    
    return [getCriteriaLabel(column, universityType), score];
  }).filter(Boolean); // Remove null entries
};
