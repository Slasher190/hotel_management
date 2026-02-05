import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma } from '@prisma/client'
import { startOfDayIST, endOfDayIST, getISTDate } from '@/lib/date-utils'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const monthParam = searchParams.get('month')
    const gstFilter = searchParams.get('gst') === 'true'
    const paymentStatus = searchParams.get('paymentStatus') as any // Cast to any to avoid complex enum parsing in this snippet
    const page = Number.parseInt(searchParams.get('page') || '1')
    const limit = Number.parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    let start, end

    if (fromParam && toParam) {
      start = startOfDayIST(fromParam)
      end = endOfDayIST(toParam)
    } else if (monthParam) {
      const month = new Date(monthParam + '-01')
      start = startOfDayIST(monthParam + '-01')
      // simple hack for end of month in IST context, or just fallback to date-fns for now if IST utils are tricky for arbitrary objects without string
      // But let's try to be consistent. 
      const parts = monthParam.split('-')
      const year = parseInt(parts[0])
      const m = parseInt(parts[1])
      const lastDay = new Date(year, m, 0).getDate()
      end = endOfDayIST(`${monthParam}-${lastDay}`)
    } else {
      const now = getISTDate()
      start = startOfDayIST(now)
      end = endOfDayIST(now)
      // Actually, default was "current month" in previous code.
      // previous: const month = ... : new Date(); start = startOfMonth(month); end = endOfMonth(month);
      // Let's keep it current month.
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth() + 1
      const monthStr = currentMonth.toString().padStart(2, '0')
      start = startOfDayIST(`${currentYear}-${monthStr}-01`)
      const lastDay = new Date(currentYear, currentMonth, 0).getDate()
      end = endOfDayIST(`${currentYear}-${monthStr}-${lastDay}`)
    }

    const where: Prisma.BookingWhereInput = {
      checkInDate: {
        gte: start,
        lte: end,
      },
    }

    // Apply filters at DB level
    if (gstFilter) {
      where.invoices = {
        some: {
          gstEnabled: true,
          invoiceType: { in: ['ROOM', 'MANUAL'] }
        }
      }
    }

    if (paymentStatus) {
      where.payments = {
        some: {
          status: paymentStatus
        }
      }
    }

    // Execute queries in parallel
    const [bookings, total, summaryData] = await Promise.all([
      // 1. Paginated data for table
      prisma.booking.findMany({
        where,
        include: {
          room: {
            include: {
              roomType: true,
            },
          },
          invoices: {
            where: {
              invoiceType: { in: ['ROOM', 'MANUAL'] },
            },
          },
          payments: true,
        },
        orderBy: {
          checkInDate: 'desc',
        },
        skip,
        take: limit,
      }),

      // 2. Total count for pagination
      prisma.booking.count({ where }),

      // 3. Lightweight query for summary (fetching all matching records but only necessary fields)
      prisma.booking.findMany({
        where,
        select: {
          roomPrice: true,
          invoices: {
            where: {
              invoiceType: { in: ['ROOM', 'MANUAL'] },
            },
            select: {
              totalAmount: true,
              gstEnabled: true,
              gstAmount: true,
            },
          },
          payments: {
            select: {
              amount: true,
              status: true,
            },
          },
        },
      }),
    ])

    // Calculate summary from summaryData
    const totalBookings = total
    let totalRevenue = 0
    let gstRevenue = 0
    let paidAmount = 0
    let pendingAmount = 0

    summaryData.forEach((booking) => {
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
      bookings,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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
