import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StudentEvaluation, UniversityType } from "../../types";
import { getUniversityCriteriaDescriptions } from "../../evaluationConstants";
import { getCriteriaLabel } from '../displayUtils';

/**
 * Adds criteria descriptions to the PDF document
 */
export const addCriteriaDescriptions = (doc: jsPDF, evaluation: StudentEvaluation, universityType: UniversityType, startY: number) => {
  // Define which traditional criteria to include based on university type
  const traditionalCriteria = [
    'academics_score',
    'extracurriculars_score',
    'athletics_score',
    'personal_qualities_score',
    'recommendations_score'
  ];
  
  // Only include interview for non-UC System
  if (universityType !== 'ucSystem') {
    traditionalCriteria.push('interview_score');
  }
  
  // Define admission factors criteria
  const admissionFactorsCriteria = [
    'academic_excellence_score',
    'impact_leadership_score',
    'unique_narrative_score'
  ];
  
  // Talents & Abilities is now always included
  const isAthleticsExcluded = false;
  
  // Get criteria descriptions for this university type
  const descriptions = getUniversityCriteriaDescriptions(universityType);
  
  // Start position for criteria descriptions
  let currentY = startY + 10; // Add some spacing after the table
  
  // Set the font size and style - using NotoSansSC to support Chinese
  doc.setFont("NotoSansSC", "bold");
  doc.setFontSize(12);
  doc.text("Core Admission Factors Descriptions:", 15, currentY);
  currentY += 8;
  doc.setFont("NotoSansSC", "normal");
  doc.setFontSize(10);
  
  // First add descriptions for admission factors
  for (const criteriaColumn of admissionFactorsCriteria) {
    // Get the score - default to 3 if not available
    const score = evaluation[criteriaColumn] || 3;
    const criteriaKey = getCriteriaKeyFromColumn(criteriaColumn);
    
    if (!criteriaKey) {
      continue;
    }
    
    // Get description for this score
    const description = descriptions[criteriaKey]?.[score];
    
    if (!description) {
      continue;
    }
    
    // Check if we need a new page
    if (currentY > 240) {
      doc.addPage();
      doc.setFont("NotoSansSC", "bold"); // Reset font for new page with Chinese support
      currentY = 45; // Start content lower on new pages to account for header area
    }
    
    // Add criteria name
    doc.setFontSize(11);
    doc.setFont("NotoSansSC", "bold");
    let label = criteriaColumn;
    if (criteriaColumn === 'academic_excellence_score') {
      label = "Academic Excellence";
    } else if (criteriaColumn === 'impact_leadership_score') {
      label = "Impact & Leadership";
    } else if (criteriaColumn === 'unique_narrative_score') {
      label = "Unique Personal Narrative";
    }
    
    doc.text(`${label} - Score ${score}:`, 15, currentY);
    
    // Add description with proper line breaks
    doc.setFontSize(9);
    doc.setFont("NotoSansSC", "normal");
    
    // Use proper text splitting to handle text characters
    const maxWidth = 180;
    const splitText = doc.splitTextToSize(description, maxWidth);
    currentY += 5;
    doc.text(splitText, 15, currentY);
    
    // Calculate height of text based on number of lines
    const lineHeight = 4.5; // Appropriate line height for text rendering
    currentY += (splitText.length * lineHeight) + 8; // Add extra spacing between criteria
  }
  
  // Add separator before traditional criteria
  currentY += 5;
  doc.setDrawColor(220, 220, 220); // Light gray line
  doc.setLineWidth(0.5);
  doc.line(15, currentY, 195, currentY);
  currentY += 10;
  
  // Add title for traditional criteria
  doc.setFont("NotoSansSC", "bold");
  doc.setFontSize(12);
  doc.text("Traditional Evaluation Criteria Descriptions:", 15, currentY);
  currentY += 8;
  doc.setFont("NotoSansSC", "normal");
  doc.setFontSize(10);
  
  // Add each traditional criteria description
  for (const criteriaColumn of traditionalCriteria) {
    // Skip athletics if excluded
    if (criteriaColumn === 'athletics_score' && isAthleticsExcluded) {
      continue;
    }
    
    // Skip interview for UC System
    if (universityType === 'ucSystem' && criteriaColumn === 'interview_score') {
      continue;
    }
    
    const score = evaluation[criteriaColumn];
    const criteriaKey = getCriteriaKeyFromColumn(criteriaColumn);
    
    if (!criteriaKey || !score) {
      continue;
    }
    
    // Get description for this score
    const description = descriptions[criteriaKey]?.[score];
    
    if (!description) {
      continue;
    }
    
    // Check if we need a new page
    if (currentY > 240) {
      doc.addPage();
      doc.setFont("NotoSansSC", "bold"); // Reset font for new page with Chinese support
      currentY = 45; // Start content lower on new pages to account for header area
    }
    
    // Add criteria name
    doc.setFontSize(11);
    doc.setFont("NotoSansSC", "bold");
    doc.text(`${getCriteriaLabel(criteriaColumn, universityType)} - Score ${score}:`, 15, currentY);
    
    // Add description with proper line breaks
    doc.setFontSize(9);
    doc.setFont("NotoSansSC", "normal");
    
    // Use proper text splitting to handle text characters
    const maxWidth = 180;
    const splitText = doc.splitTextToSize(description, maxWidth);
    currentY += 5;
    doc.text(splitText, 15, currentY);
    
    // Calculate height of text based on number of lines
    const lineHeight = 4.5; // Appropriate line height for text rendering
    currentY += (splitText.length * lineHeight) + 8; // Add extra spacing between criteria
  }
  
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
    case 'academic_excellence_score':
      return 'academicExcellence';
    case 'impact_leadership_score':
      return 'impactLeadership';
    case 'unique_narrative_score':
      return 'uniqueNarrative';
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
