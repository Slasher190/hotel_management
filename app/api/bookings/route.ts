import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffOrManager, requireManager } from '@/lib/role-auth'
import { Prisma, BookingStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = requireStaffOrManager(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get('status')
    const paymentPending = request.nextUrl.searchParams.get('paymentPending')
    const page = Number.parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') || '10')
    const showAll = request.nextUrl.searchParams.get('showAll') === 'true'
    const search = request.nextUrl.searchParams.get('search')
    const dateFrom = request.nextUrl.searchParams.get('dateFrom')
    const dateTo = request.nextUrl.searchParams.get('dateTo')
    const roomNumber = request.nextUrl.searchParams.get('roomNumber')
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'checkInDate'
    const sortOrder = request.nextUrl.searchParams.get('sortOrder') || 'desc'

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

    if (search) {
      where.guestName = { contains: search, mode: Prisma.QueryMode.insensitive }
    }

    if (dateFrom || dateTo) {
      where.checkInDate = {}
      if (dateFrom) {
        // dateFrom should be the start of the day (00:00:00)
        const fromDate = new Date(dateFrom)
        fromDate.setHours(0, 0, 0, 0)
        where.checkInDate.gte = fromDate
      }
      if (dateTo) {
        // dateTo should be the end of the day (23:59:59)
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        where.checkInDate.lte = toDate
      }
      // Validate date range: dateFrom should be <= dateTo
      if (dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) {
        return NextResponse.json(
          { error: 'Date From must be less than or equal to Date To' },
          { status: 400 }
        )
      }
    }

    if (roomNumber) {
      where.room = {
        roomNumber: { contains: roomNumber, mode: Prisma.QueryMode.insensitive },
      }
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
          [sortBy]: sortOrder,
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
    const user = requireManager(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 403 })
    }

    const {
      roomId,
      guestName,
      idType,
      idNumber,
      additionalGuests,
      additionalGuestCharges,
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
        additionalGuestCharges: parseFloat(additionalGuestCharges) || 0,
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
