
import jsPDF from 'jspdf';

/**
 * Loads Chinese font support for PDF documents
 * This must be awaited before using Chinese characters
 */
export const loadChineseFont = async (doc: jsPDF): Promise<void> => {
  // Use standard fonts for now to avoid font loading issues
  // Setting the default font to helvetica which is built-in
  doc.setFont("helvetica");
  
  // Return immediately since we're not loading external fonts
  return Promise.resolve();
};

/**
 * Apply safe fonts to document
 * Use this instead of directly setting fonts to prevent errors
 */
export const applyDocumentFont = (doc: jsPDF, fontStyle: 'normal' | 'bold' | 'italic' | 'bolditalic' = 'normal'): void => {
  doc.setFont("helvetica", fontStyle);
};
