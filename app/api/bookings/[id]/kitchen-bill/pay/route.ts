import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

// Pay a kitchen bill (invoice)
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
    const { invoiceId, paymentMode, paymentStatus, amount } = await request.json()

    // Verify the invoice belongs to this booking and is a FOOD invoice
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        bookingId: id,
        invoiceType: 'FOOD',
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Kitchen bill not found for this booking' }, { status: 404 })
    }

    // Check if payment already exists for this invoice
    // We'll use a payment record linked to the booking
    // Note: We could add an invoiceId field to Payment model in the future for better tracking
    const payment = await prisma.payment.create({
      data: {
        bookingId: id,
        mode: paymentMode as 'CASH' | 'ONLINE',
        status: paymentStatus as 'PAID' | 'PENDING',
        amount: amount || invoice.totalAmount,
      },
    })

    return NextResponse.json({ 
      payment,
      message: 'Kitchen bill payment recorded successfully' 
    })
  } catch (error) {
    console.error('Error paying kitchen bill:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
