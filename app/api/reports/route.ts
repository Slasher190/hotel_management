import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma } from '@prisma/client'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const monthParam = request.nextUrl.searchParams.get('month')
    const gstFilter = request.nextUrl.searchParams.get('gst') === 'true'
    const paymentStatus = request.nextUrl.searchParams.get('paymentStatus')

    const month = monthParam ? new Date(monthParam + '-01') : new Date()
    const start = startOfMonth(month)
    const end = endOfMonth(month)

    const where: Prisma.BookingWhereInput = {
      checkInDate: {
        gte: start,
        lte: end,
      },
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: {
          include: {
            roomType: true,
          },
        },
        invoices: true,
        payments: true,
      },
      orderBy: {
        checkInDate: 'desc',
      },
    })

    // Apply filters
    let filteredBookings = bookings
    if (gstFilter) {
      filteredBookings = filteredBookings.filter((b) =>
        b.invoices.some((inv) => inv.gstEnabled)
      )
    }
    if (paymentStatus) {
      filteredBookings = filteredBookings.filter((b) =>
        b.payments.some((p) => p.status === paymentStatus)
      )
    }

    // Calculate summary
    const totalBookings = filteredBookings.length
    let totalRevenue = 0
    let gstRevenue = 0
    let paidAmount = 0
    let pendingAmount = 0

    filteredBookings.forEach((booking) => {
      const invoice = booking.invoices[0]
      const payment = booking.payments[0]

      if (invoice) {
        totalRevenue += invoice.totalAmount
        if (invoice.gstEnabled) {
          gstRevenue += invoice.gstAmount || 0
        }
      } else {
        totalRevenue += booking.roomPrice
      }

      if (payment) {
        if (payment.status === 'PAID') {
          paidAmount += payment.amount
        } else {
          pendingAmount += payment.amount
        }
      }
    })

    return NextResponse.json({
      bookings: filteredBookings,
      summary: {
        totalBookings,
        totalRevenue,
        gstRevenue,
        paidAmount,
        pendingAmount,
      },
    })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
