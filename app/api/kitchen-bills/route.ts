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

    // Get all food invoices for the month
    const invoices = await prisma.invoice.findMany({
      where: {
        invoiceType: 'FOOD',
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        booking: {
          include: {
            room: {
              include: {
                roomType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate totals
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const totalGst = invoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0)
    const totalFoodCharges = invoices.reduce((sum, inv) => sum + inv.foodCharges, 0)

    return NextResponse.json({
      invoices,
      summary: {
        totalInvoices: invoices.length,
        totalAmount,
        totalGst,
        totalFoodCharges,
      },
    })
  } catch (error) {
    console.error('Error fetching kitchen bills:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
