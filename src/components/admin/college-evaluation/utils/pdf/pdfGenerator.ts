
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../../types";
import { addDocumentHeader } from './documentHeader'; 
import { addScoresTable } from './scoresTable';
import { addCriteriaDescriptions } from './criteriaUtils';
import { addCommentsSection } from './commentsSection';

// Add Chinese font support
import { loadChineseFont } from './fontUtils';

/**
 * Generates and returns a PDF document for the evaluation
 */
export const generateEvaluationPdf = async (evaluation: StudentEvaluation, universityType: UniversityType): Promise<jsPDF> => {
  // Create PDF document with standard encoding
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    putOnlyUsedFonts: true,
    compress: true
  });
  
  // Load Chinese font support before rendering content
  await loadChineseFont(doc);
  
  // Setup header function for all pages
  const addHeaderToAllPages = () => {
    const currentPage = doc.getCurrentPageInfo().pageNumber;
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      
      // Add header with white background (instead of primary color)
      doc.setFillColor(255, 255, 255); // White background
      doc.rect(0, 0, 210, 35, 'F');
      
      // Add company name: "DreamPlanner" in primary color instead of white
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(99, 102, 241); // #6366F1 - primary color from tailwind config
      doc.text("DreamPlanner", 15, 20);
      
      // Add slogan below company name in lighter primary color
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(136, 138, 243); // Slightly lighter version of primary color
      doc.text("Weave Your Dreams", 15, 25);
      
      // Reset text color to black for the rest of the document
      doc.setTextColor(0, 0, 0);
      
      // Add a subtle separator line below the header
      doc.setDrawColor(220, 220, 220); // Light gray line
      doc.setLineWidth(0.5);
      doc.line(15, 40, 195, 40);
    }
    
    // Return to the original page
    doc.setPage(currentPage);
  };
  
  // Add special note about athletics scoring for Ivy League and Top30
  const athleticsScore = evaluation.athletics_score;
  const isAthleticsExcluded = false; // Talents & Abilities is now always included
  
  // Add document sections with adjusted Y positions to account for header spacing
  addDocumentHeader(doc, evaluation, universityType);
  
  // Add special note about athletics scoring if applicable
  if (isAthleticsExcluded) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.text('* Note: For Ivy League and Top20-30 universities, athletics scores of 4 or higher are not included in the total score.', 15, 75);
  }
  
  const afterTableY = addScoresTable(doc, evaluation, universityType);
  const afterDescriptionsY = addCriteriaDescriptions(doc, evaluation, universityType, afterTableY);
  addCommentsSection(doc, evaluation, afterDescriptionsY);
  
  // Once all content is added, apply headers to all pages
  addHeaderToAllPages();
  
  return doc;
};
