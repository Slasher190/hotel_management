import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffOrManager } from '@/lib/role-auth'

export async function POST(request: NextRequest) {
  try {
    const user = requireStaffOrManager(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bookingId, foodItemId, quantity, chefId } = await request.json()

    if (!bookingId || !foodItemId || !quantity) {
      return NextResponse.json(
        { error: 'Booking ID, food item ID, and quantity are required' },
        { status: 400 }
      )
    }

    if (!chefId) {
      return NextResponse.json(
        { error: 'Chef selection is required' },
        { status: 400 }
      )
    }

    // Check if booking exists and is active
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (booking.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Can only add food to active bookings' },
        { status: 400 }
      )
    }

    // Check if food item exists and is enabled
    const foodItem = await prisma.foodItem.findUnique({
      where: { id: foodItemId },
    })

    if (!foodItem) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 })
    }

    if (!foodItem.enabled) {
      return NextResponse.json({ error: 'Food item is disabled' }, { status: 400 })
    }

    // Validate Chef
    const chef = await prisma.user.findUnique({
      where: { id: chefId },
    })

    if (!chef) {
      return NextResponse.json({ error: 'Chef not found' }, { status: 404 })
    }

    const foodOrder = await prisma.foodOrder.create({
      data: {
        bookingId,
        foodItemId,
        quantity: parseInt(quantity),
        chefId,
        chefName: chef.name,
      },
    })

    return NextResponse.json(foodOrder, { status: 201 })
  } catch (error) {
    console.error('Error adding food order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
