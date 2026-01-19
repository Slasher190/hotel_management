import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const enabled = request.nextUrl.searchParams.get('enabled')

    const where: Prisma.FoodItemWhereInput = {}
    if (enabled === 'true') {
      where.enabled = true
    }

    const foodItems = await prisma.foodItem.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(foodItems)
  } catch (error) {
    console.error('Error fetching food items:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, category, price, gstPercent } = await request.json()

    if (!name || !category || price === undefined || gstPercent === undefined) {
      return NextResponse.json(
        { error: 'Name, category, price, and GST percentage are required' },
        { status: 400 }
      )
    }

    const foodItem = await prisma.foodItem.create({
      data: {
        name,
        category,
        price: parseFloat(price),
        gstPercent: parseFloat(gstPercent),
        enabled: true,
      },
    })

    return NextResponse.json(foodItem, { status: 201 })
  } catch (error) {
    console.error('Error creating food item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
