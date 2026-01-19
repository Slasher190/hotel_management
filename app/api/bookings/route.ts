import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma, BookingStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get('status')
    const paymentPending = request.nextUrl.searchParams.get('paymentPending')
    const page = Number.parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') || '20')
    const showAll = request.nextUrl.searchParams.get('showAll') === 'true'

    const where: Prisma.BookingWhereInput = {}
    
    // Filter for checked out bookings with pending payment
    if (paymentPending === 'true') {
      where.status = 'CHECKED_OUT'
      where.payments = {
        some: {
          status: 'PENDING',
        },
      }
    } else if (status) {
      where.status = status as BookingStatus
    }

    const skip = showAll ? 0 : (page - 1) * limit
    const take = showAll ? undefined : limit

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          room: {
            include: {
              roomType: true,
            },
          },
          payments: true,
        },
        orderBy: {
          checkInDate: 'desc',
        },
        skip,
        take,
      }),
      showAll ? Promise.resolve(0) : prisma.booking.count({ where }),
    ])

    return NextResponse.json({
      bookings,
      pagination: showAll
        ? null
        : {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
    })
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

    const {
      roomId,
      guestName,
      idType,
      idNumber,
      additionalGuests,
      mattresses,
      roomPrice,
    } = await request.json()

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
        idType: idType as 'AADHAAR' | 'DL' | 'VOTER_ID' | 'PASSPORT' | 'OTHER',
        idNumber: idNumber || null,
        additionalGuests: parseInt(additionalGuests) || 0,
        mattresses: parseInt(mattresses) || 0,
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
