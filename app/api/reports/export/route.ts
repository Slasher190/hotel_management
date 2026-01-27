import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma } from '@prisma/client'
import { startOfMonth, endOfMonth } from 'date-fns'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const monthParam = request.nextUrl.searchParams.get('month')
    const format = request.nextUrl.searchParams.get('format') || 'excel'
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
        invoices: {
          where: {
            invoiceType: {
              in: ['ROOM', 'MANUAL'],
            },
          },
        },
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

    // Prepare data
    const data = filteredBookings.map((booking) => {
      const invoice = booking.invoices[0]
      const payment = booking.payments[0]
      return {
        'Guest Name': booking.guestName,
        'Room Number': booking.room.roomNumber,
        'Room Type': booking.room.roomType.name,
        'Check-In Date': new Date(booking.checkInDate).toLocaleDateString(),
        'Checkout Date': booking.checkoutDate
          ? new Date(booking.checkoutDate).toLocaleDateString()
          : 'N/A',
        'Room Price': booking.roomPrice,
        'Total Amount': invoice?.totalAmount || booking.roomPrice,
        'GST Amount': invoice?.gstAmount || 0,
        'Payment Mode': payment?.mode || 'N/A',
        'Payment Status': payment?.status || 'N/A',
        'Booking Status': booking.status,
      }
    })

    if (format === 'csv') {
      // Convert to CSV manually
      const headers = Object.keys(data[0] || {})
      const csvRows = [
        headers.join(','),
        ...data.map((row) =>
          headers.map((header) => {
            const value = row[header as keyof typeof row]
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : value
          }).join(',')
        ),
      ]
      const csv = csvRows.join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="report-${monthParam || 'all'}.csv"`,
        },
      })
    } else {
      const workbook = XLSX.utils.book_new()
      const worksheet = XLSX.utils.json_to_sheet(data)
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="report-${monthParam || 'all'}.xlsx"`,
        },
      })
    }
  } catch (error) {
    console.error('Error exporting report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
