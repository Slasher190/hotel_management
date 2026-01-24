import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManager } from '@/lib/role-auth'
import { generateBillPDF } from '@/lib/pdf-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireManager(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 403 })
    }

    const { id } = await params
    const {
      baseAmount,
      tariff,
      additionalGuestCharges,
      gstEnabled,
      gstPercent,
      gstNumber,
      paymentMode,
      paymentStatus,
      showGst = false,
      kitchenBillPaid = false,
      showCombinedFoodBill = false,
      complimentary = 0
    } = await request.json()

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        foodOrders: {
          include: {
            foodItem: true,
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
    const additionalGuestChargesValue = Number.parseFloat(additionalGuestCharges) || booking.additionalGuestCharges || 0
    const additionalGuestsTotal = booking.additionalGuests > 0
      ? additionalGuestChargesValue * booking.additionalGuests
      : 0

    // Calculate combined food bill if enabled
    let combinedFoodCharges = 0
    if (showCombinedFoodBill) {
      // Get previous food bills
      const previousFoodBills = await prisma.invoice.findMany({
        where: {
          bookingId: id,
          invoiceType: 'FOOD',
        },
      })
      const previousBillsTotal = previousFoodBills.reduce((sum, bill) => sum + bill.totalAmount, 0)

      // Calculate current food orders total (no GST)
      let currentFoodTotal = 0
      booking.foodOrders.forEach((order) => {
        currentFoodTotal += order.foodItem.price * order.quantity
      })

      combinedFoodCharges = previousBillsTotal + currentFoodTotal - (Number.parseFloat(complimentary) || 0)
    }

    const baseTotal = roomCharges + tariffAmount + additionalGuestsTotal + combinedFoodCharges
    const gstAmount = (gstEnabled && showGst) ? (baseTotal * (gstPercent || 5)) / 100 : 0
    const totalAmount = baseTotal + gstAmount

    // Update booking with tariff and additional guest charges
    await prisma.booking.update({
      where: { id },
      data: {
        tariff: tariffAmount,
        additionalGuestCharges: additionalGuestChargesValue,
      },
    })

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create invoice - save all available data
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: id,
        invoiceNumber,
        invoiceType: 'ROOM',
        isManual: false, // This is from a booking checkout
        billNumber: booking.billNumber || null,
        billDate: booking.billDate || null,
        visitorRegistrationNumber: booking.visitorRegistrationNumber?.toString() || null,

        guestName: booking.guestName,
        guestAddress: booking.guestAddress || null,
        guestMobile: booking.guestMobile || null,
        guestGstNumber: (gstEnabled && showGst) ? (booking.guestGstNumber || null) : null,
        guestState: null, // Can be added if available
        guestNationality: null, // Can be added if available
        guestStateCode: null, // Can be added if available

        companyName: booking.companyName || null,
        department: booking.department || null,
        designation: booking.designation || null,
        companyCode: null, // Can be added if available

        roomType: booking.room.roomType.name,
        roomNumber: booking.room.roomNumber,
        checkInDate: booking.checkInDate,
        checkOutDate: new Date(),

        adults: booking.adults || 1,
        children: booking.children || 0,
        totalGuests: (booking.adults || 1) + (booking.children || 0) + (booking.additionalGuests || 0),

        roomCharges,
        tariff: tariffAmount,
        additionalGuestCharges: additionalGuestChargesValue,
        discount: booking.discount || 0,

        foodCharges: showCombinedFoodBill ? combinedFoodCharges : 0,
        gstEnabled: gstEnabled && showGst,
        gstNumber: (gstEnabled && showGst) ? gstNumber : null,
        gstAmount,
        advanceAmount: 0, // Can be added if available in request
        roundOff: 0, // Can be added if available in request
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

    // Calculate days
    const days = Math.ceil(
      (Date.now() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Generate PDF using utility function - use invoice data for all fields
    const doc = generateBillPDF(settings, {
      invoiceNumber,
      billNumber: null, // Can be added if needed
      billDate: new Date(),
      guestName: invoice.guestName,
      guestAddress: invoice.guestAddress || null,
      guestState: invoice.guestState || null,
      guestNationality: invoice.guestNationality || null,
      guestGstNumber: showGst && invoice.gstEnabled ? (invoice.guestGstNumber || null) : null,
      guestStateCode: invoice.guestStateCode || null,
      guestMobile: invoice.guestMobile || null,
      companyName: invoice.companyName || null,
      companyCode: invoice.companyCode || null,
      roomNumber: booking.room.roomNumber,
      roomType: booking.room.roomType.name,
      checkInDate: booking.checkInDate,
      checkoutDate: new Date(),
      days,
      roomCharges,
      tariff: tariffAmount,
      foodCharges: showCombinedFoodBill ? combinedFoodCharges : 0,
      additionalGuestCharges: additionalGuestChargesValue,
      additionalGuests: booking.additionalGuests,
      gstEnabled: gstEnabled && showGst,
      gstPercent: gstPercent || 5,
      gstAmount,
      advanceAmount: invoice.advanceAmount || 0,
      roundOff: invoice.roundOff || 0,
      totalAmount,
      paymentMode,
      showGst,
    })

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
