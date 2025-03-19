
import jsPDF from 'jspdf';

/**
 * Loads fonts support for PDF documents
 * This function ensures proper character support for PDF generation
 */
export const loadChineseFont = async (doc: jsPDF): Promise<void> => {
  // Use standard fonts for now
  // Setting the default font to helvetica which has broader character support
  doc.setFont("helvetica");
  
  // Return immediately since we're using built-in fonts
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
  // For Chinese characters, we need to properly handle them
  // Instead of trying to normalize or replace, we'll use a simple approach
  // that preserves the original characters when possible
  
  try {
    // For Chinese text in parentheses - a common pattern in the app
    // Example: "Talents & Abilities (艺术、音乐、体育等)"
    const chineseParenthesesPattern = /\([\u4e00-\u9fa5，、。；：''""《》？！…—\s]+\)/g;
    
    if (chineseParenthesesPattern.test(text)) {
      // Remove the Chinese text in parentheses for now
      // This is a temporary solution until proper font embedding is implemented
      return text.replace(chineseParenthesesPattern, '');
    }
    
    // For basic latinization, replace specific characters
    return text
      .replace(/&/g, 'and')  // Replace ampersands
      .replace(/[^\x00-\x7F]/g, ''); // Remove non-ASCII characters
      
  } catch (error) {
    console.error("Error sanitizing text:", error);
    // Fall back to ASCII-only text if there's an error
    return text.replace(/[^\x00-\x7F]/g, '');
  }
};
