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
    const allInvoices = await prisma.invoice.findMany({
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

    // Group invoices by booking to show combined bills
    const combinedBillsMap = new Map<string, {
      bookingId: string
      guestName: string
      room: {
        roomNumber: string
        roomType: {
          name: string
        }
      }
      invoices: typeof allInvoices
      totalAmount: number
      totalFoodCharges: number
      totalGst: number
    }>()

    allInvoices.forEach((invoice) => {
      if (invoice.bookingId && invoice.booking) {
        const key = invoice.bookingId
        if (!combinedBillsMap.has(key)) {
          combinedBillsMap.set(key, {
            bookingId: key,
            guestName: invoice.guestName,
            room: invoice.booking.room,
            invoices: [],
            totalAmount: 0,
            totalFoodCharges: 0,
            totalGst: 0,
          })
        }
        const combined = combinedBillsMap.get(key)!
        combined.invoices.push(invoice)
        combined.totalAmount += invoice.totalAmount
        combined.totalFoodCharges += invoice.foodCharges
        combined.totalGst += invoice.gstAmount || 0
      }
    })

    // Convert to array for response
    const combinedBills = Array.from(combinedBillsMap.values())

    // Calculate totals
    const totalAmount = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const totalGst = allInvoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0)
    const totalFoodCharges = allInvoices.reduce((sum, inv) => sum + inv.foodCharges, 0)

    return NextResponse.json({
      invoices: combinedBills, // Return combined bills instead of individual invoices
      allInvoices, // Keep individual invoices for backward compatibility
      summary: {
        totalInvoices: combinedBills.length, // Count of combined bills (bookings)
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
