// Noto Sans Regular font (subset) - Base64 encoded
// This font supports the Indian Rupee symbol (₹ - U+20B9)
// To generate this file:
// 1. Download Noto Sans Regular from Google Fonts
// 2. Use jsPDF font converter: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
// 3. Copy the base64 string here

import type jsPDF from 'jspdf'

// For now, we'll use a minimal approach - the font will be loaded dynamically
// This is a placeholder - in production, embed the actual font base64 here

export const NOTO_SANS_BASE64 = ''

// Font registration function
export function registerNotoSansFont(doc: jsPDF): void {
  // This will be populated with actual font data
  // For now, we'll use Unicode directly and hope the PDF viewer supports it
}
