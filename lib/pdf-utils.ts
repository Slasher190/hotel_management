import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface HotelSettings {
  name: string
  address: string
  phone: string
  email?: string | null
  gstin?: string | null
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
  showGst?: boolean // Option to show/hide GST section
}

export function generateBillPDF(settings: HotelSettings, billData: BillData): jsPDF {
  const doc = new jsPDF()
  const showGst = billData.showGst !== false // Default to true unless explicitly false

  // Header Section with better formatting
  doc.setFillColor(99, 102, 241) // Indigo color
  doc.rect(0, 0, 210, 30, 'F')
  
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.name.toUpperCase(), 105, 18, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(settings.address, 105, 25, { align: 'center' })
  
  // Reset text color for rest of document
  doc.setTextColor(0, 0, 0)
  
  // Contact Information
  const contactY = 35
  doc.setFontSize(9)
  doc.text(`Phone: ${settings.phone}`, 14, contactY)
  if (settings.email) {
    doc.text(`Email: ${settings.email}`, 105, contactY, { align: 'center' })
  }
  if (settings.gstin) {
    doc.text(`GSTIN: ${settings.gstin}`, 180, contactY, { align: 'right' })
  }

  let yPos = 50

  // Bill Details Section
  doc.setFillColor(243, 244, 246) // Light gray background
  doc.rect(14, yPos - 5, 182, 20, 'F')
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Bill Details', 16, yPos)
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  if (billData.billNumber) {
    doc.text(`Visitor's Register Sr. No.: ${billData.billNumber}`, 16, yPos + 6)
  }
  doc.text(`Bill No.: ${billData.invoiceNumber}`, 16, yPos + 12)
  doc.text(
    `Bill Date: ${new Date(billData.billDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`,
    16,
    yPos + 18
  )

  yPos += 30

  // Room Details (if available)
  if (billData.roomNumber) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Room Information', 14, yPos)
    yPos += 6
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`Room No.: ${billData.roomNumber}`, 14, yPos)
    if (billData.roomType) {
      doc.text(`Room Type: ${billData.roomType}`, 14, yPos + 6)
    }
    if (billData.days) {
      doc.text(`No. of Days: ${billData.days}`, 14, yPos + 12)
    }
    if (billData.checkInDate) {
      doc.text(
        `Check-In: ${new Date(billData.checkInDate).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        14,
        yPos + 18
      )
    }
    if (billData.checkoutDate) {
      doc.text(
        `Check-Out: ${new Date(billData.checkoutDate).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        14,
        yPos + 24
      )
    }
    yPos += 35
  }

  // Guest Information Section
  doc.setFillColor(243, 244, 246)
  doc.rect(14, yPos - 5, 182, 30, 'F')
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Guest Information', 16, yPos)
  yPos += 6

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Guest Name: ${billData.guestName}`, 16, yPos)
  if (billData.guestAddress) {
    doc.text(`Address: ${billData.guestAddress}`, 16, yPos + 6)
  }
  if (billData.guestState) {
    doc.text(`State/Region: ${billData.guestState}`, 16, yPos + 12)
  }
  if (billData.guestNationality) {
    doc.text(`Nationality: ${billData.guestNationality}`, 16, yPos + 18)
  }
  if (billData.guestMobile) {
    doc.text(`Mobile: ${billData.guestMobile}`, 16, yPos + 24)
  }
  if (billData.guestGstNumber) {
    doc.text(`GST No.: ${billData.guestGstNumber}`, 105, yPos)
  }
  if (billData.companyName) {
    doc.text(`Company: ${billData.companyName}`, 105, yPos + 6)
  }

  yPos += 40

  // Charges Summary Table
  const chargesData: [string, string][] = []
  
  // Room Charges
  chargesData.push(['Room Charges', `₹${billData.roomCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`])
  
  // Additional Guest Charges
  if (billData.additionalGuestCharges && billData.additionalGuestCharges > 0 && billData.additionalGuests) {
    chargesData.push([
      `Additional Guests (${billData.additionalGuests} × ₹${billData.additionalGuestCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
      `₹${(billData.additionalGuestCharges * billData.additionalGuests).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ])
  }
  
  // Tariff
  if (billData.tariff > 0) {
    chargesData.push(['Tariff', `₹${billData.tariff.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`])
  }
  
  // Food Charges
  if (billData.foodCharges > 0) {
    chargesData.push(['Food Charges', `₹${billData.foodCharges.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`])
  }
  
  // Subtotal
  const subtotal = billData.roomCharges + 
    (billData.additionalGuestCharges && billData.additionalGuests ? billData.additionalGuestCharges * billData.additionalGuests : 0) +
    billData.tariff + 
    billData.foodCharges
  
  chargesData.push(['Subtotal', `₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`])
  
  // GST (only if enabled and showGst is true)
  if (billData.gstEnabled && showGst && billData.gstAmount > 0) {
    chargesData.push([
      `GST (${billData.gstPercent || 5}%)`,
      `₹${billData.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ])
  }
  
  // Total before deductions
  const totalBeforeDeductions = subtotal + (billData.gstEnabled && showGst ? billData.gstAmount : 0)
  chargesData.push(['Total Amount', `₹${totalBeforeDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`])
  
  // Advance
  if (billData.advanceAmount > 0) {
    chargesData.push(['Less: Advance Paid', `-₹${billData.advanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`])
  }
  
  // Round Off
  if (billData.roundOff !== 0) {
    chargesData.push([
      'Round Off',
      `${billData.roundOff >= 0 ? '+' : ''}₹${Math.abs(billData.roundOff).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ])
  }
  
  // Net Payable
  chargesData.push(['Net Payable Amount', `₹${billData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`])

  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Amount (₹)']],
    body: chargesData,
    theme: 'striped',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: 'right', cellWidth: 60 },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    didParseCell: (data: any) => {
      // Highlight total row
      if (data.row.index === chargesData.length - 1) {
        data.cell.styles.fillColor = [99, 102, 241]
        data.cell.styles.textColor = [255, 255, 255]
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fontSize = 10
      }
    },
  })

  const finalY = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15

  // Payment Information
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Payment Mode: ${billData.paymentMode} | Amount: ₹${billData.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    14,
    finalY
  )

  // Footer
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text(
    'I agree that I am responsible for the full payment of this bill in the event if not paid by the company, organisation or person indicated.',
    105,
    doc.internal.pageSize.height - 20,
    { align: 'center', maxWidth: 180 }
  )

  return doc
}

// Helper function to mask ID number
export function maskIdNumber(idNumber: string | null | undefined, idType?: string): string {
  if (!idNumber) return 'N/A'
  
  // For Aadhaar: Show first 4 and last 4, mask middle
  if (idType === 'AADHAAR' || idNumber.length === 12) {
    if (idNumber.length >= 8) {
      return `${idNumber.substring(0, 4)} XXXX XXXX ${idNumber.substring(idNumber.length - 4)}`
    }
  }
  
  // For other IDs: Show first 2 and last 2, mask middle
  if (idNumber.length >= 4) {
    return `${idNumber.substring(0, 2)}${'X'.repeat(idNumber.length - 4)}${idNumber.substring(idNumber.length - 2)}`
  }
  
  return 'XXXX'
}
