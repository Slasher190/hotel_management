import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { generateBillPDF } from '@/lib/pdf-utils'

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
      additionalGuestCharges,
      additionalGuests,
      gstEnabled,
      gstPercent,
      gstNumber,
      advanceAmount,
      roundOff,
      paymentMode,
      showGst = true, // Default to true, but can be unchecked
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
    const additionalGuestChargesValue = Number.parseFloat(additionalGuestCharges) || 0
    const additionalGuestsCount = Number.parseInt(additionalGuests) || 0
    const additionalGuestsTotal = additionalGuestChargesValue * additionalGuestsCount
    
    const baseTotal = baseAmount + tariffAmount + foodAmount + additionalGuestsTotal
    const gstAmount = (gstEnabled && showGst)
      ? (baseTotal * (Number.parseFloat(gstPercent) || 5)) / 100
      : 0
    const advance = Number.parseFloat(advanceAmount) || 0
    const roundOffValue = Number.parseFloat(roundOff) || 0
    const totalAmount = baseTotal + gstAmount - advance + roundOffValue

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Save invoice to database (for history)
    await prisma.invoice.create({
      data: {
        bookingId: bookingId || 'MANUAL',
        invoiceNumber,
        billNumber: billNumber || null,
        invoiceType: bookingId ? 'ROOM' : 'MANUAL',
        isManual: !bookingId, // true if no bookingId
        guestName,
        guestAddress: guestAddress || null,
        guestState: guestState || null,
        guestNationality: guestNationality || null,
        guestGstNumber: guestGstNumber || null,
        guestStateCode: guestStateCode || null,
        guestMobile: guestMobile || null,
        companyName: companyName || null,
        companyCode: companyCode || null,
        roomType: booking?.room.roomType.name || null,
        roomCharges: baseAmount,
        tariff: tariffAmount,
        additionalGuestCharges: additionalGuestsTotal,
        foodCharges: foodAmount,
        gstEnabled: gstEnabled && showGst,
        gstNumber: (gstEnabled && showGst) ? gstNumber : null,
        gstAmount,
        advanceAmount: advance,
        roundOff: roundOffValue,
        totalAmount,
        billDate: billDate ? new Date(billDate) : new Date(),
      },
    })

    // Calculate days if booking exists
    let days = 0
    if (booking) {
      days = Math.ceil(
        (booking.checkoutDate
          ? new Date(booking.checkoutDate).getTime()
          : Date.now() - new Date(booking.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    }

    // Generate PDF using utility function
    const doc = generateBillPDF(settings, {
      invoiceNumber,
      billNumber: billNumber || null,
      billDate: billDate || new Date(),
      guestName,
      guestAddress: guestAddress || null,
      guestState: guestState || null,
      guestNationality: guestNationality || null,
      guestGstNumber: guestGstNumber || null,
      guestStateCode: guestStateCode || null,
      guestMobile: guestMobile || null,
      companyName: companyName || null,
      companyCode: companyCode || null,
      roomNumber: booking?.room.roomNumber,
      roomType: booking?.room.roomType.name,
      checkInDate: booking?.checkInDate,
      checkoutDate: booking?.checkoutDate || undefined,
      days,
      roomCharges: baseAmount,
      tariff: tariffAmount,
      foodCharges: foodAmount,
      additionalGuestCharges: additionalGuestChargesValue,
      additionalGuests: additionalGuestsCount,
      gstEnabled: gstEnabled && showGst,
      gstPercent: Number.parseFloat(gstPercent) || 5,
      gstAmount,
      advanceAmount: advance,
      roundOff: roundOffValue,
      totalAmount,
      paymentMode,
      showGst,
    })

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
