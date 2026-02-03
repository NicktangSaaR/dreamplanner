// Chinese font utilities for PDF generation
// We'll use a subset of NotoSansSC for Chinese character support

import jsPDF from "jspdf";

// Load Chinese font from CDN and cache it
let cachedFont: string | null = null;

export const loadChineseFont = async (): Promise<string | null> => {
  if (cachedFont) {
    return cachedFont;
  }

  try {
    // Use a lightweight subset of NotoSansSC from jsDelivr CDN
    const fontUrl = "https://cdn.jsdelivr.net/npm/@aspect-dev/noto-sans-sc@1.0.0/fonts/NotoSansSC-Regular.otf";
    
    const response = await fetch(fontUrl);
    if (!response.ok) {
      console.warn("Failed to load Chinese font, falling back to default");
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(arrayBuffer);
    cachedFont = base64;
    return base64;
  } catch (error) {
    console.error("Error loading Chinese font:", error);
    return null;
  }
};

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const setupChineseFont = async (doc: jsPDF): Promise<boolean> => {
  try {
    const fontBase64 = await loadChineseFont();
    
    if (fontBase64) {
      doc.addFileToVFS("NotoSansSC-Regular.otf", fontBase64);
      doc.addFont("NotoSansSC-Regular.otf", "NotoSansSC", "normal");
      doc.setFont("NotoSansSC");
      return true;
    }
    
    return false;
  } catch (error) {
    console.error("Error setting up Chinese font:", error);
    return false;
  }
};

// Fallback: transliterate Chinese months to English if font loading fails
export const getMonthName = (index: number, useChinese: boolean = false): string => {
  const englishMonths = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const chineseMonths = [
    "一月", "二月", "三月", "四月", "五月", "六月",
    "七月", "八月", "九月", "十月", "十一月", "十二月"
  ];
  
  return useChinese ? chineseMonths[index] : englishMonths[index];
};
