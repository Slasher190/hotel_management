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

    let settings = await prisma.hotelSettings.findFirst()
    
    if (!settings) {
      // Create default settings
      settings = await prisma.hotelSettings.create({
        data: {
          name: 'HOTEL SAMRAT INN',
          address: 'OLD BUS STAND, HAZARIBAGH HAZARIBAGH',
          phone: '7050240391, 9471302111',
          email: 'hotelsamratinn@gmail.com',
          gstin: '20AAIFH0390N3ZD',
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
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
    
    let settings = await prisma.hotelSettings.findFirst()
    
    if (settings) {
      settings = await prisma.hotelSettings.update({
        where: { id: settings.id },
        data,
      })
    } else {
      settings = await prisma.hotelSettings.create({
        data: {
          name: data.name || 'HOTEL SAMRAT INN',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          gstin: data.gstin || '',
          logoUrl: data.logoUrl || null,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
