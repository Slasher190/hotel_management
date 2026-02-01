import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { startOfDayIST, endOfDayIST, getISTDate } from '@/lib/date-utils'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const monthParam = request.nextUrl.searchParams.get('month')
    let start, end

    if (monthParam) {
      // monthParam is YYYY-MM
      start = startOfDayIST(`${monthParam}-01`)
      // Get last day of month by creating a date and finding endOfMonth
      // We can rely on date-fns endOfMonth on the parsed date, then formatted back to string to pass to endOfDayIST
      // or easier: just add 1 month to start and subtract 1ms? No, variable days.

      const parts = monthParam.split('-')
      const year = parseInt(parts[0])
      const month = parseInt(parts[1])
      // Last day of month
      const lastDay = new Date(year, month, 0).getDate() // day 0 of next month is last day of this month
      end = endOfDayIST(`${monthParam}-${lastDay}`)
    } else {
      // Current month in IST
      const nowIST = getISTDate()
      const currentYear = nowIST.getFullYear()
      const currentMonth = nowIST.getMonth() + 1 // 1-indexed

      // Pad month
      const monthStr = currentMonth.toString().padStart(2, '0')
      start = startOfDayIST(`${currentYear}-${monthStr}-01`)

      const lastDay = new Date(currentYear, currentMonth, 0).getDate()
      end = endOfDayIST(`${currentYear}-${monthStr}-${lastDay}`)
    }

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

    // Total revenue (from checked-out bookings, excluding manual bills)
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
            isManual: false, // Exclude manual bills from revenue
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

    // Total active tours/bus bookings (status BOOKED or PENDING)
    const activeTours = await prisma.busBooking.count({
      where: {
        OR: [
          { status: 'BOOKED' },
          { status: 'PENDING' },
        ],
        toDate: {
          gte: getISTDate(), // Only count tours that haven't ended in IST logic
        },
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
      activeTours,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
