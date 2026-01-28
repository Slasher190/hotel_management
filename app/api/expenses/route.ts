import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

// Get expenses
export async function GET(request: NextRequest) {
    try {
        const user = getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = Number(searchParams.get('page')) || 1
        const limit = Number(searchParams.get('limit')) || 10
        const skip = (page - 1) * limit

        const [expenses, total] = await Promise.all([
            prisma.expense.findMany({
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip,
                take: limit,
            }),
            prisma.expense.count(),
        ])

        return NextResponse.json({
            expenses,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        })
    } catch (error) {
        console.error('Error fetching expenses:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Create expense
export async function POST(request: NextRequest) {
    try {
        const user = getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { staffId, recipient, description, amount, date } = await request.json()

        if (!staffId || !recipient || !description || !amount) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            )
        }

        const expense = await prisma.expense.create({
            data: {
                staffId,
                recipient,
                description,
                amount: Number(amount),
                date: date ? new Date(date) : new Date(),
            },
            include: {
                user: {
                    select: { name: true },
                },
            },
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error('Error creating expense:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
