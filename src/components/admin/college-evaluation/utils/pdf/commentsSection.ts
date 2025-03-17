
import jsPDF from 'jspdf';
import { StudentEvaluation } from "../../types";

/**
 * Adds comments section to PDF document
 */
export const addCommentsSection = (doc: jsPDF, evaluation: StudentEvaluation, startY: number) => {
  let finalY = startY + 10; // Add extra space before comments section
  
  // Add new page if needed - ensure enough space for header
  if (finalY > 240) {
    doc.addPage();
    doc.setFont("Helvetica", "normal"); // Ensure font is set for new page
    finalY = 45; // Start content lower on new pages to account for header area
  }
  
  doc.setFontSize(14);
  doc.setFont("Helvetica", "bold");
  doc.text('Comments:', 15, finalY);
  doc.setFont("Helvetica", "normal");
  
  // Add comments with improved word wrapping
  const maxCommentWidth = 180;
  const comments = evaluation.comments || 'None';
  const splitComments = doc.splitTextToSize(comments, maxCommentWidth);
  finalY += 10; // Better spacing between header and content
  doc.setFontSize(10);
  doc.text(splitComments, 15, finalY);
};
