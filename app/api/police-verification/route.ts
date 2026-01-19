import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { maskIdNumber } from '@/lib/pdf-utils'
import { Prisma } from '@prisma/client'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Get police verification list
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Prisma.BookingWhereInput = {}
    if (startDate && endDate) {
      where.checkInDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        room: true,
      },
      orderBy: { checkInDate: 'desc' },
    })

    const guestList = bookings.map((booking, index) => ({
      sNo: index + 1,
      name: booking.guestName,
      idType: booking.idType,
      idNumber: booking.idNumber || 'N/A',
      roomNumber: booking.room.roomNumber,
      checkInDate: booking.checkInDate,
    }))

    if (format === 'pdf') {
      // Generate PDF
      const doc = new jsPDF()
      
      doc.setFontSize(16)
      doc.text('Police Verification Record', 105, 20, { align: 'center' })
      
      doc.setFontSize(10)
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' })

      const tableData = guestList.map((guest) => [
        guest.sNo.toString(),
        guest.name,
        guest.idType,
        maskIdNumber(guest.idNumber, guest.idType), // Mask ID number
      ])

      autoTable(doc, {
        startY: 40,
        head: [['S.No.', 'Name', 'ID Type', 'ID Number']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] },
      })

      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="police-verification-${Date.now()}.pdf"`,
        },
      })
    }

    return NextResponse.json(guestList)
  } catch (error) {
    console.error('Error fetching police verification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
