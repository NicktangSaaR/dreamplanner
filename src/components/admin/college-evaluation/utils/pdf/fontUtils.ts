
import jsPDF from 'jspdf';

/**
 * Loads Chinese font support into the PDF document
 * This ensures proper rendering of Chinese characters
 */
export const loadChineseFont = async (doc: jsPDF): Promise<void> => {
  try {
    // Add NotoSansSC font which supports Chinese characters
    // We're loading it from CDN rather than bundling with the app
    const fontUrl = 'https://cdn.jsdelivr.net/npm/noto-sans-sc@14.0.1/NotoSansSC-Regular.ttf';
    
    // Load a font that has good CJK (Chinese, Japanese, Korean) support
    // This is a simple approach that works for web-based PDF generation
    doc.addFont(fontUrl, 'NotoSansSC', 'normal');
    
    // Set as default font to ensure all text uses it
    doc.setFont('NotoSansSC');
    
    console.log('Chinese font loaded successfully');
  } catch (error) {
    console.error('Error loading Chinese font:', error);
    // Fallback to standard font if loading fails
    doc.setFont('helvetica');
  }
};
