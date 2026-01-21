import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { generateBillPDF } from '@/lib/pdf-utils'

// Generate food invoice for a booking
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
    const { showGst = true, gstPercent = 5, gstNumber } = await request.json()

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

    if (booking.foodOrders.length === 0) {
      return NextResponse.json({ error: 'No food orders found for this booking' }, { status: 400 })
    }

    // Calculate food charges (no GST for food bills)
    let subtotal = 0
    booking.foodOrders.forEach((order) => {
      const itemTotal = order.foodItem.price * order.quantity
      subtotal += itemTotal
      // No GST calculation for food bills
    })

    const foodCharges = subtotal

    // Calculate additional GST on total (if enabled and showGst is true)
    const additionalGst = (showGst && gstPercent > 0) ? (foodCharges * gstPercent) / 100 : 0
    const totalAmount = foodCharges + additionalGst

    // Generate invoice number
    const invoiceNumber = `FOOD-INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create invoice
    await prisma.invoice.create({
      data: {
        bookingId: id,
        invoiceNumber,
        invoiceType: 'FOOD',
        isManual: false,
        guestName: booking.guestName,
        roomType: booking.room.roomType.name,
        roomCharges: 0,
        foodCharges,
        tariff: 0,
        additionalGuestCharges: 0,
        gstEnabled: showGst && gstPercent > 0,
        gstNumber: (showGst && gstPercent > 0) ? gstNumber : null,
        gstAmount: additionalGst,
        totalAmount,
      },
    })

    // Get hotel settings
    const settings = await prisma.hotelSettings.findFirst()
    if (!settings) {
      return NextResponse.json({ error: 'Hotel settings not found' }, { status: 404 })
    }

    // Generate PDF
    const doc = generateBillPDF(settings, {
      invoiceNumber,
      billDate: new Date(),
      guestName: booking.guestName,
      guestAddress: null,
      guestState: null,
      guestNationality: null,
      guestGstNumber: null,
      guestStateCode: null,
      guestMobile: null,
      companyName: null,
      companyCode: null,
      roomNumber: booking.room.roomNumber,
      roomType: booking.room.roomType.name,
      checkInDate: booking.checkInDate,
      checkoutDate: booking.checkoutDate || undefined,
      days: 0,
      roomCharges: 0,
      tariff: 0,
      foodCharges,
      additionalGuestCharges: 0,
      additionalGuests: 0,
      gstEnabled: showGst && gstPercent > 0,
      gstPercent,
      gstAmount: additionalGst,
      advanceAmount: 0,
      roundOff: 0,
      totalAmount,
      paymentMode: 'CASH',
      showGst,
    })

    // Delete food orders after invoice is generated (so they don't appear in next bill)
    // But keep them for combined bill at checkout - we'll handle that separately
    // For now, we'll delete them to prevent duplicate billing
    await prisma.foodOrder.deleteMany({
      where: {
        bookingId: id,
      },
    })

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="food-invoice-${invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating food invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
