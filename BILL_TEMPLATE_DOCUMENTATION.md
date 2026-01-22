# Traditional Indian Hotel Bill Template Documentation

## Overview
This document describes the new traditional Indian hotel bill PDF generation system that creates pixel-accurate, print-first bills matching the classic hotel invoice aesthetic.

## Design Specifications

### Page Size
- **Format**: A4 (210mm × 297mm)
- **Orientation**: Portrait
- **Margins**: 8mm on all sides
- **Content Width**: 194mm

### Typography
- **Font Family**: Times New Roman (serif) for traditional look
- **Font Sizes**:
  - Hotel Name: 16pt (bold, uppercase)
  - Headers: 11pt (bold)
  - Body Text: 9pt (normal)
  - Footer: 7pt (italic)
  - Net Payable: 11pt (bold)

### Colors
- **Print-friendly**: Black & white only
- **Borders**: 1px solid black (#000)
- **No gradients, shadows, or colors**

## Page Structure

### 1. HEADER SECTION
```
┌─────────────────────────────────────┐
│ [LOGO]    HOTEL NAME (UPPERCASE)    │
│           Address Line              │
│           Phone: xxxxx              │
│           Email: xxxxx              │
│           GSTIN: xxxxx              │
└─────────────────────────────────────┘
```

**Elements:**
- Logo placeholder (20mm × 20mm) - top-left
- Hotel name (centered, bold, uppercase)
- Address (centered)
- Phone, Email, GSTIN (centered, smaller font)

### 2. META INFO ROW
Single line with 3 columns:
- **Left**: Visitor's Register Sr. No.
- **Center**: Bill No.
- **Right**: Bill Date

### 3. ROOM DETAILS TABLE
| Room No | PARTICULARS | RENT PER DAY | NO. OF DAYS |
|---------|-------------|--------------|-------------|
| 101     | AC          | Rs. 1,500.00 | 2           |

### 4. GUEST DETAILS SECTION
Two-column grid with border:

**Left Column:**
- Guest Name & Address
- State
- Nationality
- GST No.
- Mobile No.

**Right Column:**
- Check In Date & Time
- Check Out Date & Time
- Adults
- Children
- Total Guests

### 5. COMPANY DETAILS TABLE
| Company Name | Department | Designation |
|--------------|------------|-------------|
| ABC Corp     | Sales      | Manager     |

### 6. BILLING ITEMS TABLE
| Dt.      | Qty | Product | Rate        | Value       |
|----------|-----|---------|-------------|-------------|
| 22 Jan   | 2   | Coffee  | Rs. 50.00   | Rs. 100.00  |
| 22 Jan   | 1   | Tea     | Rs. 30.00   | Rs. 30.00   |

**Note**: Table remains visible even if empty (shows empty row)

### 7. CHARGES SUMMARY (Right Aligned)
```
Room Charges Before Tax        Rs. 3,000.00
Add: GST on Room Charges       Rs. 150.00
Food Charges                    Rs. 130.00
Add: GST on Food Charges        Rs. 6.50
Bill Cleared Through            CASH
Total Bill Amount              Rs. 3,286.50
Less: Advance                  Rs. 500.00
Round Off                      + Rs. 0.50
───────────────────────────────────────────
Net Payable Amount             Rs. 2,787.00
```

### 8. FOOTER
- **Declaration Text**: Centered, italic, small font
- **Signatures**: Two lines at bottom
  - Left: Cashier's Signature
  - Right: Guest's Signature

## Data Structure

### Example JSON Data

```json
{
  "hotelSettings": {
    "name": "HOTEL SAMRAT INN",
    "address": "OLD BUS STAND, HAZARIBAGH HAZARIBAGH",
    "phone": "7050240391, 9471302111",
    "email": "hotelsamratinn@gmail.com",
    "gstin": "20AAIFH0390N3ZD"
  },
  "billData": {
    "invoiceNumber": "INV-20240122-ABC123",
    "billNumber": "VR-001",
    "billDate": "2024-01-22T10:30:00Z",
    "guestName": "Rajesh Kumar",
    "guestAddress": "123 Main Street, Hazaribagh",
    "guestState": "Jharkhand",
    "guestNationality": "Indian",
    "guestGstNumber": "20ABCDE1234F1Z5",
    "guestMobile": "9876543210",
    "companyName": "ABC Corporation",
    "companyCode": "DEPT-001",
    "roomNumber": "101",
    "roomType": "AC",
    "checkInDate": "2024-01-20T14:00:00Z",
    "checkoutDate": "2024-01-22T11:00:00Z",
    "days": 2,
    "roomCharges": 3000,
    "tariff": 0,
    "foodCharges": 130,
    "additionalGuestCharges": 500,
    "additionalGuests": 1,
    "gstEnabled": true,
    "gstPercent": 5,
    "gstAmount": 156.5,
    "advanceAmount": 500,
    "roundOff": 0.5,
    "totalAmount": 2787,
    "paymentMode": "CASH",
    "showGst": true,
    "foodItems": [
      {
        "name": "Coffee",
        "quantity": 2,
        "price": 50,
        "gstPercent": 5,
        "total": 100
      },
      {
        "name": "Tea",
        "quantity": 1,
        "price": 30,
        "gstPercent": 5,
        "total": 30
      }
    ]
  }
}
```

## Implementation Details

### File Structure
- `lib/bill-template.html` - HTML template with placeholders
- `lib/bill-template-utils.ts` - Utility functions for template rendering
- `lib/pdf-utils.ts` - Main PDF generation function (updated)

### Key Functions

#### `generateBillPDF(settings, billData)`
Main function that generates the PDF using jsPDF library.

**Parameters:**
- `settings`: HotelSettings object
- `billData`: BillData object with all bill information

**Returns:** jsPDF document object

### Calculation Logic

#### Room Charges Before Tax
```
Room Charges Before Tax = Base Room Charges + Tariff + (Additional Guest Charges × Additional Guests)
```

#### GST Calculation
```
GST on Room Charges = Room Charges Before Tax × GST%
GST on Food Charges = Food Charges × GST%
```

#### Total Bill Amount
```
Total Bill Amount = Room Charges Before Tax + GST on Room + Food Charges + GST on Food
```

#### Net Payable
```
Net Payable = Total Bill Amount - Advance + Round Off
```

## Usage Example

```typescript
import { generateBillPDF } from '@/lib/pdf-utils'

const settings = {
  name: 'HOTEL SAMRAT INN',
  address: 'OLD BUS STAND, HAZARIBAGH',
  phone: '7050240391',
  email: 'hotelsamratinn@gmail.com',
  gstin: '20AAIFH0390N3ZD'
}

const billData = {
  invoiceNumber: 'INV-001',
  billDate: new Date(),
  guestName: 'John Doe',
  roomCharges: 3000,
  foodCharges: 130,
  // ... other fields
}

const pdf = generateBillPDF(settings, billData)
const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
```

## Features

✅ **Pixel-accurate layout** - Matches traditional hotel bill design
✅ **A4 size** - Standard 210mm × 297mm format
✅ **Print-first** - Optimized for black & white printing
✅ **Dense layout** - Compact, no extra spacing
✅ **Table-based** - Uses tables for structured data
✅ **System fonts** - Times New Roman (serif) fallback
✅ **Thin borders** - 1px solid black borders
✅ **One page** - Everything fits on single page

## Notes

- All amounts use "Rs." prefix (no ₹ symbol for compatibility)
- Dates formatted in Indian format (DD MMM YYYY)
- Times formatted in 12-hour format with AM/PM
- Empty tables show empty rows to maintain structure
- GST sections only appear when `showGst` is true
- Company details table shows even if empty
