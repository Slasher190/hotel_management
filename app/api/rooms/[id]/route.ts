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

    // Check if room has active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        roomId: id,
        status: 'ACTIVE',
      },
    })

    if (activeBookings > 0) {
      return NextResponse.json(
        { error: 'Cannot delete room with active bookings' },
        { status: 400 }
      )
    }

    await prisma.room.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
