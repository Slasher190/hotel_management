import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManager } from '@/lib/role-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireManager(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 403 })
    }

    const { id } = await params

    // Check if invoice exists
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // If it's a booking bill (ROOM type, not manual), delete associated food bills
    if (invoice.invoiceType === 'ROOM' && !invoice.isManual && invoice.bookingId) {
      // Delete all food bills for this booking
      await prisma.invoice.deleteMany({
        where: {
          bookingId: invoice.bookingId,
          invoiceType: 'FOOD',
        },
      })
    }

    await prisma.invoice.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Invoice deleted successfully' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
