import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Generate backdated bill
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      bookingId,
      billNumber,
      billDate,
      guestName,
      guestAddress,
      guestState,
      guestNationality,
      guestGstNumber,
      guestStateCode,
      guestMobile,
      companyName,
      companyCode,
      roomCharges,
      tariff,
      foodCharges,
      gstEnabled,
      gstPercent,
      gstNumber,
      advanceAmount,
      roundOff,
      paymentMode,
    } = await request.json()

    // Get hotel settings
    const settings = await prisma.hotelSettings.findFirst()
    if (!settings) {
      return NextResponse.json({ error: 'Hotel settings not found' }, { status: 404 })
    }

    // Get booking if bookingId provided
    let booking = null
    if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { room: { include: { roomType: true } } },
      })
    }

    // Calculate totals
    const baseAmount = Number.parseFloat(roomCharges) || 0
    const tariffAmount = Number.parseFloat(tariff) || 0
    const foodAmount = Number.parseFloat(foodCharges) || 0
    const gstAmount = gstEnabled
      ? ((baseAmount + tariffAmount) * (Number.parseFloat(gstPercent) || 5)) / 100
      : 0
    const advance = Number.parseFloat(advanceAmount) || 0
    const roundOffValue = Number.parseFloat(roundOff) || 0
    const totalAmount = baseAmount + tariffAmount + foodAmount + gstAmount - advance + roundOffValue

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Generate PDF matching Hotel Samrat Inn format
    const doc = new jsPDF()

    // Header with logo area (left side)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text(settings.name.toUpperCase(), 105, 20, { align: 'center' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(settings.address, 105, 28, { align: 'center' })
    doc.text(`Phone: ${settings.phone}`, 105, 34, { align: 'center' })
    if (settings.email) {
      doc.text(`E-Mail Id: ${settings.email}`, 105, 40, { align: 'center' })
    }
    if (settings.gstin) {
      doc.text(`GSTIN: ${settings.gstin}`, 105, 46, { align: 'center' })
    }

    let yPos = 60

    // Bill Details
    doc.setFontSize(10)
    doc.text(`Visitor's Register Sr. No.: ${billNumber || 'N/A'}`, 14, yPos)
    doc.text(`Bill No.: ${invoiceNumber}`, 14, yPos + 6)
    doc.text(`Bill Date: ${billDate ? new Date(billDate).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}`, 14, yPos + 12)

    yPos += 25

    // Guest Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Guest Information', 14, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Guest Name and Address: ${guestName}`, 14, yPos)
    if (guestAddress) {
      doc.text(guestAddress, 14, yPos + 6)
    }
    if (guestState) {
      doc.text(`State/Region: ${guestState}`, 14, yPos + 12)
    }
    if (guestNationality) {
      doc.text(`Nationality: ${guestNationality}`, 14, yPos + 18)
    }
    if (guestGstNumber) {
      doc.text(`GST No.: ${guestGstNumber}`, 14, yPos + 24)
    }
    if (guestStateCode) {
      doc.text(`State Code: ${guestStateCode}`, 14, yPos + 30)
    }
    if (guestMobile) {
      doc.text(`Mobile No.: ${guestMobile}`, 14, yPos + 36)
    }
    if (companyName) {
      doc.text(`Company Name: ${companyName}`, 14, yPos + 42)
    }
    if (companyCode) {
      doc.text(`Company Code/ID: ${companyCode}`, 14, yPos + 48)
    }

    yPos += 60

    // Room Details
    if (booking) {
      doc.setFontSize(10)
      doc.text(`Room No.: ${booking.room.roomNumber}`, 14, yPos)
      doc.text(`Particulars: ${booking.room.roomType.name}`, 14, yPos + 6)
      const days = Math.ceil(
        (booking.checkoutDate
          ? new Date(booking.checkoutDate).getTime()
          : Date.now() - new Date(booking.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
      doc.text(`Rent Per Day: ₹${baseAmount.toFixed(2)}`, 14, yPos + 12)
      doc.text(`No. Of Days: ${days}`, 14, yPos + 18)
      doc.text(
        `Check In On: ${new Date(booking.checkInDate).toLocaleString('en-IN')}`,
        14,
        yPos + 24
      )
      if (booking.checkoutDate) {
        doc.text(
          `Check Out at: ${new Date(booking.checkoutDate).toLocaleString('en-IN')}`,
          14,
          yPos + 30
        )
      }
      yPos += 40
    }

    // Charges Summary
    const chargesData: any[] = [
      ['Room Charges Before Tax', `₹${baseAmount.toFixed(2)}`],
    ]

    if (tariffAmount > 0) {
      chargesData.push(['Tariff', `₹${tariffAmount.toFixed(2)}`])
    }

    if (gstEnabled && gstAmount > 0) {
      chargesData.push([`Add: GST On Room Charges (${gstPercent || 5}%)`, `₹${gstAmount.toFixed(2)}`])
    }

    if (foodAmount > 0) {
      chargesData.push(['Food Charges', `₹${foodAmount.toFixed(2)}`])
    }

    chargesData.push(['Total Bill Amount', `₹${(baseAmount + tariffAmount + foodAmount + gstAmount).toFixed(2)}`])

    if (advance > 0) {
      chargesData.push(['Less: Advance', `₹${advance.toFixed(2)}`])
    }

    if (roundOffValue !== 0) {
      chargesData.push(['Round Off (If Any)', `₹${roundOffValue.toFixed(2)}`])
    }

    chargesData.push(['Net Payable Amount', `₹${totalAmount.toFixed(2)}`])

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Amount']],
      body: chargesData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 9 },
    })

    const finalY = (doc as any).lastAutoTable.finalY + 10

    // Payment Info
    doc.setFontSize(10)
    doc.text(`Bill Cleared Through: ${paymentMode} - @₹${totalAmount.toFixed(2)}`, 14, finalY)

    // Footer
    doc.setFontSize(8)
    doc.text(
      'I agree that I am responsible for the full payment of this bill in the event if not paid by the company, organisation or person indicated',
      105,
      doc.internal.pageSize.height - 40,
      { align: 'center', maxWidth: 180 }
    )

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="bill-${invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
