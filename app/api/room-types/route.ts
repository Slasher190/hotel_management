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

    // Check if Prisma client is properly initialized
    if (!prisma || !prisma.roomType) {
      console.error('Prisma client not properly initialized')
      return NextResponse.json([])
    }

    let roomTypes = []
    try {
      roomTypes = await prisma.roomType.findMany({
        orderBy: { name: 'asc' },
      })
    } catch (dbError: any) {
      console.error('Database error in GET room-types:', dbError)
      // If table doesn't exist, return empty array
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        return NextResponse.json([])
      }
      throw dbError
    }

    return NextResponse.json(roomTypes)
  } catch (error: any) {
    console.error('Error fetching room types:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
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
