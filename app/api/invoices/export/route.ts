import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma } from '@prisma/client'
import { generateBillPDF } from '@/lib/pdf-utils'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const invoiceType = searchParams.get('type')
    const isManual = searchParams.get('isManual')
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const showAll = searchParams.get('showAll') === 'true'

    const where: Prisma.InvoiceWhereInput = {}
    if (invoiceType) {
      where.invoiceType = invoiceType
    }
    if (isManual !== null) {
      where.isManual = isManual === 'true'
    }
    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { invoiceNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ]
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }
    if (minAmount || maxAmount) {
      where.totalAmount = {}
      if (minAmount) {
        where.totalAmount.gte = Number.parseFloat(minAmount)
      }
      if (maxAmount) {
        where.totalAmount.lte = Number.parseFloat(maxAmount)
      }
    }

    const invoices = await prisma.invoice.findMany({
      where,
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
      orderBy: { createdAt: 'desc' },
      ...(showAll ? {} : { take: 100 }), // Limit to 100 if not showAll
    })

    if (format === 'pdf') {
      const doc = new jsPDF()
      doc.setFontSize(16)
      doc.text('Bill History Report', 105, 20, { align: 'center' })
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 105, 30, { align: 'center' })

      const tableData = invoices.map((inv) => [
        inv.invoiceNumber,
        inv.guestName,
        inv.invoiceType,
        inv.isManual ? 'Manual' : 'Booking',
        inv.booking?.room.roomNumber || inv.roomType || 'N/A',
        inv.billDate ? new Date(inv.billDate).toLocaleDateString('en-IN') : new Date(inv.createdAt).toLocaleDateString('en-IN'),
        `Rs. ${inv.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ])

      autoTable(doc, {
        startY: 40,
        head: [['Invoice #', 'Guest Name', 'Type', 'Source', 'Room', 'Date', 'Amount']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [142, 14, 28] },
      })

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="bills-report-${Date.now()}.pdf"`,
        },
      })
    }

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Error exporting invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
