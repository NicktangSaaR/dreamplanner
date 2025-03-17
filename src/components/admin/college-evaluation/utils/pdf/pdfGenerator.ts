
import jsPDF from 'jspdf';
import { StudentEvaluation, UniversityType } from "../../types";
import { addDocumentHeader } from './documentHeader'; 
import { addScoresTable } from './scoresTable';
import { addCriteriaDescriptions } from './criteriaUtils';
import { addCommentsSection } from './commentsSection';

/**
 * Generates and returns a PDF document for the evaluation
 */
export const generateEvaluationPdf = (evaluation: StudentEvaluation, universityType: UniversityType): jsPDF => {
  // Create PDF document with standard font
  const doc = new jsPDF();
  
  // Add standard font to handle international characters
  doc.addFont("helvetica", "Helvetica", "normal");
  doc.addFont("helvetica", "Helvetica", "bold");
  doc.setFont("Helvetica");
  
  // Add header to all pages
  const totalPages = doc.getNumberOfPages();
  
  // Setup header function for all pages
  const addHeaderToAllPages = () => {
    const currentPage = doc.getCurrentPageInfo().pageNumber;
    for (let i = 1; i <= doc.getNumberOfPages(); i++) {
      doc.setPage(i);
      
      // Add logo (in top left corner)
      try {
        doc.addImage(logoBase64, 'PNG', 15, 10, 20, 20);
      } catch (err) {
        console.error('Error adding logo to PDF:', err);
      }
      
      // Add company name: "DreamPlanner"
      doc.setFontSize(14);
      doc.setFont("Helvetica", "bold");
      doc.text("DreamPlanner", 40, 20);
      
      // Add slogan below company name
      doc.setFontSize(8);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(100, 100, 100); // Gray color for slogan
      doc.text("Weave Your Dreams", 40, 25);
      
      // Reset text color to black for the rest of the document
      doc.setTextColor(0, 0, 0);
    }
    
    // Return to the original page
    doc.setPage(currentPage);
  };
  
  // Add special note about athletics scoring for Ivy League and Top30
  const athleticsScore = evaluation.athletics_score;
  const isAthleticsExcluded = (universityType === 'ivyLeague' || universityType === 'top30') && athleticsScore >= 4;
  
  // Add document sections
  addDocumentHeader(doc, evaluation, universityType);
  
  // Add special note about athletics scoring if applicable
  if (isAthleticsExcluded) {
    doc.setFontSize(10);
    doc.setFont("Helvetica", "italic");
    doc.text('* Note: For Ivy League and Top20-30 universities, athletics scores of 4 or higher are not included in the total score.', 15, 70);
  }
  
  const afterTableY = addScoresTable(doc, evaluation, universityType);
  const afterDescriptionsY = addCriteriaDescriptions(doc, evaluation, universityType, afterTableY);
  addCommentsSection(doc, evaluation, afterDescriptionsY);
  
  // Once all content is added, apply headers to all pages
  addHeaderToAllPages();
  
  return doc;
};

// Base64 encoded logo for "DreamPlanner" - make it available in this file for the header on every page
const logoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA1LTAxVDEyOjQwOjAyKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wNS0wMVQxMjo0MToyNiswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wNS0wMVQxMjo0MToyNiswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDowOWQ2MmJkMC0xZWEw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';

