import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'
import bcrypt from 'bcryptjs'

// Reset password with old password
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { oldPassword, newPassword } = await request.json()

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Old password and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email },
    })

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid old password' }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true, message: 'Password updated successfully' })
  } catch (error) {
    console.error('Error resetting password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Reset password with secret (for forgotten password)
export async function PUT(request: NextRequest) {
  try {
    const { email, secret, newPassword } = await request.json()

    if (!email || !secret || !newPassword) {
      return NextResponse.json(
        { error: 'Email, secret, and new password are required' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Get system settings for secret
    let systemSettings = await prisma.systemSettings.findFirst()
    if (!systemSettings) {
      // Create default if doesn't exist
      systemSettings = await prisma.systemSettings.create({
        data: {
          passwordResetSecret: 'HOTEL_RESET_2024',
        },
      })
    }

    // Verify secret
    if (secret !== systemSettings.passwordResetSecret) {
      return NextResponse.json({ error: 'Invalid secret password' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    return NextResponse.json({ success: true, message: 'Password reset successfully' })
  } catch (error) {
    console.error('Error resetting password with secret:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
