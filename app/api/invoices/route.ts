import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import { Prisma } from '@prisma/client'

// Get all invoices with pagination
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get('page') || '1')
    const limit = Number.parseInt(searchParams.get('limit') || '10')
    const invoiceType = searchParams.get('type') // 'MANUAL', 'ROOM', 'FOOD', or null for all
    const isManual = searchParams.get('isManual') // 'true' or 'false'
    const search = searchParams.get('search') // Search by guest name or invoice number
    const dateFrom = searchParams.get('dateFrom') // Date range filter
    const dateTo = searchParams.get('dateTo')
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    const sortBy = searchParams.get('sortBy') || 'createdAt' // Sort field
    const sortOrder = searchParams.get('sortOrder') || 'desc' // Sort order

    const skip = (page - 1) * limit

    const where: Prisma.InvoiceWhereInput = {}
    if (invoiceType) {
      where.invoiceType = invoiceType
    }
    if (isManual !== null) {
      where.isManual = isManual === 'true'
    }
    if (search) {
      where.OR = [
        { guestName: { contains: search, mode: Prisma.QueryMode.insensitive } },
        { invoiceNumber: { contains: search, mode: Prisma.QueryMode.insensitive } },
      ]
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
      where.totalAmount = {}
      if (minAmount) {
        where.totalAmount.gte = Number.parseFloat(minAmount)
      }
      if (maxAmount) {
        where.totalAmount.lte = Number.parseFloat(maxAmount)
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          booking: {
            include: {
              room: {
                include: {
                  roomType: true,
                },
              },
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ])

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
