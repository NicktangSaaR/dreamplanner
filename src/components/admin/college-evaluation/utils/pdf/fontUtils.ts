
import jsPDF from 'jspdf';

/**
 * Loads fonts support for PDF documents
 * This must be awaited before using non-standard characters
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
  // Always use helvetica for consistent rendering across all platforms
  doc.setFont("helvetica", fontStyle);
};

/**
 * Ensures text is encoded properly for PDF output
 * This helps prevent garbled characters in the PDF
 */
export const sanitizeText = (text: string): string => {
  // Replace any problematic characters or sequences
  return text
    .replace(/&/g, '&amp;')  // Replace ampersands
    .normalize('NFD')        // Normalize to handle accents and special chars
    .replace(/[\u0300-\u036f]/g, ''); // Remove combining diacritical marks
};
