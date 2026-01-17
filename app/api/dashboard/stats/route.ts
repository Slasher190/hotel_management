import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const monthParam = request.nextUrl.searchParams.get('month')
    const month = monthParam ? new Date(monthParam + '-01') : new Date()
    const start = startOfMonth(month)
    const end = endOfMonth(month)

    // Total bookings for the month
    const totalBookings = await prisma.booking.count({
      where: {
        checkInDate: {
          gte: start,
          lte: end,
        },
      },
    })

    // Active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        status: 'ACTIVE',
      },
    })

    // Total revenue (from checked-out bookings)
    const checkedOutBookings = await prisma.booking.findMany({
      where: {
        status: 'CHECKED_OUT',
        checkoutDate: {
          gte: start,
          lte: end,
        },
      },
      include: {
        invoices: {
          where: {
            invoiceType: 'ROOM',
          },
        },
      },
    })

    const totalRevenue = checkedOutBookings.reduce((sum, booking) => {
      const invoice = booking.invoices[0]
      return sum + (invoice?.totalAmount || 0)
    }, 0)

    // GST Revenue
    const gstInvoices = await prisma.invoice.findMany({
      where: {
        gstEnabled: true,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    })

    const gstRevenue = gstInvoices.reduce((sum, invoice) => sum + (invoice.gstAmount || 0), 0)

    // Pending payments
    const pendingPayments = await prisma.payment.count({
      where: {
        status: 'PENDING',
      },
    })

    // Room stats
    const availableRooms = await prisma.room.count({
      where: {
        status: 'AVAILABLE',
      },
    })

    const occupiedRooms = await prisma.room.count({
      where: {
        status: 'OCCUPIED',
      },
    })

    return NextResponse.json({
      totalBookings,
      activeBookings,
      totalRevenue,
      gstRevenue,
      pendingPayments,
      availableRooms,
      occupiedRooms,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
