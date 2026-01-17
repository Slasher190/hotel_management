import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { baseAmount, tariff, gstEnabled, gstPercent, gstNumber, paymentMode, paymentStatus } = await request.json()

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'CHECKED_OUT') {
      return NextResponse.json({ error: 'Booking already checked out' }, { status: 400 })
    }

    // Calculate totals using editable baseAmount and tariff
    const roomCharges = Number.parseFloat(baseAmount) || booking.roomPrice
    const tariffAmount = Number.parseFloat(tariff) || 0
    const gstAmount = gstEnabled ? ((roomCharges + tariffAmount) * (gstPercent || 5)) / 100 : 0
    const totalAmount = roomCharges + tariffAmount + gstAmount

    // Update booking with tariff
    await prisma.booking.update({
      where: { id },
      data: { tariff: tariffAmount },
    })

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: id,
        invoiceNumber,
        invoiceType: 'ROOM',
        guestName: booking.guestName,
        roomType: booking.room.roomType.name,
        roomCharges,
        tariff: tariffAmount,
        foodCharges: 0, // Food charges handled separately
        gstEnabled,
        gstNumber: gstEnabled ? gstNumber : null,
        gstAmount,
        totalAmount,
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: id,
        mode: paymentMode as 'CASH' | 'ONLINE',
        status: paymentStatus as 'PAID' | 'PENDING',
        amount: totalAmount,
      },
    })

    // Update booking status
    await prisma.booking.update({
      where: { id },
      data: {
        status: 'CHECKED_OUT',
        checkoutDate: new Date(),
      },
    })

    // Update room status
    await prisma.room.update({
      where: { id: booking.roomId },
      data: { status: 'AVAILABLE' },
    })

    // Get hotel settings
    const settings = await prisma.hotelSettings.findFirst()
    if (!settings) {
      return NextResponse.json({ error: 'Hotel settings not found' }, { status: 404 })
    }

    // Generate PDF matching Hotel Samrat Inn format
    const doc = new jsPDF()

    // Header with hotel name
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
    doc.text(`Bill No.: ${invoiceNumber}`, 14, yPos)
    doc.text(`Bill Date: ${new Date().toLocaleDateString('en-IN')}`, 14, yPos + 6)
    doc.text(`Room No.: ${booking.room.roomNumber}`, 14, yPos + 12)
    doc.text(`Particulars: ${booking.room.roomType.name}`, 14, yPos + 18)
    
    const days = Math.ceil(
      (booking.checkoutDate
        ? new Date(booking.checkoutDate).getTime()
        : Date.now() - new Date(booking.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    doc.text(`Rent Per Day: ₹${roomCharges.toFixed(2)}`, 14, yPos + 24)
    doc.text(`No. Of Days: ${days}`, 14, yPos + 30)
    doc.text(
      `Check In On: ${new Date(booking.checkInDate).toLocaleString('en-IN')}`,
      14,
      yPos + 36
    )
    doc.text(
      `Check Out at: ${new Date().toLocaleString('en-IN')}`,
      14,
      yPos + 42
    )

    yPos += 50

    // Guest Information
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Guest Information', 14, yPos)
    yPos += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Guest Name and Address: ${booking.guestName}`, 14, yPos)
    if (booking.idNumber) {
      doc.text(`ID Type: ${booking.idType}`, 14, yPos + 6)
      doc.text(`ID Number: ${booking.idNumber}`, 14, yPos + 12)
    }

    yPos += 25

    // Charges Summary
    const chargesData: any[] = [
      ['Room Charges Before Tax', `₹${roomCharges.toFixed(2)}`],
    ]

    if (tariffAmount > 0) {
      chargesData.push(['Tariff', `₹${tariffAmount.toFixed(2)}`])
    }

    if (gstEnabled && gstAmount > 0) {
      chargesData.push([`Add: GST On Room Charges (${gstPercent || 5}%)`, `₹${gstAmount.toFixed(2)}`])
    }

    chargesData.push(['Total Bill Amount', `₹${(roomCharges + tariffAmount + gstAmount).toFixed(2)}`])
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

    // Save PDF path (you can save to file system or cloud storage)
    // For now, we'll just return the PDF
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfPath: `invoices/${invoiceNumber}.pdf` },
    })

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error during checkout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
