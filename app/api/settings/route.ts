import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

// Get hotel settings
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if Prisma client is properly initialized
    if (!prisma || !prisma.hotelSettings) {
      console.error('Prisma client not properly initialized')
      // Return default values as fallback
      return NextResponse.json({
        id: 'default',
        name: 'HOTEL SAMRAT INN',
        address: 'OLD BUS STAND, HAZARIBAGH HAZARIBAGH',
        phone: '7050240391, 9471302111',
        email: 'hotelsamratinn@gmail.com',
        gstin: '20AAIFH0390N3ZD',
        logoUrl: null,
      })
    }

    let settings = null
    try {
      settings = await prisma.hotelSettings.findFirst()
    } catch (dbError: any) {
      console.error('Database error in GET settings:', dbError)
      // If table doesn't exist, return default values
      if (dbError.code === 'P2021' || dbError.message?.includes('does not exist')) {
        return NextResponse.json({
          id: 'default',
          name: 'HOTEL SAMRAT INN',
          address: 'OLD BUS STAND, HAZARIBAGH HAZARIBAGH',
          phone: '7050240391, 9471302111',
          email: 'hotelsamratinn@gmail.com',
          gstin: '20AAIFH0390N3ZD',
          logoUrl: null,
        })
      }
      throw dbError
    }
    
    if (!settings) {
      // Create default settings
      try {
        settings = await prisma.hotelSettings.create({
          data: {
            name: 'HOTEL SAMRAT INN',
            address: 'OLD BUS STAND, HAZARIBAGH HAZARIBAGH',
            phone: '7050240391, 9471302111',
            email: 'hotelsamratinn@gmail.com',
            gstin: '20AAIFH0390N3ZD',
          },
        })
      } catch (createError: any) {
        console.error('Error creating default settings:', createError)
        // If creation fails, return default values
        return NextResponse.json({
          id: 'default',
          name: 'HOTEL SAMRAT INN',
          address: 'OLD BUS STAND, HAZARIBAGH HAZARIBAGH',
          phone: '7050240391, 9471302111',
          email: 'hotelsamratinn@gmail.com',
          gstin: '20AAIFH0390N3ZD',
          logoUrl: null,
        })
      }
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error fetching settings:', error)
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

// Update hotel settings
export async function PUT(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.address || !data.phone) {
      return NextResponse.json(
        { error: 'Name, address, and phone are required' },
        { status: 400 }
      )
    }

    let settings = await prisma.hotelSettings.findFirst()
    
    const updateData = {
      name: data.name,
      address: data.address,
      phone: data.phone,
      email: data.email || null,
      gstin: data.gstin || null,
      logoUrl: data.logoUrl || null,
    }
    
    if (settings) {
      settings = await prisma.hotelSettings.update({
        where: { id: settings.id },
        data: updateData,
      })
    } else {
      settings = await prisma.hotelSettings.create({
        data: updateData,
      })
    }

    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
