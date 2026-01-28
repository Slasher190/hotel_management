import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

export async function GET(request: NextRequest) {
    try {
        const user = getAuthUser(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch users with STAFF or MANAGER role
        const staff = await prisma.user.findMany({
            where: {
                role: {
                    in: ['STAFF', 'MANAGER', 'CHEF'],
                },
            },
            select: {
                id: true,
                name: true,
                role: true,
            },
            orderBy: {
                name: 'asc',
            },
        })

        return NextResponse.json(staff)
    } catch (error) {
        console.error('Error fetching staff:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
