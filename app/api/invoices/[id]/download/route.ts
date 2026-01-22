import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { generateBillPDF } from '@/lib/pdf-utils'

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

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true,
              },
            },
            // Include food orders for FOOD invoices to show itemized details
            foodOrders: {
              include: {
                foodItem: true,
              },
            },
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const settings = await prisma.hotelSettings.findFirst()
    if (!settings) {
      return NextResponse.json({ error: 'Hotel settings not found' }, { status: 404 })
    }

    // Calculate days if booking exists
    let days = 0
    if (invoice.booking) {
      const checkIn = new Date(invoice.booking.checkInDate)
      const checkout = invoice.booking.checkoutDate ? new Date(invoice.booking.checkoutDate) : new Date()
      days = Math.ceil((checkout.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    }

    // Prepare food items for FOOD invoices (kitchen bills)
    // Get food orders from the invoice (they're linked via invoiceId)
    let foodItems: Array<{
      name: string
      quantity: number
      price: number
      gstPercent?: number
      total?: number
      orderTime?: Date | string
    }> | undefined = undefined

    if (invoice.invoiceType === 'FOOD') {
      // Get food orders linked to this invoice
      const invoiceFoodOrders = await prisma.foodOrder.findMany({
        where: {
          invoiceId: invoice.id,
        },
        include: {
          foodItem: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      })

      if (invoiceFoodOrders.length > 0) {
        foodItems = invoiceFoodOrders.map((order) => {
          const itemTotal = order.foodItem.price * order.quantity
          return {
            name: order.foodItem.name,
            quantity: order.quantity,
            price: order.foodItem.price,
            gstPercent: order.foodItem.gstPercent,
            total: itemTotal,
            orderTime: order.createdAt, // Include order time
          }
        })
      } else if (invoice.booking?.foodOrders) {
        // Fallback to booking food orders if invoice link not found
        foodItems = invoice.booking.foodOrders.map((order) => {
          const itemTotal = order.foodItem.price * order.quantity
          return {
            name: order.foodItem.name,
            quantity: order.quantity,
            price: order.foodItem.price,
            gstPercent: order.foodItem.gstPercent,
            total: itemTotal,
            orderTime: order.createdAt,
          }
        })
      }
    }

    const doc = generateBillPDF(settings, {
      invoiceNumber: invoice.invoiceNumber,
      billNumber: invoice.billNumber || null,
      billDate: invoice.billDate ? new Date(invoice.billDate) : invoice.createdAt,
      guestName: invoice.guestName,
      guestAddress: invoice.guestAddress || null,
      guestState: invoice.guestState || null,
      guestNationality: invoice.guestNationality || null,
      guestGstNumber: invoice.gstEnabled ? (invoice.guestGstNumber || null) : null,
      guestStateCode: invoice.guestStateCode || null,
      guestMobile: invoice.guestMobile || null,
      companyName: invoice.companyName || null,
      companyCode: invoice.companyCode || null,
      roomNumber: invoice.booking?.room.roomNumber,
      roomType: invoice.booking?.room.roomType.name || invoice.roomType || undefined,
      checkInDate: invoice.booking?.checkInDate,
      checkoutDate: invoice.booking?.checkoutDate || undefined,
      days,
      roomCharges: invoice.roomCharges,
      tariff: invoice.tariff,
      foodCharges: invoice.foodCharges,
      additionalGuestCharges: invoice.additionalGuestCharges,
      additionalGuests: invoice.booking?.additionalGuests || 0,
      gstEnabled: invoice.gstEnabled || false,
      gstPercent: 5, // Default GST percent - could be stored in invoice if needed
      gstAmount: invoice.gstAmount || 0,
      advanceAmount: invoice.advanceAmount || 0,
      roundOff: invoice.roundOff || 0,
      totalAmount: invoice.totalAmount,
      paymentMode: 'CASH', // Payment mode not stored in invoice - could be added if needed
      showGst: invoice.gstEnabled || false,
      foodItems, // Include food items for itemized kitchen bills
    })

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error downloading invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
