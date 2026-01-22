import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManager } from '@/lib/role-auth'

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
    const { enabled } = await request.json()

    const foodItem = await prisma.foodItem.update({
      where: { id },
      data: { enabled },
    })

    return NextResponse.json(foodItem)
  } catch (error) {
    console.error('Error updating food item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = requireManager(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Manager access required' }, { status: 403 })
    }

    const { id } = await params
    const { name, category, price, gstPercent } = await request.json()

    if (!name || !category || price === undefined || gstPercent === undefined) {
      return NextResponse.json(
        { error: 'Name, category, price, and GST percentage are required' },
        { status: 400 }
      )
    }

    const foodItem = await prisma.foodItem.update({
      where: { id },
      data: {
        name,
        category,
        price: parseFloat(price),
        gstPercent: parseFloat(gstPercent),
      },
    })

    return NextResponse.json(foodItem)
  } catch (error) {
    console.error('Error updating food item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    // Check if food item is used in any orders
    const ordersCount = await prisma.foodOrder.count({
      where: { foodItemId: id },
    })

    if (ordersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete food item that has been used in orders' },
        { status: 400 }
      )
    }

    await prisma.foodItem.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Food item deleted successfully' })
  } catch (error) {
    console.error('Error deleting food item:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
