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
  orderTime?: Date | string
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
  showGst?: boolean
  foodItems?: FoodItem[]
  purpose?: string | null
}

// Helper to handle missing values with "NA"
function checkVal(value: any): string {
  if (value === null || value === undefined || value === '') {
    return 'NA'
  }
  return String(value)
}

function formatCurrency(amount: number): string {
  // Simple check for valid number
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00'
  return amount.toFixed(2)
}

export function generateBillPDF(settings: HotelSettings, billData: BillData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = 210
  const margin = 10
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  doc.setFont('times', 'normal')

  // ============================================
  // 1. Header Section
  // ============================================

  // Hotel Name
  doc.setFontSize(20)
  doc.setFont('times', 'bold')
  doc.text(settings.name.toUpperCase(), pageWidth / 2, yPos + 5, { align: 'center' })

  // Address
  yPos += 12
  doc.setFontSize(10)
  doc.setFont('times', 'normal')
  const addressLines = doc.splitTextToSize(settings.address || 'NA', contentWidth)
  doc.text(addressLines, pageWidth / 2, yPos, { align: 'center' })
  yPos += (addressLines.length * 4) + 1

  // Contact Info
  doc.setFontSize(9)
  const contactText = `Phone: ${checkVal(settings.phone)} | Email: ${checkVal(settings.email)}`
  doc.text(contactText, pageWidth / 2, yPos, { align: 'center' })
  yPos += 5

  const gstinText = `GSTIN: ${checkVal(settings.gstin)}`
  doc.text(gstinText, pageWidth / 2, yPos, { align: 'center' })
  yPos += 6

  // Horizontal Line
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 6

  // ============================================
  // 2. Bill Metadata
  // ============================================
  doc.setFontSize(10)
  doc.setFont('times', 'bold')

  // Row 1: Reg No | Bill No | Date
  const metaY = yPos
  doc.text(`Visitor's Register Sr. No.: ${checkVal(billData.visitorRegistrationNumber)}`, margin, metaY)

  const billNo = billData.billNumber || billData.invoiceNumber
  doc.text(`Bill No.: ${checkVal(billNo)}`, pageWidth / 2, metaY, { align: 'center' })

  const formattedDate = new Date(billData.billDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
  doc.text(`Bill Date: ${formattedDate}`, pageWidth - margin, metaY, { align: 'right' })
  yPos += 8

  // Horizontal Line
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 2

  // ============================================
  // 3. Guest & Room Details Table (Custom Grid)
  // ============================================
  const startGridY = yPos
  const midX = pageWidth / 2
  const rightX = pageWidth - margin
  const leftX = margin

  // We'll simulate a 2-column layout using text placement
  doc.setFontSize(9)
  doc.setFont('times', 'normal')

  const leftFields = [
    { label: 'Name', value: billData.guestName },
    { label: 'Address', value: billData.guestAddress },
    { label: 'Nationality', value: billData.guestNationality },
    { label: 'State (Code)', value: `${checkVal(billData.guestState)} (${checkVal(billData.guestStateCode)})` },
    { label: 'Mobile No', value: billData.guestMobile },
    { label: 'GST No', value: billData.guestGstNumber },
    { label: 'Company', value: billData.companyName },
    { label: 'Dept/Desig', value: `${checkVal(billData.department)} / ${checkVal(billData.designation)}` },
  ]

  const rightFields = [
    { label: 'Room No', value: billData.roomNumber },
    { label: 'Room Type', value: billData.roomType },
    { label: 'Check-In', value: formatDate(billData.checkInDate) },
    { label: 'Check-Out', value: formatDate(billData.checkoutDate) },
    { label: 'Pax (A/C/T)', value: `${billData.adults || 0} / ${billData.children || 0} / ${billData.totalGuests || 0}` },
    { label: 'Rate', value: formatCurrency(billData.rentPerDay || (billData.days && billData.days > 0 ? billData.roomCharges / billData.days : billData.roomCharges)) },
    { label: 'Days', value: billData.days },
    { label: 'Bus. Phone', value: billData.businessPhoneNumber },
  ]

  let leftY = startGridY + 5
  leftFields.forEach(field => {
    doc.setFont('times', 'bold')
    doc.text(`${field.label}:`, leftX + 2, leftY)
    doc.setFont('times', 'normal')
    const val = checkVal(field.value)
    // Wrap text if needed for address
    if (field.label === 'Address' && val.length > 35) {
      const lines = doc.splitTextToSize(val, 80)
      doc.text(lines, leftX + 25, leftY)
      leftY += (lines.length - 1) * 4
    } else {
      doc.text(val, leftX + 25, leftY)
    }
    leftY += 5
  })

  let rightY = startGridY + 5
  rightFields.forEach(field => {
    doc.setFont('times', 'bold')
    doc.text(`${field.label}:`, midX + 5, rightY)
    doc.setFont('times', 'normal')
    doc.text(checkVal(field.value), midX + 35, rightY)
    rightY += 5
  })

  const gridHeight = Math.max(leftY, rightY) - startGridY + 2

  // Draw Box around Details
  doc.rect(margin, startGridY, contentWidth, gridHeight)
  doc.line(midX, startGridY, midX, startGridY + gridHeight) // Vertical divider

  yPos = startGridY + gridHeight + 5

  // ============================================
  // 4. Charges Table
  // ============================================

  // Combine room charges line and food items
  const tableData: any[][] = []

  // Room Charge Row
  const rate = billData.rentPerDay || (billData.days && billData.days > 0 ? billData.roomCharges / billData.days : billData.roomCharges)
  tableData.push([
    formatDateOnly(billData.checkInDate),
    checkVal(billData.days),
    `Room Charges (${checkVal(billData.roomType)})`,
    formatCurrency(rate),
    formatCurrency(billData.roomCharges)
  ])

  // Additional Guests
  if (billData.additionalGuestCharges && billData.additionalGuestCharges > 0) {
    tableData.push([
      formatDateOnly(billData.checkInDate),
      checkVal(billData.additionalGuests),
      'Additional Guest Charges',
      formatCurrency(billData.additionalGuestCharges / (billData.additionalGuests || 1)),
      formatCurrency(billData.additionalGuestCharges)
    ])
  }

  // Tariff (Manual adjustment)
  if (billData.tariff) {
    tableData.push([
      '-',
      '1',
      'Tariff Adjustment',
      formatCurrency(billData.tariff),
      formatCurrency(billData.tariff)
    ])
  }

  // Food Items
  if (billData.foodItems && billData.foodItems.length > 0) {
    billData.foodItems.forEach(item => {
      tableData.push([
        item.orderTime ? formatDateOnly(item.orderTime) : '-',
        checkVal(item.quantity),
        item.name,
        formatCurrency(item.price),
        formatCurrency(item.total || item.price * item.quantity)
      ])
    })
  }

  autoTable(doc, {
    startY: yPos,
    head: [['Date', 'Qty', 'Product', 'Rate', 'Value']],
    body: tableData,
    theme: 'plain',
    styles: {
      font: 'times',
      fontSize: 9,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [240, 240, 240], // Light gray
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 15, halign: 'center' },
      2: {}, // Auto width
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' }
    },
    margin: { left: margin, right: margin },
  })

  yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5

  // ============================================
  // 5. Summary Section
  // ============================================

  // Ensure we don't page break awkwardly. If low on space, add page.
  if (yPos > 240) {
    doc.addPage()
    yPos = 20
  }

  const summaryLeftX = pageWidth / 2
  const summaryRightValX = pageWidth - margin - 5

  doc.setFontSize(9)
  doc.setFont('times', 'normal')

  const roomBase = billData.roomCharges + (billData.tariff || 0) + (billData.additionalGuestCharges || 0) * (billData.additionalGuests || 0)

  // Room Charges
  drawSummaryRow(doc, 'Room Charges Before Tax', roomBase, summaryLeftX, yPos, summaryRightValX)
  yPos += 5

  // GST Room
  // NOTE: Based on previous request, we removed GST toggle. 
  // If backend purely uses what's passed, and pass is disabled, this will be 0.
  // But if flags are passed as false, we just won't show it or show 0.
  // Requirement says "Charges Summary Section" includes "Add GST on Room Charges".
  // If standard is "NA" or "0.00", we should show it if the template strictly requires it.
  // However, specifically for "Remove GST" task, we probably should hide it or show 0.
  // Given previous task "Completely remove GST", I will show 0.00 or hide if logic dictates.
  // But strictly matching the sample layout usually implies showing the line with 0.00.
  // I'll show it as 0.00 to keep the layout consistent with a standard bill structure.

  if (billData.gstEnabled && billData.showGst) {
    const gstRoom = (roomBase * (billData.gstPercent || 0)) / 100
    drawSummaryRow(doc, 'Add GST on Room Charges', gstRoom, summaryLeftX, yPos, summaryRightValX)
    yPos += 5
  }

  // Food Charges
  drawSummaryRow(doc, 'Food Charges', billData.foodCharges, summaryLeftX, yPos, summaryRightValX)
  yPos += 5

  if (billData.gstEnabled && billData.showGst) {
    const gstFood = (billData.foodCharges * (billData.gstPercent || 0)) / 100
    drawSummaryRow(doc, 'Add GST on Food Charges', gstFood, summaryLeftX, yPos, summaryRightValX)
    yPos += 5
  }

  // Separator
  doc.line(summaryLeftX, yPos, pageWidth - margin, yPos)
  yPos += 5

  // Total Bill Amount
  doc.setFont('times', 'bold')
  const totalBill = billData.totalAmount - billData.roundOff + billData.advanceAmount // Reconstruct gross
  drawSummaryRow(doc, 'Total Bill Amount', totalBill, summaryLeftX, yPos, summaryRightValX)
  yPos += 5

  // Advance
  doc.setFont('times', 'normal')
  drawSummaryRow(doc, 'Less: Advance', billData.advanceAmount, summaryLeftX, yPos, summaryRightValX)
  yPos += 5

  // Round Off
  drawSummaryRow(doc, 'Round Off', billData.roundOff, summaryLeftX, yPos, summaryRightValX)
  yPos += 5

  // Net Payable
  yPos += 2
  doc.setFontSize(11)
  doc.setFont('times', 'bold')

  // Highlight Box
  doc.setFillColor(230, 230, 230)
  doc.rect(summaryLeftX - 2, yPos - 5, (pageWidth - margin) - summaryLeftX + 2, 8, 'F')

  doc.text('Net Payable Amount', summaryLeftX, yPos)
  doc.text(formatCurrency(billData.totalAmount), summaryRightValX, yPos, { align: 'right' })
  yPos += 15

  // Payment Mode
  doc.setFontSize(9)
  doc.setFont('times', 'italic')
  doc.text(`Bill Cleared Through: ${checkVal(billData.paymentMode)}`, margin, yPos - 25) // displayed on left opposite summary

  // ============================================
  // 6. Footer
  // ============================================
  // Fixed at bottom
  const footerY = 280

  doc.setFontSize(8)
  doc.setFont('times', 'italic')
  const terms = 'I agree that I am responsible for the full payment of this bill in the event if not paid by the company, organisation or person indicated.'
  doc.text(terms, pageWidth / 2, footerY - 15, { align: 'center', maxWidth: contentWidth - 20 })

  // Signatures
  doc.setFont('times', 'normal')
  doc.setLineWidth(0.5)

  doc.line(margin + 10, footerY, margin + 60, footerY)
  doc.text("Cashier's Signature", margin + 35, footerY + 5, { align: 'center' })

  doc.line(pageWidth - margin - 60, footerY, pageWidth - margin - 10, footerY)
  doc.text("Guest's Signature", pageWidth - margin - 35, footerY + 5, { align: 'center' })

  return doc
}

function drawSummaryRow(doc: jsPDF, label: string, value: number, x: number, y: number, valX: number) {
  doc.text(label, x, y)
  doc.text(formatCurrency(value), valX, y, { align: 'right' })
}

function formatDate(date: any): string {
  if (!date) return 'NA'
  try {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  } catch (e) {
    return 'NA'
  }
}

function formatDateOnly(date: any): string {
  if (!date) return 'NA'
  try {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  } catch (e) {
    return 'NA'
  }
}

export function maskIdNumber(idNumber: string | null | undefined, idType?: string): string {
  if (!idNumber) return 'N/A'
  if (idNumber.length >= 4) {
    return `XXXX XXXX ${idNumber.substring(idNumber.length - 4)}`
  }
  return idNumber
}
