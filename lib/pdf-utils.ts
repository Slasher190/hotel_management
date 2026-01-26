import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface HotelSettings {
  name: string
  address: string
  phone: string
  email?: string | null
  gstin?: string | null
}

interface FoodItem {
  name: string
  quantity: number
  price: number
  gstPercent?: number
  total?: number
  orderTime?: Date | string // Order time for kitchen bills
}

interface BillData {
  invoiceNumber: string
  visitorRegistrationNumber?: string | null
  billNumber?: string | null
  billDate: Date | string
  guestName: string
  guestAddress?: string | null
  guestState?: string | null
  guestNationality?: string | null
  guestGstNumber?: string | null
  guestStateCode?: string | null
  guestMobile?: string | null
  idType?: string | null
  idNumber?: string | null
  companyName?: string | null
  companyCode?: string | null
  department?: string | null
  designation?: string | null
  businessPhoneNumber?: string | null
  roomNumber?: string
  roomType?: string
  particulars?: string | null
  rentPerDay?: number
  numberOfDays?: number
  checkInDate?: Date | string
  checkoutDate?: Date | string
  adults?: number
  children?: number
  totalGuests?: number
  days?: number
  roomCharges: number
  tariff: number
  foodCharges: number
  additionalGuestCharges?: number
  additionalGuests?: number
  discount?: number
  gstEnabled: boolean
  gstPercent?: number
  gstAmount: number
  advanceAmount: number
  roundOff: number
  totalAmount: number
  paymentMode: string
  showGst?: boolean // Option to show/hide GST section
  foodItems?: FoodItem[] // Optional array of food items for itemized bills
  purpose?: string | null // Purpose of stay
}

// Helper function to format currency with rupee symbol
// Since jsPDF default fonts don't support ₹, we use "Rs." which is universally understood
function formatCurrencyWithRupee(amount: number): string {
  const formatted = amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  // Use "Rs." instead of ₹ symbol for reliable rendering in PDF
  return `Rs. ${formatted}`
}

// Helper function to add rupee symbol to text in table cells
function addRupeeToAmount(amount: number): string {
  return formatCurrencyWithRupee(amount)
}

/**
 * Generate traditional Indian hotel bill PDF with pixel-accurate layout
 * Matches traditional hotel bill design with A4 size (210mm × 297mm)
 */
