
import jsPDF from 'jspdf';
import { StudentEvaluation } from "../../types";

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
