import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma, BusStatus } from '@prisma/client'

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
    const showAll = searchParams.get('showAll') === 'true'

    const where: Prisma.BusBookingWhereInput = {}
    if (!showAll && date) {
      const searchDate = new Date(date)
      searchDate.setHours(0, 0, 0, 0)
      const searchDateEnd = new Date(date)
      searchDateEnd.setHours(23, 59, 59, 999)
      where.OR = [
        {
          fromDate: {
            gte: searchDate,
            lte: searchDateEnd,
          },
        },
        {
          toDate: {
            gte: searchDate,
            lte: searchDateEnd,
          },
        },
        {
          AND: [
            { fromDate: { lte: searchDate } },
            { toDate: { gte: searchDateEnd } },
          ],
        },
      ]
    }
    if (status) {
      where.status = status as BusStatus
    }

    const bookings = await prisma.busBooking.findMany({
      where,
      orderBy: { fromDate: 'desc' },
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

    const { busNumber, fromDate, toDate, status, notes } = await request.json()

    if (!busNumber || !fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Bus number, from date, and to date are required' },
        { status: 400 }
      )
    }

    if (new Date(fromDate) > new Date(toDate)) {
      return NextResponse.json(
        { error: 'From date cannot be after to date' },
        { status: 400 }
      )
    }

    const booking = await prisma.busBooking.create({
      data: {
        busNumber,
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
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
