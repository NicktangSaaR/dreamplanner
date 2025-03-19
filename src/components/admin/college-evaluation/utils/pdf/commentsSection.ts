
import jsPDF from 'jspdf';
import { StudentEvaluation } from "../../types";
import { applyDocumentFont } from './fontUtils';

/**
 * Adds comments section to PDF document
 */
export const addCommentsSection = (doc: jsPDF, evaluation: StudentEvaluation, currentY: number) => {
  // Check if we need a new page for comments
  if (currentY > 220) {
    doc.addPage();
    currentY = 45; // Start content lower on new pages to account for header area
  }
  
  // Add separator
  doc.setDrawColor(220, 220, 220); // Light gray line
  doc.setLineWidth(0.5);
  doc.line(15, currentY, 195, currentY);
  currentY += 10;
  
  // Add comments title
  applyDocumentFont(doc, 'bold');
  doc.setFontSize(12);
  doc.text("Counselor Comments:", 15, currentY);
  currentY += 8;
  
  // Get comments from evaluation
  const comments = evaluation.comments || "";
  
  // Add comments with proper line breaks
  applyDocumentFont(doc, 'normal');
  doc.setFontSize(10);
  
  if (comments.trim() === "") {
    doc.text("No comments provided.", 15, currentY);
  } else {
    // Split long text to fit on page width
    const maxWidth = 180;
    const splitText = doc.splitTextToSize(comments, maxWidth);
    doc.text(splitText, 15, currentY);
  }
};
