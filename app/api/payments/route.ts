import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma, PaymentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const status = request.nextUrl.searchParams.get('status')
    const page = Number.parseInt(request.nextUrl.searchParams.get('page') || '1')
    const limit = Number.parseInt(request.nextUrl.searchParams.get('limit') || '10')
    const search = request.nextUrl.searchParams.get('search')
    const dateFrom = request.nextUrl.searchParams.get('dateFrom')
    const dateTo = request.nextUrl.searchParams.get('dateTo')
    const mode = request.nextUrl.searchParams.get('mode')
    const minAmount = request.nextUrl.searchParams.get('minAmount')
    const maxAmount = request.nextUrl.searchParams.get('maxAmount')
    const sortBy = request.nextUrl.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = request.nextUrl.searchParams.get('sortOrder') || 'desc'

    const where: Prisma.PaymentWhereInput = {}
    if (status) {
      where.status = status as PaymentStatus
    }
    if (mode) {
      where.mode = mode as 'CASH' | 'ONLINE'
    }
    if (search) {
      where.booking = {
        guestName: { contains: search, mode: Prisma.QueryMode.insensitive },
      }
    }
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }
    if (minAmount || maxAmount) {
      where.amount = {}
      if (minAmount) {
        where.amount.gte = Number.parseFloat(minAmount)
      }
      if (maxAmount) {
        where.amount.lte = Number.parseFloat(maxAmount)
      }
    }

    const skip = (page - 1) * limit
    const total = await prisma.payment.count({ where })

    const payments = await prisma.payment.findMany({
      where,
      include: {
        booking: {
          include: {
            room: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limit,
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
