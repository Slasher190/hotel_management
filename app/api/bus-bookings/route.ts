import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

// Get bus bookings
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    const where: any = {}
    if (date) {
      const startDate = new Date(date)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(date)
      endDate.setHours(23, 59, 59, 999)
      where.bookingDate = {
        gte: startDate,
        lte: endDate,
      }
    }
    if (status) {
      where.status = status
    }

    const bookings = await prisma.busBooking.findMany({
      where,
      orderBy: { bookingDate: 'desc' },
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Error fetching bus bookings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create bus booking
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { busNumber, bookingDate, status, notes } = await request.json()

    if (!busNumber || !bookingDate) {
      return NextResponse.json(
        { error: 'Bus number and booking date are required' },
        { status: 400 }
      )
    }

    const booking = await prisma.busBooking.create({
      data: {
        busNumber,
        bookingDate: new Date(bookingDate),
        status: status || 'PENDING',
        notes: notes || null,
      },
    })

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error creating bus booking:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
