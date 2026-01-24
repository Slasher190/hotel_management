import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/middleware-auth'

// Get visitor registration count for auto-generating registration number
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Count total invoices to generate next visitor registration number
    const count = await prisma.invoice.count()

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching visitor registration count:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}