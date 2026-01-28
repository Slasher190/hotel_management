
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { headers } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

async function getUser(req: Request) {
  const headersList = await headers()
  const token = headersList.get('authorization')?.split(' ')[1]

  if (!token) return null

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    return decoded
  } catch {
    return null
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: bookingId } = await params

    const invoices = await prisma.invoice.findMany({
      where: {
        bookingId,
        invoiceType: { in: ['KITCHEN_BILL', 'KITCHEN_MASTER'] } // Include both types
      },
      include: {
        foodOrders: {
          include: {
            foodItem: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ invoices })
  } catch (error) {
    console.error('Error fetching kitchen bills:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: bookingId } = await params
    const body = await req.json()
    const { action, discount } = body

    // 1. Check if MASTER bill already exists
    const existingMaster = await prisma.invoice.findFirst({
      where: {
        bookingId,
        invoiceType: 'KITCHEN_MASTER'
      }
    })

    if (existingMaster) {
      return NextResponse.json({ error: 'Master bill already finalized' }, { status: 400 })
    }

    if (action === 'finalize') {
      // Calculate totals from ALL food orders for this booking
      const foodOrders = await prisma.foodOrder.findMany({
        where: { bookingId },
        include: { foodItem: true }
      })

      if (foodOrders.length === 0) {
        return NextResponse.json({ error: 'No food orders found' }, { status: 400 })
      }

      const subtotal = foodOrders.reduce((sum, order) => sum + (order.foodItem.price * order.quantity), 0)
      const finalDiscount = Number(discount) || 0
      const totalAmount = Math.max(0, subtotal - finalDiscount)

      const booking = await prisma.booking.findUnique({ where: { id: bookingId } })

      // Generate Master Invoice with retry logic to handle race conditions
      let masterInvoice
      let attempts = 0
      const maxAttempts = 5

      while (attempts < maxAttempts) {
        try {
          const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
          const count = await prisma.invoice.count({
            where: {
              invoiceNumber: {
                startsWith: `MST-${dateStr}`
              }
            }
          })
          const invoiceNumber = `MST-${dateStr}-${(count + 1).toString().padStart(3, '0')}`

          masterInvoice = await prisma.invoice.create({
            data: {
              bookingId,
              invoiceNumber,
              invoiceType: 'KITCHEN_MASTER',
              guestName: booking?.guestName || 'Guest',
              totalAmount,
              foodCharges: subtotal,
              discount: finalDiscount,
              billDate: new Date(),
            }
          })
          break // Success, exit loop
        } catch (error: any) {
          // Check if it's a unique constraint violation (Prisma error code P2002)
          if (error.code === 'P2002' && attempts < maxAttempts - 1) {
            // Unique constraint violation on invoiceNumber, retry with new count
            attempts++
            // Small delay to reduce contention
            await new Promise(resolve => setTimeout(resolve, 50 * attempts))
            continue
          }
          // Re-throw if not a unique constraint error or max attempts reached
          throw error
        }
      }

      if (!masterInvoice) {
        return NextResponse.json({ error: 'Failed to generate master invoice after multiple attempts' }, { status: 500 })
      }

      return NextResponse.json({ success: true, invoice: masterInvoice })
    }

    // Default: Generate Regular Kitchen Bill (Existing Logic)
    // Only fetch UNINVOICED orders
    const unpaidFoodOrders = await prisma.foodOrder.findMany({
      where: {
        bookingId,
        invoiceId: null
      },
      include: {
        foodItem: true
      }
    })

    if (unpaidFoodOrders.length === 0) {
      if (body.format === 'json') {
        return NextResponse.json({ error: 'No unpaid food orders found' }, { status: 400 })
      }
      return NextResponse.json({ error: 'No unpaid food orders found' }, { status: 400 })
    }

    const foodCharges = unpaidFoodOrders.reduce((sum, order) => {
      return sum + (order.foodItem.price * order.quantity)
    }, 0)

    // Verify invoice number generation again just in case
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `KB-${dateStr}`
        }
      }
    })
    const invoiceNumber = `KB-${dateStr}-${(count + 1).toString().padStart(3, '0')}`

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })

    // Generate invoice with retry logic to handle race conditions
    let invoice
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      try {
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
        const count = await prisma.invoice.count({
          where: {
            invoiceNumber: {
              startsWith: `KB-${dateStr}`
            }
          }
        })
        const invoiceNumber = `KB-${dateStr}-${(count + 1).toString().padStart(3, '0')}`

        invoice = await prisma.invoice.create({
          data: {
            bookingId,
            invoiceNumber,
            invoiceType: 'KITCHEN_BILL',
            guestName: booking?.guestName || 'Guest',
            foodCharges,
            totalAmount: foodCharges,
            billDate: new Date(),
            foodOrders: {
              connect: unpaidFoodOrders.map(o => ({ id: o.id }))
            }
          },
          include: {
            foodOrders: {
              include: { foodItem: true }
            }
          }
        })
        break // Success, exit loop
      } catch (error: any) {
        // Check if it's a unique constraint violation (Prisma error code P2002)
        if (error.code === 'P2002' && attempts < maxAttempts - 1) {
          // Unique constraint violation on invoiceNumber, retry with new count
          attempts++
          // Small delay to reduce contention
          await new Promise(resolve => setTimeout(resolve, 50 * attempts))
          continue
        }
        // Re-throw if not a unique constraint error or max attempts reached
        throw error
      }
    }

    if (!invoice) {
      return NextResponse.json({ error: 'Failed to generate invoice after multiple attempts' }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoice })

  } catch (error) {
    console.error('Error generating kitchen bill:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
// ... existing code ...

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: bookingId } = await params
    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // Verify the invoice belongs to this booking and is a kitchen bill
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        bookingId,
        invoiceType: { in: ['KITCHEN_BILL', 'KITCHEN_MASTER'] }
      },
      include: {
        foodOrders: true
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Disconnect food orders (revert to unpaid)
    if (invoice.foodOrders.length > 0) {
      await prisma.foodOrder.updateMany({
        where: {
          id: { in: invoice.foodOrders.map(o => o.id) }
        },
        data: {
          invoiceId: null
        }
      })
    }

    // Delete the invoice
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting kitchen bill:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
