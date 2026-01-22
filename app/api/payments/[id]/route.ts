import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireManager } from '@/lib/role-auth'
import { Prisma } from '@prisma/client'

// Update payment
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
    const { status, amount } = await request.json()

    const updateData: Prisma.PaymentUpdateInput = {}
    if (status) {
      updateData.status = status
    }
    if (amount !== undefined) {
      updateData.amount = Number.parseFloat(amount)
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
