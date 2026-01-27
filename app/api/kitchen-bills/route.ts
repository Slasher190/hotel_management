// Force rebuild
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function getUser(req: Request) {
  const headersList = await headers()
  const token = headersList.get('authorization')?.split(' ')[1]

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    return decoded
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'active'

    if (type === 'history') {
      const monthStr = searchParams.get('month')
      const yearStr = searchParams.get('year')
      const pageStr = searchParams.get('page') || '1'
      const limitStr = searchParams.get('limit') || '10'

      if (!monthStr || !yearStr) {
        return NextResponse.json({ error: 'Month and Year are required for history' }, { status: 400 })
      }

      const month = parseInt(monthStr)
      const year = parseInt(yearStr)
      const page = parseInt(pageStr)
      const limit = parseInt(limitStr)
      const skip = (page - 1) * limit

      const startDate = new Date(year, month, 1) // 0-indexed month
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

      // Get total count for pagination
      const totalCount = await prisma.invoice.count({
        where: {
          invoiceType: 'KITCHEN_MASTER',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      })

      // Get paginated invoices
      const invoices = await prisma.invoice.findMany({
        where: {
          invoiceType: 'KITCHEN_MASTER',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          booking: {
            include: {
              room: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      })

      const historyBills = invoices
        .filter(invoice => invoice.booking) // Ensure booking exists
        .map(invoice => ({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          bookingId: invoice.bookingId,
          guestName: invoice.booking!.guestName, // Non-null assertion safe due to filter
          roomNumber: invoice.booking!.room.roomNumber,
          amount: invoice.totalAmount, // Fixed: amount -> totalAmount
          createdAt: invoice.createdAt,
          status: 'FINALIZED'
        }))

      // Calculate total revenue for the entire month (not just current page)
      const allInvoices = await prisma.invoice.findMany({
        where: {
          invoiceType: 'KITCHEN_MASTER',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          totalAmount: true
        }
      })

      const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

      return NextResponse.json({
        bills: historyBills,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          limit
        },
        totalRevenue
      })
    }

    // Default: Fetch active bookings that have food orders
    const bookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'CHECKED_OUT']
        }
      },
      include: {
        room: true,
        foodOrders: {
          include: {
            foodItem: true
          }
        },
        invoices: {
          where: {
            invoiceType: 'KITCHEN_BILL'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Filter to only bookings that actually have food orders
    const bookingsWithKitchenBills = bookings.filter(b => b.foodOrders.length > 0)

    const result = bookingsWithKitchenBills.map(booking => {
      const totalFoodAmount = booking.foodOrders.reduce((sum, order) => sum + (order.foodItem.price * order.quantity), 0)
      return {
        id: booking.id,
        guestName: booking.guestName,
        roomNumber: booking.room.roomNumber,
        totalFoodOrders: booking.foodOrders.length,
        totalAmount: totalFoodAmount,
        status: booking.status,
        createdAt: booking.createdAt
      }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching kitchen bills:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
