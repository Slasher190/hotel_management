import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if food order exists
    const foodOrder = await prisma.foodOrder.findUnique({
      where: { id },
      include: {
        booking: true,
      },
    })

    if (!foodOrder) {
      return NextResponse.json({ error: 'Food order not found' }, { status: 404 })
    }

    // Only allow deletion if booking is active
    if (foodOrder.booking.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Can only remove food from active bookings' },
        { status: 400 }
      )
    }

    await prisma.foodOrder.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Food order deleted successfully' })
  } catch (error) {
    console.error('Error deleting food order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