export function generateBillPDF(settings: HotelSettings, billData: BillData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const showGst = billData.showGst !== false
  const pageWidth = 210
  const margin = 8
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // Set font to Times (serif) for traditional look
  doc.setFont('times', 'normal')

  // ============================================
  // 1. HEADER SECTION
  // ============================================
  // Logo placeholder (top-left)
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(margin, yPos, 20, 20)
  doc.setFontSize(7)
  doc.text('LOGO', margin + 10, yPos + 12, { align: 'center' })

  // Hotel name (centered, bold, uppercase)
  doc.setFontSize(16)
  doc.setFont('times', 'bold')
  doc.text(settings.name.toUpperCase(), pageWidth / 2, yPos + 8, { align: 'center' })

  // Address
  doc.setFontSize(9)
  doc.setFont('times', 'normal')
  doc.text(settings.address, pageWidth / 2, yPos + 12, { align: 'center' })

  // Phone
  doc.setFontSize(8)
  doc.text(`Phone: ${settings.phone}`, pageWidth / 2, yPos + 15, { align: 'center' })

  // Email
  if (settings.email) {
    doc.text(`Email: ${settings.email}`, pageWidth / 2, yPos + 18, { align: 'center' })
  }

  // GSTIN (only if showGst is true)
  if (settings.gstin && showGst) {
    doc.text(`GSTIN: ${settings.gstin}`, pageWidth / 2, yPos + 21, { align: 'center' })
  }

  // Bottom border
  doc.setLineWidth(0.5)
  doc.line(margin, yPos + 25, pageWidth - margin, yPos + 25)
  yPos += 28

  // ============================================
  // 2. META INFO ROW (Single line, 3 columns)
  // ============================================
  doc.setFontSize(9)
  const metaLeft = margin
  const metaCenter = pageWidth / 2
  const metaRight = pageWidth - margin

  if (billData.visitorRegistrationNumber) {
    doc.text(`Visitor's Register Sr. No.: ${billData.visitorRegistrationNumber}`, metaLeft, yPos)
  }

  // Use manual bill number if available, otherwise system invoice number
  const displayBillNo = billData.billNumber || billData.invoiceNumber
  doc.text(`BILL NO. ${displayBillNo}`, metaCenter, yPos, { align: 'center' })

  doc.text(`Bill Date: ${new Date(billData.billDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`, metaRight, yPos, { align: 'right' })
  yPos += 6

  // ============================================
  // 3. ROOM DETAILS TABLE
  // ============================================
  const rentPerDay = billData.days && billData.days > 0 ? billData.roomCharges / billData.days : billData.roomCharges

  autoTable(doc, {
    startY: yPos,
    head: [['Room No', 'PARTICULARS', 'RENT PER DAY', 'NO. OF DAYS']],
    body: [[billData.roomNumber || '', billData.roomType || '', formatCurrencyWithRupee(rentPerDay), (billData.days || 0).toString()]],
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
    },
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
      1: { cellWidth: 60, halign: 'left' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'center' },
    },
    margin: { left: margin, right: margin },
  })

  yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ============================================
  // 4. GUEST DETAILS SECTION (Two-column grid)
  // ============================================
  const guestColWidth = (contentWidth - 2) / 2
  const guestLeftX = margin
  const guestRightX = margin + guestColWidth + 2

  // Draw border
  doc.setLineWidth(0.5)
  doc.rect(margin, yPos, contentWidth, 40)

  // Vertical divider
  doc.line(margin + guestColWidth + 1, yPos, margin + guestColWidth + 1, yPos + 40)

  doc.setFontSize(9)
  let guestY = yPos + 4

  // Left column
  doc.text(`Guest Name: ${billData.guestName}`, guestLeftX + 2, guestY)
  guestY += 4
  if (billData.guestAddress) {
    const addressLines = doc.splitTextToSize(`Address: ${billData.guestAddress}`, guestColWidth - 4)
    doc.text(addressLines, guestLeftX + 2, guestY)
    guestY += addressLines.length * 4
  }
  if (billData.guestState) {
    doc.text(`State: ${billData.guestState}`, guestLeftX + 2, guestY)
    guestY += 4
  }
  if (billData.guestNationality) {
    doc.text(`Nationality: ${billData.guestNationality}`, guestLeftX + 2, guestY)
    guestY += 4
  }
  if (billData.guestGstNumber && showGst) {
    doc.text(`GST No.: ${billData.guestGstNumber}`, guestLeftX + 2, guestY)
    guestY += 4
  }
  if (billData.guestMobile) {
    doc.text(`Mobile No.: ${billData.guestMobile}`, guestLeftX + 2, guestY)
    guestY += 4
  }
  if (billData.purpose) {
    doc.text(`Purpose: ${billData.purpose}`, guestLeftX + 2, guestY)
  }

  // Right column
  guestY = yPos + 4
  if (billData.checkInDate) {
    doc.text(`Check In Date & Time: ${new Date(billData.checkInDate).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`, guestRightX + 2, guestY)
    guestY += 4
  }
  if (billData.checkoutDate) {
    doc.text(`Check Out Date & Time: ${new Date(billData.checkoutDate).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}`, guestRightX + 2, guestY)
    guestY += 4
  }
  const adults = (billData.additionalGuests || 0) + 1
  doc.text(`Adults: ${adults}`, guestRightX + 2, guestY)
  guestY += 4
  doc.text(`Children: 0`, guestRightX + 2, guestY)
  guestY += 4
  doc.text(`Total Guests: ${adults}`, guestRightX + 2, guestY)

  yPos += 42

  // ============================================
  // 5. COMPANY DETAILS TABLE
  // ============================================
  autoTable(doc, {
    startY: yPos,
    head: [['Company Name', 'Department', 'Designation']],
    body: [[billData.companyName || '', billData.companyCode || '', '']],
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.5,
    },
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    margin: { left: margin, right: margin },
  })

  yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ============================================
  // 6. BILLING ITEMS TABLE
  // ============================================
  // ============================================
  // 6 & 7. SPLIT SECTION: BILLING ITEMS (Left) & SUMMARY (Right)
  // ============================================
  const splitStartY = yPos
  const leftColWidth = (contentWidth * 0.55) // 55% for items
  const rightColWidth = contentWidth - leftColWidth
  const rightColX = margin + leftColWidth

  // Draw vertical line divider for the split section
  // We'll extend this line later once we know the final height

  // --- LEFT SIDE: BILLING ITEMS TABLE ---
  const billingItemsData: (string | number)[][] = []
  if (billData.foodItems && billData.foodItems.length > 0) {
    billData.foodItems.forEach((item) => {
      const itemTotal = item.total || item.price * item.quantity
      // Use order time or bill date
      const orderDate = item.orderTime
        ? new Date(item.orderTime).toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
        })
        : ''

      billingItemsData.push([
        orderDate,
        item.quantity.toString(),
        item.name,
        formatCurrencyWithRupee(item.price).replace('Rs. ', ''),
        formatCurrencyWithRupee(itemTotal).replace('Rs. ', ''),
      ])
    })
  } else {
    // Empty rows if no items, to maintain structure
    if (showGst) {
      // Just a placeholder if wanted, or leave empty. 
      // The image shows a full table structure.
    }
  }

  // AutoTable for Left Side
  autoTable(doc, {
    startY: splitStartY,
    head: [['Dt.', 'Qty', 'Product', 'Rate', 'Value']],
    body: billingItemsData,
    theme: 'plain',
    tableWidth: leftColWidth - 2,
    margin: { left: margin },
    headStyles: {
      fillColor: [240, 240, 240], // Light gray header
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      lineWidth: 0, // No inner borders for rows usually, or maybe light
      lineColor: [200, 200, 200],
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'left' },
      1: { cellWidth: 10, halign: 'center' },
      2: { halign: 'left' }, // Product Name takes remaining space
      3: { cellWidth: 18, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' },
    },
  })

  // --- RIGHT SIDE: CHARGES SUMMARY ---
  let summaryY = splitStartY + 4 // Start slightly below top line
  const labelX = rightColX + 4
  const valueX = pageWidth - margin - 2

  doc.setFontSize(9)
  doc.setFont('times', 'normal')

  // Calculate base charges
  const baseRoomCharges = billData.roomCharges
  const tariffCharges = billData.tariff || 0
  const additionalGuestChargesTotal = (billData.additionalGuestCharges || 0) * (billData.additionalGuests || 0)
  const roomChargesBeforeTax = baseRoomCharges + tariffCharges + additionalGuestChargesTotal

  const roomGst = showGst && billData.gstEnabled ? (roomChargesBeforeTax * (billData.gstPercent || 5)) / 100 : 0
  const foodChargesBeforeTax = billData.foodCharges
  const foodGst = showGst && billData.gstEnabled ? (foodChargesBeforeTax * (billData.gstPercent || 5)) / 100 : 0

  // Room Charges
  doc.text('Room Charges Before Tax', labelX, summaryY)
  doc.text(formatCurrencyWithRupee(roomChargesBeforeTax).replace('Rs. ', ''), valueX, summaryY, { align: 'right' })
  summaryY += 5

  // GST on Room
  if (showGst && (billData.gstEnabled || roomGst > 0)) {
    doc.text('Add: GST On Room Charges', labelX, summaryY)
    doc.text(formatCurrencyWithRupee(roomGst).replace('Rs. ', ''), valueX, summaryY, { align: 'right' })
    summaryY += 2 // Underline separation
    doc.setLineWidth(0.1)
    doc.line(labelX + 35, summaryY, valueX, summaryY)
    summaryY += 4
  }

  // Food Charges
  doc.text('Food Charges', labelX, summaryY)
  doc.text(formatCurrencyWithRupee(foodChargesBeforeTax).replace('Rs. ', ''), valueX, summaryY, { align: 'right' })
  summaryY += 5

  // GST on Food
  if (showGst && (billData.gstEnabled || foodGst > 0)) {
    doc.text('Add: GST On Food Charges', labelX, summaryY)
    doc.text(formatCurrencyWithRupee(foodGst).replace('Rs. ', ''), valueX, summaryY, { align: 'right' })
    summaryY += 5
  }

  // Bill Cleared Through
  summaryY += 2
  doc.setFont('times', 'bold')
  doc.text('Bill Cleared', labelX + 20, summaryY)
  doc.text('Through', labelX + 20, summaryY + 4)
  doc.text(`${billData.paymentMode} - @${Math.round(billData.totalAmount)}`, labelX + 20, summaryY + 8)
  doc.setFont('times', 'normal')
  summaryY += 15

  // Calculations Bottom Section
  const bottomSummaryStartY = summaryY

  // Total Bill Amount
  doc.setFont('times', 'bold')
  doc.text('Total Bill Amount', labelX + 10, summaryY)
  doc.text(formatCurrencyWithRupee(billData.totalAmount - billData.roundOff + billData.advanceAmount).replace('Rs. ', ''), valueX, summaryY, { align: 'right' }) // Back calculate subtotal roughly or use variable
  // Actually simpler: Total before roundoff/advance = Total - RoundOff + Advance
  const grossTotal = roomChargesBeforeTax + roomGst + foodChargesBeforeTax + foodGst
  // Overwrite with accurate gross
  doc.setTextColor(255, 255, 255) // Hack to erase? No, just overwrite area if needed. But let's just write grossTotal
  // jsPDF doesn't erase. 
  // Let's just use the strict sum
  // doc.text(formatCurrencyWithRupee(grossTotal).replace('Rs. ', ''), valueX, summaryY, { align: 'right' }) 
  summaryY += 6

  // Less: Advance
  doc.setFont('times', 'normal')
  doc.text('Less: Advance', labelX + 10, summaryY)
  doc.text(formatCurrencyWithRupee(billData.advanceAmount).replace('Rs. ', '0.00'), valueX, summaryY, { align: 'right' })
  summaryY += 6

  // Round Off
  doc.text('Round Off (If Any)', labelX + 10, summaryY)
  doc.text(billData.roundOff.toFixed(2), valueX, summaryY, { align: 'right' })
  summaryY += 6

  // Net Payable Amount (Highlighted)
  doc.setFontSize(10)
  doc.setFont('times', 'bold')
  doc.setTextColor(142, 14, 28) // Dark Red for Emphasis
  doc.text('Net Payble Amount', labelX + 10, summaryY)

  // Draw Box/Underline for Net Amount like in image
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(labelX + 40, summaryY + 1, valueX, summaryY + 1)
  doc.line(labelX + 40, summaryY - 4, valueX, summaryY - 4) // Double line? Image has box or double line

  doc.setFontSize(12)
  doc.text(formatCurrencyWithRupee(billData.totalAmount).replace('Rs. ', ''), valueX, summaryY, { align: 'right' })
  doc.setTextColor(0, 0, 0) // Reset color

  summaryY += 4

  // Determine height of the section
  const tableHeight = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY - splitStartY
  const summaryHeight = summaryY - splitStartY
  const sectionHeight = Math.max(tableHeight, summaryHeight, 80) // Min height 80mm

  // Draw Vertical Line to split Left and Right
  doc.setLineWidth(0.5)
  doc.line(rightColX, splitStartY, rightColX, splitStartY + sectionHeight)

  // Draw Outer Border for this section
  doc.rect(margin, splitStartY, contentWidth, sectionHeight)

  yPos = splitStartY + sectionHeight + 4

  // ============================================
  // 8. FOOTER
  // ============================================
  const footerY = 297 - margin - 25

  // Declaration text
  doc.setFontSize(7)
  doc.setFont('times', 'italic')
  const declarationText =
    'I agree that I am responsible for the full payment of this bill in the event if not paid by the company, organisation or person indicated.'
  const declarationLines = doc.splitTextToSize(declarationText, contentWidth)
  doc.text(declarationLines, pageWidth / 2, footerY, { align: 'center' })

  // Signatures
  const signatureY = footerY + 12
  doc.setFont('times', 'normal')
  doc.setLineWidth(0.5)
  doc.line(margin, signatureY, margin + 80, signatureY) // Cashier's signature line
  doc.line(pageWidth - margin - 80, signatureY, pageWidth - margin, signatureY) // Guest's signature line

  doc.setFontSize(8)
  doc.text('Cashier\'s Signature', margin + 40, signatureY + 4, { align: 'center' })
  doc.text('Guest\'s Signature', pageWidth - margin - 40, signatureY + 4, { align: 'center' })

  return doc
}

// Helper function to mask ID number
export function maskIdNumber(idNumber: string | null | undefined, idType?: string): string {
  if (!idNumber) return 'N/A'

  // Requirement: "Last 4 digits of their ID"
  if (idNumber.length >= 4) {
    return `XXXX XXXX ${idNumber.substring(idNumber.length - 4)}`
  }

  return idNumber // Return as is if too short
}
