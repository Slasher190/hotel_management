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
    const { baseAmount, gstEnabled, gstPercent, gstNumber, paymentMode, paymentStatus } = await request.json()

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status === 'CHECKED_OUT') {
      return NextResponse.json({ error: 'Booking already checked out' }, { status: 400 })
    }

    // Calculate totals using editable baseAmount
    const roomCharges = Number.parseFloat(baseAmount) || booking.roomPrice
    const gstAmount = gstEnabled ? (roomCharges * (gstPercent || 5)) / 100 : 0
    const totalAmount = roomCharges + gstAmount

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: id,
        invoiceNumber,
        invoiceType: 'ROOM',
        guestName: booking.guestName,
        roomType: booking.room.roomType,
        roomCharges,
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

    // Generate PDF
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.text('Hotel Invoice', 105, 20, { align: 'center' })
    doc.setFontSize(12)
    doc.text(`Invoice #: ${invoiceNumber}`, 105, 30, { align: 'center' })
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 36, { align: 'center' })

    // Guest Details
    doc.setFontSize(14)
    doc.text('Guest Details', 14, 50)
    doc.setFontSize(10)
    doc.text(`Name: ${booking.guestName}`, 14, 58)
    doc.text(`Room: ${booking.room.roomNumber} (${booking.room.roomType})`, 14, 64)
    doc.text(`ID Type: ${booking.idType}`, 14, 70)

    // Charges Table
    const tableData: any[] = [
      ['Base Amount', `₹${roomCharges.toLocaleString('en-IN')}`],
    ]

    if (gstEnabled && gstAmount > 0) {
      tableData.push([`GST (${gstPercent || 5}%)`, `₹${gstAmount.toLocaleString('en-IN')}`])
      if (gstNumber) {
        tableData.push(['GST Number', gstNumber])
      }
    }

    tableData.push(['Total Amount', `₹${totalAmount.toLocaleString('en-IN')}`])

    autoTable(doc, {
      startY: 80,
      head: [['Description', 'Amount']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241] },
    })

    // Payment Info
    const finalY = (doc as any).lastAutoTable.finalY + 10
    doc.setFontSize(12)
    doc.text('Payment Information', 14, finalY)
    doc.setFontSize(10)
    doc.text(`Mode: ${paymentMode}`, 14, finalY + 8)
    doc.text(`Status: ${paymentStatus}`, 14, finalY + 14)

    // Footer
    doc.setFontSize(8)
    doc.text('Thank you for your stay!', 105, doc.internal.pageSize.height - 20, { align: 'center' })

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
