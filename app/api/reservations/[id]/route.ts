import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireStaffOrManager } from '@/lib/role-auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireStaffOrManager(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        const reservation = await prisma.reservation.findUnique({
            where: { id },
            include: {
                room: {
                    include: {
                        roomType: true,
                    },
                },
                booking: true,
            },
        })

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
        }

        return NextResponse.json(reservation)
    } catch (error) {
        console.error('Error fetching reservation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireStaffOrManager(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params
        const data = await request.json()

        // Check if reservation exists
        const existing = await prisma.reservation.findUnique({
            where: { id },
        })

        if (!existing) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
        }

        // Don't allow editing completed or cancelled reservations
        if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
            return NextResponse.json(
                { error: 'Cannot modify completed or cancelled reservations' },
                { status: 400 }
            )
        }

        // Update reservation
        const reservation = await prisma.reservation.update({
            where: { id },
            data: {
                guestName: data.guestName,
                guestEmail: data.guestEmail,
                guestMobile: data.guestMobile,
                guestAddress: data.guestAddress,
                checkInDate: data.checkInDate ? new Date(data.checkInDate) : undefined,
                checkOutDate: data.checkOutDate ? new Date(data.checkOutDate) : undefined,
                expectedArrival: data.expectedArrival,
                adults: data.adults ? parseInt(data.adults) : undefined,
                children: data.children ? parseInt(data.children) : undefined,
                roomRate: data.roomRate ? parseFloat(data.roomRate) : undefined,
                advanceAmount: data.advanceAmount ? parseFloat(data.advanceAmount) : undefined,
                specialRequests: data.specialRequests,
                status: data.status,
            },
            include: {
                room: {
                    include: {
                        roomType: true,
                    },
                },
            },
        })

        return NextResponse.json(reservation)
    } catch (error) {
        console.error('Error updating reservation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = requireStaffOrManager(request)
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        const reservation = await prisma.reservation.findUnique({
            where: { id },
        })

        if (!reservation) {
            return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
        }

        // Update status to cancelled instead of deleting
        await prisma.reservation.update({
            where: { id },
            data: { status: 'CANCELLED' },
        })

        return NextResponse.json({ message: 'Reservation cancelled successfully' })
    } catch (error) {
        console.error('Error cancelling reservation:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
