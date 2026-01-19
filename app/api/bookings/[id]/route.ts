import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma } from '@prisma/client'

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

// Update booking
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const updateData = await request.json()

    // Allowed fields to update
    const allowedFields = [
      'guestName',
      'idType',
      'idNumber',
      'additionalGuests',
      'additionalGuestCharges',
      'mattresses',
      'roomPrice',
      'tariff',
      'checkInDate',
      'checkoutDate',
    ]

    const dataToUpdate: Record<string, unknown> = {}
    for (const field of allowedFields) {
      const value = updateData[field as keyof typeof updateData]
      if (value !== undefined) {
        dataToUpdate[field] = value
      }
    }

    // Handle date conversions
    if (dataToUpdate.checkInDate) {
      dataToUpdate.checkInDate = new Date(dataToUpdate.checkInDate as string)
    }
    if (dataToUpdate.checkoutDate) {
      dataToUpdate.checkoutDate = new Date(dataToUpdate.checkoutDate as string)
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: dataToUpdate as Prisma.BookingUpdateInput,
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
        invoices: true,
        payments: true,
      },
    })

    return NextResponse.json(updatedBooking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
