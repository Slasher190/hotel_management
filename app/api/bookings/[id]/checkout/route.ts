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
      complimentary = 0,
      companyName,
      department,
      designation,
      roundOff = 0,
      checkoutDate,
      guestState,
      guestStateCode,
      guestNationality,
      businessPhoneNumber
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

    const checkoutDateTime = checkoutDate ? new Date(checkoutDate) : new Date()

    // Calculate totals using editable baseAmount and tariff
    const roomCharges = Number.parseFloat(baseAmount) || booking.roomPrice
    const tariffAmount = Number.parseFloat(tariff) || 0
    const additionalGuestChargesValue = Number.parseFloat(additionalGuestCharges) || booking.additionalGuestCharges || 0
    const additionalGuestsTotal = booking.additionalGuests > 0
      ? additionalGuestChargesValue * booking.additionalGuests
      : 0

    // Calculate combined food bill if enabled
    // Calculate combined food bill if enabled
    let combinedFoodCharges = 0
    let allFoodOrders: any[] = [...booking.foodOrders]

    if (showCombinedFoodBill) {
      // Get previous food bills with their orders
      const previousFoodBills = await prisma.invoice.findMany({
        where: {
          bookingId: id,
          invoiceType: 'FOOD',
        },
        include: {
          foodOrders: {
            include: {
              foodItem: true
            }
          }
        }
      })

      const previousBillsTotal = previousFoodBills.reduce((sum, bill) => sum + bill.totalAmount, 0)

      // Add previous orders to the list for itemized view
      previousFoodBills.forEach(bill => {
        if (bill.foodOrders) {
          allFoodOrders = [...allFoodOrders, ...bill.foodOrders]
        }
      })

      // Calculate current food orders total (no GST)
      let currentFoodTotal = 0
      booking.foodOrders.forEach((order) => {
        currentFoodTotal += order.foodItem.price * order.quantity
      })

      combinedFoodCharges = previousBillsTotal + currentFoodTotal - (Number.parseFloat(complimentary) || 0)
    }

    const baseTotal = roomCharges + tariffAmount + additionalGuestsTotal + combinedFoodCharges
    const gstAmount = (gstEnabled && showGst) ? (baseTotal * (gstPercent || 5)) / 100 : 0
    // Final total includes roundOff
    const totalAmount = baseTotal + gstAmount + (Number.parseFloat(roundOff) || 0)

    // Update booking with tariff and additional guest charges
    await prisma.booking.update({
      where: { id },
      data: {
        tariff: tariffAmount,
        additionalGuestCharges: additionalGuestChargesValue,
        companyName: companyName || booking.companyName,
        department: department || booking.department,
        designation: designation || booking.designation,
      },
    })

    // Generate Invoice Number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Prepare food items for PDF (itemized)
    // Sort by creation date
    allFoodOrders.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    const foodItems = allFoodOrders.map(order => ({
      name: order.foodItem.name,
      quantity: order.quantity,
      price: order.foodItem.price,
      total: order.foodItem.price * order.quantity,
      orderTime: order.createdAt // We can use order creation time
    }))

    // Use passed checkInDate as it might be edited in frontend, otherwise booking's
    // (Actually the request doesn't send checkInDate usually, it sends checkoutDate. 
    // But we should use booking.checkInDate)

    // Create invoice - save all available data
    const invoice = await prisma.invoice.create({
      data: {
        bookingId: id,
        invoiceNumber,
        invoiceType: 'ROOM',
        isManual: false,
        billNumber: booking.billNumber || null,
        billDate: checkoutDateTime, // Use checkout date as bill date
        visitorRegistrationNumber: booking.visitorRegistrationNumber?.toString() || null,

        guestName: booking.guestName,
        guestAddress: booking.guestAddress || null,
        guestMobile: booking.guestMobile || null,
        guestGstNumber: (gstEnabled && showGst) ? (booking.guestGstNumber || null) : null,

        // Use passed values from request
        guestState: guestState || null,
        guestNationality: guestNationality || null,
        guestStateCode: guestStateCode || null,

        companyName: companyName || booking.companyName || null,
        department: department || booking.department || null,
        designation: designation || booking.designation || null,

        // Use passed business phone
        businessPhoneNumber: businessPhoneNumber || null,

        roomType: booking.room.roomType.name,
        roomNumber: booking.room.roomNumber,
        checkInDate: booking.checkInDate,
        checkOutDate: checkoutDateTime,

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
        advanceAmount: 0,
        roundOff: Number.parseFloat(roundOff) || 0,
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
        checkoutDate: checkoutDateTime,
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
      (checkoutDateTime.getTime() - new Date(booking.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    )

    // Generate PDF using utility function - use invoice data for all fields
    const doc = generateBillPDF(settings, {
      invoiceNumber,
      billNumber: booking.visitorRegistrationNumber?.toString(), // Use visitor no as bill no / register no? Image has both.
      // Actually image has: Visitor's Register Sr. No. AND Bill No.
      // We'll pass both.
      visitorRegistrationNumber: booking.visitorRegistrationNumber?.toString(),
      billDate: checkoutDateTime,

      guestName: invoice.guestName,
      guestAddress: invoice.guestAddress || null,
      guestState: invoice.guestState || null,
      guestNationality: invoice.guestNationality || null,
      guestStateCode: invoice.guestStateCode || null,

      guestGstNumber: showGst && invoice.gstEnabled ? (invoice.guestGstNumber || null) : null,
      guestMobile: invoice.guestMobile || null,
      businessPhoneNumber: invoice.businessPhoneNumber || null,

      companyName: invoice.companyName || null,
      companyCode: null,
      department: invoice.department || null,
      designation: invoice.designation || null,

      roomNumber: booking.room.roomNumber,
      roomType: booking.room.roomType.name, // Use this for "PARTICULARS"

      checkInDate: booking.checkInDate,
      checkoutDate: checkoutDateTime,
      days,

      roomCharges,
      tariff: tariffAmount,

      foodCharges: showCombinedFoodBill ? combinedFoodCharges : 0,
      foodItems: showCombinedFoodBill ? foodItems : [], // Pass the itemized list!

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
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
