
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import fs from 'fs'
import path from 'path'

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

function checkVal(value: any): string {
  if (value === null || value === undefined || value === '') {
    return 'NA'
  }
  return String(value)
}

function formatCurrency(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '0.00'
  return amount.toFixed(2)
}

export function generateBillPDF(settings: HotelSettings, billData: BillData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  // Dimensions
  const pageWidth = 210
  const pageHeight = 297
  const margin = 10
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  doc.setFont('times', 'normal')

  // ============================================
  // 1. Header Section
  // ============================================

  // Add Logo
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.jpg')
    if (fs.existsSync(logoPath)) {
      const logoData = fs.readFileSync(logoPath).toString('base64')
      doc.addImage(logoData, 'JPEG', margin, yPos, 30, 20)
    }
  } catch (err) {
    console.error('Error loading logo:', err)
  }

  // Hotel Info (Centered relative to page, but adjusted for logo)
  const centerX = pageWidth / 2

  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(190, 30, 45) // Dark Red color for Hotel Name
  doc.text(settings.name.toUpperCase(), centerX, yPos + 8, { align: 'center' })

  doc.setTextColor(0, 0, 0) // Reset to black
  doc.setFontSize(10)
  doc.setFont('times', 'normal')

  yPos += 16
  const addressLines = doc.splitTextToSize(settings.address || 'NA', contentWidth - 40)
  doc.text(addressLines, centerX, yPos, { align: 'center' })
  yPos += (addressLines.length * 4) + 2

  doc.setFontSize(9)
  const contactText = `Phone: ${checkVal(settings.phone)} | Email: ${checkVal(settings.email)}`
  doc.text(contactText, centerX, yPos, { align: 'center' })
  yPos += 5

  const gstinText = `GSTIN : ${checkVal(settings.gstin)}`
  doc.text(gstinText, centerX, yPos, { align: 'center' })
  yPos += 7

  // Border below header
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  // ============================================
  // 2. Meta Data Row
  // ============================================
  const metaY = yPos + 6
  doc.setFontSize(10)
  doc.setFont('times', 'bold')

  // Left: Visitor Register No
  doc.text(`Visitor's Register Sr. No. ${checkVal(billData.visitorRegistrationNumber)}`, margin + 2, metaY)

  // Center: Bill No
  const billNo = billData.billNumber || billData.invoiceNumber
  doc.text(`BILL NO. ${checkVal(billNo)}`, centerX, metaY, { align: 'center' })

  // Right: Bill Date
  const formattedDate = formatDateOnly(billData.billDate)
  doc.text(`Bill Date:   ${formattedDate}`, pageWidth - margin - 2, metaY, { align: 'right' })

  yPos = metaY + 4
  doc.line(margin, yPos, pageWidth - margin, yPos) // Line below meta

  // ============================================
  // 3. Room Details Table (Fixed Height)
  // ============================================

  // Table Headers
  const tableTopY = yPos
  const col1X = margin
  const col2X = margin + 35
  const col3X = margin + 110
  const col4X = margin + 155
  const colEnd = pageWidth - margin

  // Vertical Lines for Room Table
  // We will draw them after determining height, but typically this section 
  // matches the guest info section height or is a fixed blocks.
  // Based on sample: Room No | Particulars | Rent Per Day | No of Days
  // Followed by Guest info. Actually the sample shows a specific grid structure.

  // Let's use autoTable for the layout to be clean, or manual drawing.
  // Manual drawing gives exact control for the "Sample" look.

  const roomRowHeight = 15

  // Header Row
  doc.setFontSize(9)
  doc.setFont('times', 'bold')
  const headerY = tableTopY + 5

  doc.text('Room No.', col1X + 17, headerY, { align: 'center' })
  doc.text('PARTICULARS', col2X + 37, headerY, { align: 'center' })
  doc.text('RENT PER DAY', col3X + 22, headerY, { align: 'center' })
  doc.text('No. Of Days', col4X + 17, headerY, { align: 'center' })

  doc.line(margin, tableTopY + 8, pageWidth - margin, tableTopY + 8)

  // Value Row
  const valY = tableTopY + 14
  doc.setFont('times', 'normal')

  const roomRate = billData.rentPerDay || (billData.days && billData.days > 0 ? billData.roomCharges / billData.days : billData.roomCharges)

  doc.text(checkVal(billData.roomNumber), col1X + 17, valY, { align: 'center' })
  doc.text(checkVal(billData.roomType), col2X + 37, valY, { align: 'center' })
  doc.text(formatCurrency(roomRate), col3X + 22, valY, { align: 'center' }) // Sample aligns center/right
  doc.text(checkVal(billData.days), col4X + 17, valY, { align: 'center' })

  doc.line(margin, tableTopY + 20, pageWidth - margin, tableTopY + 20)

  // Vertical lines for Room Table
  doc.line(margin, tableTopY, margin, tableTopY + 20) // Left
  doc.line(col2X, tableTopY, col2X, tableTopY + 20)
  doc.line(col3X, tableTopY, col3X, tableTopY + 20)
  doc.line(col4X, tableTopY, col4X, tableTopY + 20)
  doc.line(colEnd, tableTopY, colEnd, tableTopY + 20) // Right

  yPos = tableTopY + 20

  // ============================================
  // 4. Guest Details Section
  // ============================================
  // Guest Name Row
  doc.setFont('times', 'bold')
  doc.text('Guest Name and Address', margin + 2, yPos + 4)

  // Check In / Check Out Headers (Right side)
  doc.text('Check In On', col3X + 22, yPos + 4, { align: 'center' })
  doc.text('Check Out at', col4X + 17, yPos + 4, { align: 'center' })

  doc.line(col3X, yPos, col3X, yPos + 25) // Vertical divider continued
  doc.line(col4X, yPos, col4X, yPos + 25) // Vertical divider continued
  doc.line(colEnd, yPos, colEnd, yPos + 25)
  doc.line(margin, yPos, margin, yPos + 25)

  // Divider between header and values
  doc.line(col3X, yPos + 6, colEnd, yPos + 6)

  // Values
  yPos += 10

  // Left: Name
  doc.setFontSize(12)
  doc.text(`Mr./Mrs. ${billData.guestName.toUpperCase()}`, margin + 5, yPos)

  // Right: Dates
  doc.setFontSize(9)
  doc.setFont('times', 'normal')

  const checkIn = billData.checkInDate ? new Date(billData.checkInDate) : null
  const checkOut = billData.checkoutDate ? new Date(billData.checkoutDate) : null

  // Check In Date
  doc.text(formatDateOnly(checkIn), col3X + 22, yPos, { align: 'center' })
  doc.text(formatTimeOnly(checkIn), col3X + 22, yPos + 5, { align: 'center' })

  // Check Out Date
  doc.text(formatDateOnly(checkOut), col4X + 17, yPos, { align: 'center' })
  doc.text(formatTimeOnly(checkOut), col4X + 17, yPos + 5, { align: 'center' })

  // Address Line (Bottom of name block)
  yPos += 10
  doc.setFontSize(9)
  const address = checkVal(billData.guestAddress)
  doc.text(address.substring(0, 45), margin + 2, yPos) // Truncate if too long primarily
  doc.text(checkVal(billData.guestNationality), margin + 80, yPos)

  // Bottom line of Name/Date section
  yPos += 5
  doc.line(margin, yPos, pageWidth - margin, yPos)

  // GST / State / Pax Row
  const gstRowY = yPos
  const gstRowHeight = 12

  // Vertical lines
  doc.line(margin, gstRowY, margin, gstRowY + gstRowHeight)
  doc.line(margin + 80, gstRowY, margin + 80, gstRowY + gstRowHeight) // Split GST/State
  doc.line(col3X, gstRowY, col3X, gstRowY + gstRowHeight)
  doc.line(col4X, gstRowY, col4X, gstRowY + gstRowHeight) // Split Adults/Child/Total ? No, split differently
  // Sample: GST No | State Code || Adults | Children | Total Guests
  // Let's use col3X and col4X splits for Pax?
  // Sample uses smaller cols for pax.
  const paxCol1 = col3X
  const paxCol2 = col3X + 22
  const paxCol3 = col3X + 44

  doc.line(paxCol1, gstRowY, paxCol1, gstRowY + gstRowHeight)
  doc.line(paxCol2, gstRowY, paxCol2, gstRowY + gstRowHeight)
  doc.line(paxCol3, gstRowY, paxCol3, gstRowY + gstRowHeight) // End line?

  // Headers
  doc.setFont('times', 'bold')
  doc.text(`GST No.  ${checkVal(billData.guestGstNumber)}`, margin + 2, gstRowY + 7)
  doc.text(`State Code  ${checkVal(billData.guestStateCode)}`, margin + 85, gstRowY + 7)

  doc.setFontSize(8)
  doc.text('Adults', paxCol1 + 11, gstRowY + 4, { align: 'center' })
  doc.text('Children', paxCol2 + 11, gstRowY + 4, { align: 'center' })
  doc.text('Total Guests', colEnd - 11, gstRowY + 4, { align: 'center' })

  // Values for Pax
  doc.line(paxCol1, gstRowY + 5, colEnd, gstRowY + 5)
  doc.setFont('times', 'normal')
  doc.text(checkVal(billData.adults || 0), paxCol1 + 11, gstRowY + 10, { align: 'center' })
  doc.text(checkVal(billData.children || 0), paxCol2 + 11, gstRowY + 10, { align: 'center' })
  doc.text(checkVal(billData.totalGuests || 0), colEnd - 11, gstRowY + 10, { align: 'center' })

  doc.line(margin, gstRowY + gstRowHeight, pageWidth - margin, gstRowY + gstRowHeight)

  yPos = gstRowY + gstRowHeight

  // Mobile / Business Phone Row
  doc.setFont('times', 'bold')
  doc.setFontSize(9)
  doc.text('Mobile No.', margin + 30, yPos + 4)
  doc.text('Business Phone', col3X + 10, yPos + 4)

  doc.line(margin, yPos, margin, yPos + 12)
  doc.line(centerX, yPos, centerX, yPos + 12) // Center divider
  doc.line(colEnd, yPos, colEnd, yPos + 12)
  doc.line(margin, yPos + 5, colEnd, yPos + 5) // Header divider

  doc.setFont('times', 'normal')
  doc.setFontSize(10)
  doc.text(checkVal(billData.guestMobile), margin + 30, yPos + 10)
  doc.text(checkVal(billData.businessPhoneNumber), col3X + 10, yPos + 10)

  yPos += 12
  doc.line(margin, yPos, colEnd, yPos)

  // Company Row
  doc.setFont('times', 'bold')
  doc.setFontSize(9)
  doc.text('Company Name', margin + 30, yPos + 4, { align: 'center' })
  doc.text('Department', col3X - 10, yPos + 4, { align: 'center' })
  doc.text('Designation', colEnd - 20, yPos + 4, { align: 'center' })

  doc.line(margin, yPos + 5, colEnd, yPos + 5)
  doc.line(margin, yPos, margin, yPos + 15)
  doc.line(col2X + 10, yPos, col2X + 10, yPos + 15) // Split Comp/Dept
  doc.line(col3X + 25, yPos, col3X + 25, yPos + 15) // Split Dept/Desig
  doc.line(colEnd, yPos, colEnd, yPos + 15)

  doc.setFont('times', 'normal')
  doc.text(checkVal(billData.companyName), margin + 30, yPos + 11, { align: 'center' })
  doc.text(checkVal(billData.department), col3X - 10, yPos + 11, { align: 'center' })
  doc.text(checkVal(billData.designation), colEnd - 20, yPos + 11, { align: 'center' })

  yPos += 15
  doc.line(margin, yPos, colEnd, yPos)

  // ============================================
  // 5. Charges & Summary Section (Split)
  // ============================================
  const splitTop = yPos
  const sectionHeight = 100 // Fixed height for main body
  const splitX = pageWidth * 0.45 // 45% for Items, 55% for Summary

  // Vertical split line
  doc.line(splitX, splitTop, splitX, splitTop + sectionHeight)
  doc.line(margin, splitTop, margin, splitTop + sectionHeight) // Left Border
  doc.line(colEnd, splitTop, colEnd, splitTop + sectionHeight) // Right Border
  doc.line(margin, splitTop + sectionHeight, colEnd, splitTop + sectionHeight) // Bottom Border

  // --- LEFT: Charges Table ---
  const leftColWidth = splitX - margin

  // Headers
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, splitTop, leftColWidth, 6, 'F')
  doc.line(margin, splitTop + 6, splitX, splitTop + 6)

  doc.setFontSize(8)
  doc.setFont('times', 'bold')
  doc.text('Dt.', margin + 2, splitTop + 4)
  doc.text('Qty', margin + 18, splitTop + 4)
  doc.text('Product', margin + 30, splitTop + 4)
  doc.text('Rate', splitX - 15, splitTop + 4, { align: 'right' })
  doc.text('Value', splitX - 2, splitTop + 4, { align: 'right' })

  // Food Items List
  let itemY = splitTop + 10
  doc.setFont('times', 'normal')

  if (billData.foodItems && billData.foodItems.length > 0) {
    billData.foodItems.forEach(item => {
      if (itemY > splitTop + sectionHeight - 10) return // Clip if too many

      doc.text(item.orderTime ? formatDateOnly(item.orderTime) : '-', margin + 2, itemY)
      doc.text(item.quantity.toString(), margin + 18, itemY)
      doc.text(item.name.substring(0, 15), margin + 30, itemY)
      doc.text(formatCurrency(item.price), splitX - 15, itemY, { align: 'right' })
      const val = (item.total || item.price * item.quantity)
      doc.text(formatCurrency(val), splitX - 2, itemY, { align: 'right' })

      itemY += 4
    })
  }

  // --- RIGHT: Summary ---
  const rightColStart = splitX + 2
  const rightColEnd = colEnd - 2
  let sumY = splitTop + 10

  doc.setFontSize(9)

  const roomBase = billData.roomCharges + (billData.tariff || 0) + (billData.additionalGuestCharges || 0) * (billData.additionalGuests || 0)

  // Room Charges
  drawSumLine(doc, 'Room Charges Before Tax', roomBase, rightColStart, rightColEnd, sumY)
  sumY += 5

  // GST Room
  if (billData.showGst && billData.gstEnabled) {
    const gst = (roomBase * (billData.gstPercent || 0)) / 100
    drawSumLine(doc, 'Add: GST On Room Charges', gst, rightColStart, rightColEnd, sumY)
    sumY += 5
    doc.line(rightColStart + 35, sumY - 1, rightColEnd, sumY - 1)
  }

  // Food Charges
  drawSumLine(doc, 'Food Charges', billData.foodCharges, rightColStart, rightColEnd, sumY)
  sumY += 5

  // GST Food
  if (billData.showGst && billData.gstEnabled) {
    const gst = (billData.foodCharges * (billData.gstPercent || 0)) / 100
    drawSumLine(doc, 'Add: GST On Food Charges', gst, rightColStart, rightColEnd, sumY)
    sumY += 5
    doc.line(rightColStart + 35, sumY - 1, rightColEnd, sumY - 1)
  }

  // Bill Cleared Through
  sumY += 5
  doc.setFont('times', 'bold')
  doc.text('Bill Cleared', rightColStart + 20, sumY)
  doc.text('Through', rightColStart + 20, sumY + 4)
  doc.text(`${checkVal(billData.paymentMode)} - @${Math.round(billData.totalAmount)}`, rightColStart + 20, sumY + 8)

  // Total Section at bottom of box
  let bottomY = splitTop + sectionHeight - 25
  doc.setFont('times', 'bold')

  const total = billData.totalAmount - billData.roundOff + billData.advanceAmount
  drawSumLine(doc, 'Total Bill Amount', total, rightColStart, rightColEnd, bottomY)
  bottomY += 5

  doc.setFont('times', 'normal')
  drawSumLine(doc, 'Less: Advance', billData.advanceAmount, rightColStart, rightColEnd, bottomY)
  bottomY += 5

  drawSumLine(doc, 'Round Off (If Any)', billData.roundOff, rightColStart, rightColEnd, bottomY)
  bottomY += 6

  // Net Payable Highlight
  doc.setFontSize(11)
  doc.setFont('times', 'bold')
  doc.setTextColor(190, 30, 45) // Red

  doc.text('Net Payable Amount', rightColStart + 10, bottomY)

  doc.setLineWidth(0.5)
  doc.setDrawColor(0, 0, 0)
  doc.line(rightColStart + 45, bottomY + 1, rightColEnd + 1, bottomY + 1)
  doc.line(rightColStart + 45, bottomY - 5, rightColEnd + 1, bottomY - 5)

  doc.text(formatCurrency(billData.totalAmount), rightColEnd, bottomY, { align: 'right' })
  doc.setTextColor(0, 0, 0)

  yPos = splitTop + sectionHeight + 5

  // ============================================
  // 6. Footer
  // ============================================

  // Declaration
  doc.setFontSize(8)
  doc.setFont('times', 'italic')
  const decl = 'I agree that I am responsible for the full payment of this bill in the event if not paid by the company, organisation or person indicated.'
  doc.text(decl, centerX, yPos, { align: 'center', maxWidth: contentWidth })

  yPos += 15

  doc.setFont('times', 'bold')
  doc.text('Billing Instructions', margin, yPos)

  // Signatures
  yPos += 15
  doc.setFont('times', 'normal')

  doc.text("Cashier's Signature", margin + 10, yPos)
  doc.text("Guest's Signature", pageWidth - margin - 35, yPos)

  return doc
}

function drawSumLine(doc: jsPDF, label: string, val: number, x: number, endX: number, y: number) {
  doc.text(label, x, y)
  doc.text(formatCurrency(val), endX, y, { align: 'right' })
}

function formatDateOnly(date: any): string {
  if (!date) return 'NA'
  try {
    return new Date(date).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  } catch (e) { return 'NA' }
}

function formatTimeOnly(date: any): string {
  if (!date) return ''
  try {
    return new Date(date).toLocaleString('en-IN', {
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  } catch (e) { return '' }
}

export function maskIdNumber(idNumber: string | null | undefined, idType?: string): string {
  if (!idNumber) return 'N/A'
  if (idNumber.length >= 4) {
    return `XXXX XXXX ${idNumber.substring(idNumber.length - 4)}`
  }
  return idNumber
}
