import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get('status')
    const paymentPending = request.nextUrl.searchParams.get('paymentPending')

    const where: any = {}
    
    // Filter for checked out bookings with pending payment
    if (paymentPending === 'true') {
      where.status = 'CHECKED_OUT'
      where.payments = {
        some: {
          status: 'PENDING',
        },
      }
    } else if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: true,
        payments: true,
      },
      orderBy: {
        checkInDate: 'desc',
      },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId, guestName, idType, roomPrice } = await request.json()

    if (!roomId || !guestName || !idType || !roomPrice) {
      return NextResponse.json(
        { error: 'Room, guest name, ID type, and room price are required' },
        { status: 400 }
      )
    }

    // Check if room is available
    const room = await prisma.room.findUnique({
      where: { id: roomId },
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.status !== 'AVAILABLE') {
      return NextResponse.json({ error: 'Room is not available' }, { status: 400 })
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        roomId,
        guestName,
        idType: idType as 'AADHAAR' | 'DL' | 'PASSPORT' | 'OTHER',
        roomPrice: parseFloat(roomPrice),
        status: 'ACTIVE',
      },
    })

    // Update room status
    await prisma.room.update({
      where: { id: roomId },
      data: { status: 'OCCUPIED' },
    })

    return NextResponse.json(booking, { status: 201 })
  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
