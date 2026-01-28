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

    const { searchParams } = request.nextUrl
    const monthParam = searchParams.get('month')
    const gstFilter = searchParams.get('gst') === 'true'
    const paymentStatus = searchParams.get('paymentStatus') as any // Cast to any to avoid complex enum parsing in this snippet
    const page = Number.parseInt(searchParams.get('page') || '1')
    const limit = Number.parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const month = monthParam ? new Date(monthParam + '-01') : new Date()
    const start = startOfMonth(month)
    const end = endOfMonth(month)

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
