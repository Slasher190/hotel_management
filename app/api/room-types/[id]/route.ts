import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManager } from '@/lib/role-auth'

// Update room type
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireManager(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 403 })
    }

    const { id } = await params
    const { name, price } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Room type name is required' }, { status: 400 })
    }

    const roomType = await prisma.roomType.update({
      where: { id },
      data: {
        name: name.trim(),
        price: typeof price === 'number' ? price : undefined
      },
    })

    return NextResponse.json(roomType)
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'Room type with this name already exists' }, { status: 400 })
    }
    console.error('Error updating room type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Delete room type
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
