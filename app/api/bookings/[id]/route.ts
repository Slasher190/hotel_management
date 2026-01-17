import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

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
    console.log('Fetching booking with ID:', id)

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        room: true,
        foodOrders: {
          include: {
            foodItem: true,
          },
        },
        invoices: true,
        payments: true,
      },
    })

    if (!booking) {
      console.log('Booking not found for ID:', id)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    console.log('Booking found:', booking.id, booking.guestName)
    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
