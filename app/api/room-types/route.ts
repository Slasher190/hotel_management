import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

// Get all room types
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const roomTypes = await prisma.roomType.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(roomTypes)
  } catch (error) {
    console.error('Error fetching room types:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create new room type
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Room type name is required' }, { status: 400 })
    }

    const roomType = await prisma.roomType.create({
      data: { name: name.trim() },
    })

    return NextResponse.json(roomType)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Room type already exists' }, { status: 400 })
    }
    console.error('Error creating room type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
