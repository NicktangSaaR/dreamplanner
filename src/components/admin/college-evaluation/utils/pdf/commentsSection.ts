
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
    doc.setFont("NotoSansSC"); // Ensure font is set for new page to support Chinese
    finalY = 45; // Start content lower on new pages to account for header area
  }
  
  // Set font for the section header
  doc.setFontSize(14);
  doc.setFont("NotoSansSC", "bold");
  doc.text('Comments:', 15, finalY);
  
  // Set font for comments content
  doc.setFont("NotoSansSC", "normal");
  
  // Add comments with improved word wrapping
  const maxCommentWidth = 180;
  const comments = evaluation.comments || 'None';
  
  // Use splitTextToSize for proper text wrapping with CJK character support
  const splitComments = doc.splitTextToSize(comments, maxCommentWidth);
  finalY += 10; // Better spacing between header and content
  
  doc.setFontSize(10);
  doc.text(splitComments, 15, finalY);
  
  return finalY + (splitComments.length * 5); // Return the final Y position
};
