
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const bookingId = 'cmkwv52es0019nftwbjnzjqlx'

    console.log(`Fetching orders for booking: ${bookingId}`)

    const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
            foodOrders: {
                include: {
                    foodItem: true
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }
        }
    })

    if (!booking) {
        console.log('Booking not found')
        return
    }

    console.log('Found Booking:', booking.guestName)
    console.log('Total Orders:', booking.foodOrders.length)

    console.table(booking.foodOrders.map(o => ({
        id: o.id,
        item: o.foodItem.name,
        qty: o.quantity,
        price: o.foodItem.price,
        created: o.createdAt.toISOString()
    })))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
