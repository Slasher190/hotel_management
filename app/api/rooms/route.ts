import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const type = request.nextUrl.searchParams.get('type')
    const status = request.nextUrl.searchParams.get('status')

    const where: any = {}
    if (type) {
      where.roomType = type
    }
    if (status) {
      where.status = status
    }

    const rooms = await prisma.room.findMany({
      where,
      orderBy: {
        roomNumber: 'asc',
      },
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomNumber, roomType } = await request.json()

    if (!roomNumber || !roomType) {
      return NextResponse.json({ error: 'Room number and type are required' }, { status: 400 })
    }

    // Check if room number already exists
    const existingRoom = await prisma.room.findUnique({
      where: { roomNumber },
    })

    if (existingRoom) {
      return NextResponse.json({ error: 'Room number already exists' }, { status: 400 })
    }

    const room = await prisma.room.create({
      data: {
        roomNumber,
        roomType: roomType as 'AC' | 'NON_AC',
        status: 'AVAILABLE',
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
