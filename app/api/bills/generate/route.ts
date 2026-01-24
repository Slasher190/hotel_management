import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManager } from '@/lib/role-auth'
import { generateBillPDF } from '@/lib/pdf-utils'

// Generate backdated bill
export async function POST(request: NextRequest) {
  try {
    const user = requireManager(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 403 })
    }

    const {
      bookingId,
      visitorRegistrationNumber,
      billNumber,
      billDate,
      guestName,
      guestAddress,
      guestState,
      guestNationality,
      guestGstNumber,
      guestStateCode,
      guestMobile,
      idType,
      idNumber,
      companyName,
      companyCode,
      department,
      designation,
      businessPhoneNumber,
      roomNumber,
      particulars,
      rentPerDay,
      numberOfDays,
      checkInDate,
      checkOutDate,
      adults,
      children,
      totalGuests,
      roomCharges,
      tariff,
      foodCharges,
      additionalGuestCharges,
      additionalGuests,
      discount,
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

    // Get booking if bookingId provided (optional - bills can be created independently)
    let booking = null
    if (bookingId && bookingId.trim() !== '') {
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
    const discountAmount = Number.parseFloat(discount) || 0
    
    const baseTotal = baseAmount + tariffAmount + foodAmount + additionalGuestsTotal - discountAmount
    const gstAmount = (gstEnabled && showGst)
      ? (baseTotal * (Number.parseFloat(gstPercent) || 5)) / 100
      : 0
    const advance = Number.parseFloat(advanceAmount) || 0
    const roundOffValue = Number.parseFloat(roundOff) || 0
    const totalAmount = baseTotal + gstAmount - advance + roundOffValue

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Save invoice to database (for history)
    // Manual bills are completely independent - no bookingId required
    await prisma.invoice.create({
      data: {
        bookingId: (bookingId && bookingId.trim() !== '') ? bookingId : null,
        invoiceNumber,
        visitorRegistrationNumber: visitorRegistrationNumber || null,
        billNumber: billNumber || null,
        invoiceType: (bookingId && bookingId.trim() !== '') ? 'ROOM' : 'MANUAL',
        isManual: !bookingId || bookingId.trim() === '', // true if no bookingId or empty
        guestName,
        guestAddress: guestAddress || null,
        guestState: guestState || null,
        guestNationality: guestNationality || null,
        guestGstNumber: guestGstNumber || null,
        guestStateCode: guestStateCode || null,
        guestMobile: guestMobile || null,
        idType: idType || null,
        idNumber: idNumber || null,
        companyName: companyName || null,
        companyCode: companyCode || null,
        department: department || null,
        designation: designation || null,
        businessPhoneNumber: businessPhoneNumber || null,
        roomNumber: roomNumber || null,
        roomType: booking?.room.roomType.name || null,
        particulars: particulars || null,
        rentPerDay: Number.parseFloat(rentPerDay) || 0,
        numberOfDays: Number.parseInt(numberOfDays) || 1,
        checkInDate: checkInDate ? new Date(checkInDate) : null,
        checkOutDate: checkOutDate ? new Date(checkOutDate) : null,
        adults: Number.parseInt(adults) || 1,
        children: Number.parseInt(children) || 0,
        totalGuests: Number.parseInt(totalGuests) || 1,
        roomCharges: baseAmount,
        tariff: tariffAmount,
        additionalGuestCharges: additionalGuestsTotal,
        foodCharges: foodAmount,
        discount: discountAmount,
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
    // Only pass guestGstNumber if showGst is true (GSTIN visibility depends only on showGst)
    const doc = generateBillPDF(settings, {
      invoiceNumber,
      visitorRegistrationNumber: visitorRegistrationNumber || null,
      billNumber: billNumber || null,
      billDate: billDate || new Date(),
      guestName,
      guestAddress: guestAddress || null,
      guestState: guestState || null,
      guestNationality: guestNationality || null,
      guestGstNumber: showGst ? (guestGstNumber || null) : null, // Only include if showGst is checked
      guestStateCode: guestStateCode || null,
      guestMobile: guestMobile || null,
      idType: idType || null,
      idNumber: idNumber || null,
      companyName: companyName || null,
      companyCode: companyCode || null,
      department: department || null,
      designation: designation || null,
      businessPhoneNumber: businessPhoneNumber || null,
      roomNumber: roomNumber || booking?.room.roomNumber,
      roomType: booking?.room.roomType.name,
      particulars: particulars || null,
      rentPerDay: Number.parseFloat(rentPerDay) || 0,
      numberOfDays: Number.parseInt(numberOfDays) || 1,
      checkInDate: checkInDate ? new Date(checkInDate) : booking?.checkInDate,
      checkoutDate: checkOutDate ? new Date(checkOutDate) : booking?.checkoutDate || undefined,
      adults: Number.parseInt(adults) || 1,
      children: Number.parseInt(children) || 0,
      totalGuests: Number.parseInt(totalGuests) || 1,
      days,
      roomCharges: baseAmount,
      tariff: tariffAmount,
      foodCharges: foodAmount,
      additionalGuestCharges: additionalGuestChargesValue,
      additionalGuests: additionalGuestsCount,
      discount: discountAmount,
      gstEnabled: gstEnabled && showGst, // GST calculation still depends on both
      gstPercent: Number.parseFloat(gstPercent) || 5,
      gstAmount,
      advanceAmount: advance,
      roundOff: roundOffValue,
      totalAmount,
      paymentMode,
      showGst, // This controls GSTIN visibility
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
