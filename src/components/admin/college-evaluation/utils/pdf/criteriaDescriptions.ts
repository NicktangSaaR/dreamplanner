
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../../types";
import { getUniversityCriteriaDescriptions } from "../../evaluationConstants";
import { getCriteriaLabel } from '../displayUtils';
import { getCriteriaKeyFromColumn } from './criteriaKeyMapping';
import { applyDocumentFont } from './fontUtils';

/**
 * Adds core admission factors descriptions to the PDF document
 */
export const addCoreAdmissionFactorsDescriptions = (
  doc: jsPDF, 
  evaluation: StudentEvaluation, 
  universityType: UniversityType, 
  currentY: number
): number => {
  // Define admission factors criteria
  const admissionFactorsCriteria = [
    'academic_excellence_score',
    'impact_leadership_score',
    'unique_narrative_score'
  ];
  
  // Get criteria descriptions for this university type
  const descriptions = getUniversityCriteriaDescriptions(universityType);
  
  applyDocumentFont(doc, 'bold');
  doc.setFontSize(12);
  doc.text("Core Admission Factors Descriptions:", 15, currentY);
  currentY += 8;
  applyDocumentFont(doc, 'normal');
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
      applyDocumentFont(doc, 'bold'); 
      currentY = 45; // Start content lower on new pages to account for header area
    }
    
    // Add criteria name
    doc.setFontSize(11);
    applyDocumentFont(doc, 'bold');
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
    applyDocumentFont(doc, 'normal');
    
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
 * Adds traditional criteria descriptions to the PDF document
 */
export const addTraditionalCriteriaDescriptions = (
  doc: jsPDF, 
  evaluation: StudentEvaluation, 
  universityType: UniversityType, 
  currentY: number
): number => {
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
  
  // Talents & Abilities is now always included
  const isAthleticsExcluded = false;
  
  // Get criteria descriptions for this university type
  const descriptions = getUniversityCriteriaDescriptions(universityType);
  
  // Add separator before traditional criteria
  currentY += 5;
  doc.setDrawColor(220, 220, 220); // Light gray line
  doc.setLineWidth(0.5);
  doc.line(15, currentY, 195, currentY);
  currentY += 10;
  
  // Add title for traditional criteria
  applyDocumentFont(doc, 'bold');
  doc.setFontSize(12);
  doc.text("Traditional Evaluation Criteria Descriptions:", 15, currentY);
  currentY += 8;
  applyDocumentFont(doc, 'normal');
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
      applyDocumentFont(doc, 'bold');
      currentY = 45; // Start content lower on new pages to account for header area
    }
    
    // Add criteria name
    doc.setFontSize(11);
    applyDocumentFont(doc, 'bold');
    doc.text(`${getCriteriaLabel(criteriaColumn, universityType)} - Score ${score}:`, 15, currentY);
    
    // Add description with proper line breaks
    doc.setFontSize(9);
    applyDocumentFont(doc, 'normal');
    
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
