import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, email, password, role } = body

        // Optional: check if user exists first
        const existingUser = await prisma.user.findUnique({
            where: { id },
        })

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const updateData: any = {
            name,
            email,
            role, // Handle careful role updates?
        }

        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }

        // Attempt update
        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                updatedAt: true,
            },
        })

        return NextResponse.json(updatedUser)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.user.delete({
            where: { id },
        })

        return NextResponse.json({ message: 'User deleted successfully' })
    } catch (error) {
        console.error('Error deleting user:', error)
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
    }
}
