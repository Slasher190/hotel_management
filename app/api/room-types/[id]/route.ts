import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

// Delete room type
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if any rooms are using this room type
    const roomsCount = await prisma.room.count({
      where: { roomTypeId: id },
    })

    if (roomsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete room type that is in use' },
        { status: 400 }
      )
    }

    await prisma.roomType.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting room type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
