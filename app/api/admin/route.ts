// Hidden admin API routes - not visible in UI
// Accessible only via direct API calls with admin token

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

// Middleware to check admin access
function requireAdmin(user: ReturnType<typeof getAuthUser>) {
  if (user?.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }
}

// Get all data (for audits)
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    requireAdmin(user)

    const [users, rooms, bookings, foodItems, invoices, payments] = await Promise.all([
      prisma.user.findMany(),
      prisma.room.findMany(),
      prisma.booking.findMany({ include: { room: true } }),
      prisma.foodItem.findMany(),
      prisma.invoice.findMany(),
      prisma.payment.findMany(),
    ])

    return NextResponse.json({
      users,
      rooms,
      bookings,
      foodItems,
      invoices,
      payments,
    })
  } catch (error: unknown) {
    const err = error as { message?: string }
    if (err.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Create/update/delete operations (for maintenance)
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    requireAdmin(user)

    const { action, data } = await request.json()

    switch (action) {
      case 'create_user':
        return NextResponse.json(
          await prisma.user.create({ data }),
          { status: 201 }
        )
      case 'update_user':
        return NextResponse.json(
          await prisma.user.update({
            where: { id: data.id },
            data: data.update,
          })
        )
      case 'delete_user':
        return NextResponse.json(
          await prisma.user.delete({ where: { id: data.id } })
        )
      case 'create_room':
        return NextResponse.json(
          await prisma.room.create({ data }),
          { status: 201 }
        )
      case 'update_room':
        return NextResponse.json(
          await prisma.room.update({
            where: { id: data.id },
            data: data.update,
          })
        )
      case 'delete_room':
        return NextResponse.json(
          await prisma.room.delete({ where: { id: data.id } })
        )
      case 'update_booking':
        return NextResponse.json(
          await prisma.booking.update({
            where: { id: data.id },
            data: data.update,
          })
        )
      case 'update_invoice':
        return NextResponse.json(
          await prisma.invoice.update({
            where: { id: data.id },
            data: data.update,
          })
        )
      case 'update_payment':
        return NextResponse.json(
          await prisma.payment.update({
            where: { id: data.id },
            data: data.update,
          })
        )
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: unknown) {
    const err = error as { message?: string }
    if (err.message === 'Admin access required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    console.error('Admin API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
