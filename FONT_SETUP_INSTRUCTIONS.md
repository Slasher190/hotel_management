# How to Add Indian Rupee Symbol (₹) Support to jsPDF

## Problem
jsPDF's default fonts (Helvetica, Times, Courier) don't support the Indian Rupee symbol (₹ - Unicode U+20B9). This causes it to render as a small "1" or other incorrect character.

## Solution: Add Custom Font

### Step 1: Download a Font That Supports ₹
Download a font that includes the ₹ symbol, such as:
- **Noto Sans** (Recommended): https://fonts.google.com/noto/specimen/Noto+Sans
- **Roboto**: https://fonts.google.com/specimen/Roboto
- **Open Sans**: https://fonts.google.com/specimen/Open+Sans

### Step 2: Convert Font to jsPDF Format

1. Go to jsPDF Font Converter: https://rawgit.com/MrRio/jsPDF/master/fontconverter/fontconverter.html
2. Upload your `.ttf` font file (e.g., `NotoSans-Regular.ttf`)
3. Click "Convert" - it will generate a JavaScript file with base64-encoded font
4. Copy the generated code

### Step 3: Add Font to Project

1. Create or update `lib/fonts/noto-sans-base64.ts` with the converted font code
2. The file should export a function that registers the font with jsPDF

### Step 4: Use Font in PDF Generation

Update `lib/pdf-utils.ts` to:
1. Import the font registration function
2. Call it before generating text with ₹ symbol
3. Set the font using `doc.setFont('NotoSans', 'normal')`

## Quick Fix (Temporary)

Until a custom font is added, the ₹ symbol will use Unicode directly. Some PDF viewers may render it correctly if they have system fonts that support it, but it's not guaranteed.

## Alternative: Use SVG Images

If adding a custom font is not feasible, you can render the ₹ symbol as SVG images, but this is more complex and may affect table layout.
