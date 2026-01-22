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
}

interface BillData {
  invoiceNumber: string
  billNumber?: string | null
  billDate: Date | string
  guestName: string
  guestAddress?: string | null
  guestState?: string | null
  guestNationality?: string | null
  guestGstNumber?: string | null
  guestStateCode?: string | null
  guestMobile?: string | null
  companyName?: string | null
  companyCode?: string | null
  roomNumber?: string
  roomType?: string
  checkInDate?: Date | string
  checkoutDate?: Date | string
  days?: number
  roomCharges: number
  tariff: number
  foodCharges: number
  additionalGuestCharges?: number
  additionalGuests?: number
  gstEnabled: boolean
  gstPercent?: number
  gstAmount: number
  advanceAmount: number
  roundOff: number
  totalAmount: number
  paymentMode: string
  showGst?: boolean
  foodItems?: FoodItem[]
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Helper function to format date
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// Helper function to format date and time
function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Generate traditional Indian hotel bill PDF with pixel-accurate layout
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

  if (billData.billNumber) {
    doc.text(`Visitor's Register Sr. No.: ${billData.billNumber}`, metaLeft, yPos)
  }
  doc.text(`Bill No.: ${billData.invoiceNumber}`, metaCenter, yPos, { align: 'center' })
  doc.text(`Bill Date: ${formatDate(billData.billDate)}`, metaRight, yPos, { align: 'right' })
  yPos += 6

  // ============================================
  // 3. ROOM DETAILS TABLE
  // ============================================
  const rentPerDay = billData.days && billData.days > 0 ? billData.roomCharges / billData.days : billData.roomCharges

  autoTable(doc, {
    startY: yPos,
    head: [['Room No', 'PARTICULARS', 'RENT PER DAY', 'NO. OF DAYS']],
    body: [[billData.roomNumber || '', billData.roomType || '', formatCurrency(rentPerDay), (billData.days || 0).toString()]],
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
  const guestColWidth = (contentWidth - 2) / 2 // Minus border width
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
  }

  // Right column
  guestY = yPos + 4
  if (billData.checkInDate) {
    doc.text(`Check In Date & Time: ${formatDateTime(billData.checkInDate)}`, guestRightX + 2, guestY)
    guestY += 4
  }
  if (billData.checkoutDate) {
    doc.text(`Check Out Date & Time: ${formatDateTime(billData.checkoutDate)}`, guestRightX + 2, guestY)
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
  const billingItemsData: (string | number)[][] = []
  if (billData.foodItems && billData.foodItems.length > 0) {
    billData.foodItems.forEach((item) => {
      const itemTotal = item.total || item.price * item.quantity
      billingItemsData.push([
        formatDate(new Date()),
        item.quantity.toString(),
        item.name,
        formatCurrency(item.price),
        formatCurrency(itemTotal),
      ])
    })
  } else {
    // Empty row to keep table visible
    billingItemsData.push(['', '', '', '', ''])
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Dt.', 'Qty', 'Product', 'Rate', 'Value']],
    body: billingItemsData,
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
      0: { halign: 'left' },
      1: { halign: 'center' },
      2: { halign: 'left' },
      3: { halign: 'right' },
      4: { halign: 'right' },
    },
    margin: { left: margin, right: margin },
  })

  yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4

  // ============================================
  // 7. CHARGES SUMMARY (Right aligned)
  // ============================================
  const summaryRightX = pageWidth - margin
  const summaryLabelX = summaryRightX - 60
  let summaryY = yPos

  doc.setFontSize(9)
  doc.setFont('times', 'normal')

  // Calculate charges
  const roomChargesBeforeTax = billData.roomCharges
  const roomGst = showGst && billData.gstEnabled ? (roomChargesBeforeTax * (billData.gstPercent || 5)) / 100 : 0
  const foodChargesBeforeTax = billData.foodCharges
  const foodGst = showGst && billData.gstEnabled ? (foodChargesBeforeTax * (billData.gstPercent || 5)) / 100 : 0

  // Room Charges Before Tax
  doc.text('Room Charges Before Tax', summaryLabelX, summaryY, { align: 'right' })
  doc.text(formatCurrency(roomChargesBeforeTax), summaryRightX, summaryY, { align: 'right' })
  summaryY += 4

  // Add: GST on Room Charges
  if (showGst && roomGst > 0) {
    doc.text('Add: GST on Room Charges', summaryLabelX, summaryY, { align: 'right' })
    doc.text(formatCurrency(roomGst), summaryRightX, summaryY, { align: 'right' })
    summaryY += 4
  }

  // Food Charges
  if (billData.foodCharges > 0) {
    doc.text('Food Charges', summaryLabelX, summaryY, { align: 'right' })
    doc.text(formatCurrency(foodChargesBeforeTax), summaryRightX, summaryY, { align: 'right' })
    summaryY += 4
  }

  // Add: GST on Food Charges
  if (showGst && foodGst > 0) {
    doc.text('Add: GST on Food Charges', summaryLabelX, summaryY, { align: 'right' })
    doc.text(formatCurrency(foodGst), summaryRightX, summaryY, { align: 'right' })
    summaryY += 4
  }

  // Bill Cleared Through
  doc.text('Bill Cleared Through', summaryLabelX, summaryY, { align: 'right' })
  doc.text(billData.paymentMode, summaryRightX, summaryY, { align: 'right' })
  summaryY += 4

  // Total Bill Amount
  doc.text('Total Bill Amount', summaryLabelX, summaryY, { align: 'right' })
  doc.text(formatCurrency(billData.totalAmount), summaryRightX, summaryY, { align: 'right' })
  summaryY += 4

  // Less: Advance
  if (billData.advanceAmount > 0) {
    doc.text('Less: Advance', summaryLabelX, summaryY, { align: 'right' })
    doc.text(formatCurrency(billData.advanceAmount), summaryRightX, summaryY, { align: 'right' })
    summaryY += 4
  }

  // Round Off
  if (billData.roundOff !== 0) {
    doc.text('Round Off', summaryLabelX, summaryY, { align: 'right' })
    doc.text(formatCurrency(Math.abs(billData.roundOff)), summaryRightX, summaryY, { align: 'right' })
    summaryY += 4
  }

  // Top border for total
  doc.setLineWidth(0.5)
  doc.line(summaryLabelX - 5, summaryY - 2, summaryRightX, summaryY - 2)

  // Net Payable Amount (bold + slightly larger)
  doc.setFontSize(11)
  doc.setFont('times', 'bold')
  doc.text('Net Payable Amount', summaryLabelX, summaryY + 2, { align: 'right' })
  doc.text(formatCurrency(billData.totalAmount), summaryRightX, summaryY + 2, { align: 'right' })

  summaryY += 8

  // ============================================
  // 8. FOOTER
  // ============================================
  const footerY = 297 - margin - 25 // Bottom of page minus margin and footer height

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
