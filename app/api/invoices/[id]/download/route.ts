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

    const doc = generateBillPDF(settings, {
      invoiceNumber: invoice.invoiceNumber,
      billNumber: invoice.billNumber || null,
      billDate: invoice.billDate ? new Date(invoice.billDate) : invoice.createdAt,
      guestName: invoice.guestName,
      guestAddress: null,
      guestState: null,
      guestNationality: null,
      guestGstNumber: invoice.gstEnabled ? null : null, // Will be handled by showGst
      guestStateCode: null,
      guestMobile: null,
      companyName: null,
      companyCode: null,
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
      gstPercent: 5,
      gstAmount: invoice.gstAmount || 0,
      advanceAmount: 0,
      roundOff: 0,
      totalAmount: invoice.totalAmount,
      paymentMode: 'CASH',
      showGst: invoice.gstEnabled || false,
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
