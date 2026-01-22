import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { generateBillPDF } from '@/lib/pdf-utils'

// Generate kitchen bill for a booking (can be called multiple times)
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
    let includeOrders: string[] | undefined
    try {
      const body = await request.json()
      includeOrders = body.includeOrders
    } catch {
      // Request body might be empty, that's okay - use all unpaid orders
      includeOrders = undefined
    }

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
          // Only include unpaid orders (where invoiceId is null)
          where: {
            invoiceId: null,
            // If includeOrders is provided, only include those specific orders
            ...(includeOrders && includeOrders.length > 0 ? {
              id: {
                in: includeOrders,
              },
            } : {}),
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.foodOrders.length === 0) {
      return NextResponse.json({ error: 'No unpaid food orders found for this booking' }, { status: 400 })
    }

    // Calculate food charges (no GST for kitchen bills)
    let foodCharges = 0
    booking.foodOrders.forEach((order) => {
      const itemTotal = order.foodItem.price * order.quantity
      foodCharges += itemTotal
    })

    // No GST for kitchen bills
    const totalAmount = foodCharges

    // Generate invoice number
    const invoiceNumber = `KITCHEN-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`

    // Create invoice (no GST for kitchen bills)
    const invoice = await prisma.invoice.create({
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
        gstEnabled: false, // No GST for kitchen bills
        gstNumber: null,
        gstAmount: 0,
        totalAmount,
      },
    })

    // Mark food orders as invoiced
    await prisma.foodOrder.updateMany({
      where: {
        id: {
          in: booking.foodOrders.map((order) => order.id),
        },
      },
      data: {
        invoiceId: invoice.id,
      },
    })

    // Get hotel settings
    const settings = await prisma.hotelSettings.findFirst()
    if (!settings) {
      return NextResponse.json({ error: 'Hotel settings not found' }, { status: 404 })
    }

    // Prepare food items for PDF with order time (sorted by order time)
    const sortedOrders = [...booking.foodOrders].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    const foodItems = sortedOrders.map((order) => {
      const itemTotal = order.foodItem.price * order.quantity
      return {
        name: order.foodItem.name,
        quantity: order.quantity,
        price: order.foodItem.price,
        orderTime: order.createdAt, // Include order time
        total: itemTotal,
      }
    })

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
      gstEnabled: false, // No GST for kitchen bills
      gstPercent: 0,
      gstAmount: 0,
      advanceAmount: 0,
      roundOff: 0,
      totalAmount,
      paymentMode: 'CASH',
      showGst: false, // No GST for kitchen bills
      foodItems, // Pass food items with order times for itemized display
    })

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="kitchen-bill-${invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating kitchen bill:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}

// Get kitchen bill history for a booking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const invoices = await prisma.invoice.findMany({
      where: {
        bookingId: id,
        invoiceType: 'FOOD',
      },
      include: {
        foodOrders: {
          include: {
            foodItem: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Error fetching kitchen bills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
