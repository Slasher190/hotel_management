import { PrismaClient, RoomStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProduction = nodeEnv === 'production'

  console.log(`Seeding database in ${nodeEnv} mode...`)

  // Check and create/update manager user
  const existingManager = await prisma.user.findUnique({
    where: { email: 'manager@hotel.com' },
  })

  if (existingManager) {
    // Update existing manager to ensure correct role and password
    const hashedPassword = await bcrypt.hash('manager123', 10)
    await prisma.user.update({
      where: { email: 'manager@hotel.com' },
      data: {
        password: hashedPassword,
        name: 'Hotel Manager',
        role: 'MANAGER',
      },
    })
    console.log('Updated manager user:', existingManager.email)
  } else {
    const hashedPassword = await bcrypt.hash('manager123', 10)
    const manager = await prisma.user.create({
      data: {
        email: 'manager@hotel.com',
        password: hashedPassword,
        name: 'Hotel Manager',
        role: 'MANAGER',
      },
    })
    console.log('Created manager user:', manager.email)
  }

  // Check and create/update staff user
  const existingStaff = await prisma.user.findUnique({
    where: { email: 'staff@hotel.com' },
  })

  if (existingStaff) {
    // Update existing staff to ensure correct role and password
    const staffPassword = await bcrypt.hash('staff123', 10)
    await prisma.user.update({
      where: { email: 'staff@hotel.com' },
      data: {
        password: staffPassword,
        name: 'Hotel Staff',
        role: 'STAFF',
      },
    })
    console.log('Updated staff user:', existingStaff.email)
  } else {
    const staffPassword = await bcrypt.hash('staff123', 10)
    const staff = await prisma.user.create({
      data: {
        email: 'staff@hotel.com',
        password: staffPassword,
        name: 'Hotel Staff',
        role: 'STAFF',
      },
    })
    console.log('Created staff user:', staff.email)
  }

  // Update all existing users to ensure they have valid roles
  // Fix any users with invalid roles (convert to MANAGER)
  try {
    await prisma.$executeRaw`
      UPDATE "users" 
      SET "role" = 'MANAGER' 
      WHERE "role"::text NOT IN ('MANAGER', 'STAFF') OR "role" IS NULL
    `
    console.log('Updated all users to have valid roles')
  } catch (error) {
    console.log('Note: Role update skipped (may not be needed)')
  }

  // Create default room types (always create if not exists)
  const defaultRoomTypes = ['AC', 'Non-AC', 'Deluxe', 'Single Bed', 'Double Bed']
  const roomTypeMap: Record<string, string> = {}

  for (const roomTypeName of defaultRoomTypes) {
    const existing = await prisma.roomType.findUnique({
      where: { name: roomTypeName },
    })

    if (!existing) {
      const roomType = await prisma.roomType.create({
        data: { name: roomTypeName },
      })
      roomTypeMap[roomTypeName] = roomType.id
      console.log(`Created room type: ${roomTypeName}`)
    } else {
      roomTypeMap[roomTypeName] = existing.id
    }
  }

  // Create hotel settings (always create if not exists)
  const existingSettings = await prisma.hotelSettings.findFirst()
  if (!existingSettings) {
    await prisma.hotelSettings.create({
      data: {
        name: 'HOTEL SAMRAT INN',
        address: 'OLD BUS STAND, HAZARIBAGH HAZARIBAGH',
        phone: '7050240391, 9471302111',
        email: 'hotelsamratinn@gmail.com',
        gstin: '20AAIFH0390N3ZD',
      },
    })
    console.log('Created hotel settings')
  }

  // Only seed sample data in development
  if (isProduction) {
    console.log('Production mode: Only users and settings seeded')
  } else {
    console.log('Development mode: Seeding sample data...')

    // Create sample rooms
    const rooms = [
      { roomNumber: '101', roomTypeName: 'AC', status: RoomStatus.OCCUPIED },
      { roomNumber: '102', roomTypeName: 'AC', status: RoomStatus.AVAILABLE },
      { roomNumber: '103', roomTypeName: 'Non-AC', status: RoomStatus.OCCUPIED },
      { roomNumber: '104', roomTypeName: 'Non-AC', status: RoomStatus.AVAILABLE },
      { roomNumber: '201', roomTypeName: 'AC', status: RoomStatus.AVAILABLE },
      { roomNumber: '202', roomTypeName: 'Deluxe', status: RoomStatus.OCCUPIED },
      { roomNumber: '203', roomTypeName: 'Single Bed', status: RoomStatus.AVAILABLE },
      { roomNumber: '204', roomTypeName: 'Double Bed', status: RoomStatus.AVAILABLE },
      { roomNumber: '301', roomTypeName: 'Deluxe', status: RoomStatus.AVAILABLE },
      { roomNumber: '302', roomTypeName: 'AC', status: RoomStatus.AVAILABLE },
    ]

    const roomMap: Record<string, string> = {}
    for (const room of rooms) {
      const existingRoom = await prisma.room.findUnique({
        where: { roomNumber: room.roomNumber },
      })

      if (!existingRoom && roomTypeMap[room.roomTypeName]) {
        const createdRoom = await prisma.room.create({
          data: {
            roomNumber: room.roomNumber,
            roomTypeId: roomTypeMap[room.roomTypeName],
            status: room.status,
          },
        })
        roomMap[room.roomNumber] = createdRoom.id
      } else if (existingRoom) {
        roomMap[room.roomNumber] = existingRoom.id
        // Update status if needed
        if (existingRoom.status !== room.status) {
          await prisma.room.update({
            where: { id: existingRoom.id },
            data: { status: room.status },
          })
        }
      }
    }

    console.log('Created/updated sample rooms')

    // Create sample food items
    const foodItems = [
      { name: 'Biryani', category: 'Main Course', price: 250, gstPercent: 5 },
      { name: 'Pizza', category: 'Fast Food', price: 300, gstPercent: 12 },
      { name: 'Coffee', category: 'Beverages', price: 50, gstPercent: 5 },
      { name: 'Tea', category: 'Beverages', price: 30, gstPercent: 5 },
      { name: 'Sandwich', category: 'Fast Food', price: 150, gstPercent: 12 },
      { name: 'Pasta', category: 'Main Course', price: 200, gstPercent: 5 },
      { name: 'Burger', category: 'Fast Food', price: 180, gstPercent: 12 },
      { name: 'Noodles', category: 'Main Course', price: 120, gstPercent: 5 },
      { name: 'Soup', category: 'Appetizer', price: 80, gstPercent: 5 },
      { name: 'Salad', category: 'Appetizer', price: 100, gstPercent: 5 },
      { name: 'Juice', category: 'Beverages', price: 60, gstPercent: 5 },
      { name: 'Ice Cream', category: 'Dessert', price: 90, gstPercent: 12 },
    ]

    const foodItemMap: Record<string, string> = {}
    for (const item of foodItems) {
      const existing = await prisma.foodItem.findFirst({
        where: { name: item.name },
      })

      if (!existing) {
        const created = await prisma.foodItem.create({
          data: {
            name: item.name,
            category: item.category,
            price: item.price,
            gstPercent: item.gstPercent,
            enabled: true,
          },
        })
        foodItemMap[item.name] = created.id
      } else {
        foodItemMap[item.name] = existing.id
      }
    }

    console.log('Created/updated sample food items')

    // Create sample bookings
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(now)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const bookings = [
      {
        roomNumber: '101',
        guestName: 'Rajesh Kumar',
        idType: 'AADHAAR' as const,
        idNumber: '123456789012',
        roomPrice: 1500,
        additionalGuests: 1,
        additionalGuestCharges: 500,
        mattresses: 0,
        status: 'ACTIVE' as const,
        checkInDate: twoDaysAgo,
        checkoutDate: null,
      },
      {
        roomNumber: '103',
        guestName: 'Priya Sharma',
        idType: 'DL' as const,
        idNumber: 'DL1234567890',
        roomPrice: 1200,
        additionalGuests: 0,
        additionalGuestCharges: 0,
        mattresses: 1,
        status: 'ACTIVE' as const,
        checkInDate: yesterday,
        checkoutDate: null,
      },
      {
        roomNumber: '202',
        guestName: 'Amit Singh',
        idType: 'PASSPORT' as const,
        idNumber: 'P12345678',
        roomPrice: 2500,
        additionalGuests: 2,
        additionalGuestCharges: 600,
        mattresses: 0,
        status: 'CHECKED_OUT' as const,
        checkInDate: twoDaysAgo,
        checkoutDate: yesterday,
      },
    ]

    const bookingMap: Record<string, string> = {}
    for (const booking of bookings) {
      const roomId = roomMap[booking.roomNumber]
      if (!roomId) continue

      const existingBooking = await prisma.booking.findFirst({
        where: {
          roomId,
          guestName: booking.guestName,
          checkInDate: booking.checkInDate,
        },
      })

      if (!existingBooking) {
        const createdBooking = await prisma.booking.create({
          data: {
            roomId,
            guestName: booking.guestName,
            idType: booking.idType,
            idNumber: booking.idNumber,
            roomPrice: booking.roomPrice,
            additionalGuests: booking.additionalGuests,
            additionalGuestCharges: booking.additionalGuestCharges,
            mattresses: booking.mattresses,
            status: booking.status,
            checkInDate: booking.checkInDate,
            checkoutDate: booking.checkoutDate,
          },
        })
        bookingMap[booking.guestName] = createdBooking.id

        // Create food orders for active bookings
        if (booking.status === 'ACTIVE' && foodItemMap['Coffee']) {
          await prisma.foodOrder.createMany({
            data: [
              {
                bookingId: createdBooking.id,
                foodItemId: foodItemMap['Coffee'],
                quantity: 2,
              },
              {
                bookingId: createdBooking.id,
                foodItemId: foodItemMap['Tea'],
                quantity: 1,
              },
            ],
          })
        }

        // Create invoice for checked out booking
        if (booking.status === 'CHECKED_OUT') {
          const days = Math.ceil(
            (booking.checkoutDate!.getTime() - booking.checkInDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          const roomCharges = booking.roomPrice * days
          const additionalCharges = booking.additionalGuestCharges * booking.additionalGuests
          const subtotal = roomCharges + additionalCharges
          const gstAmount = subtotal * 0.05
          const totalAmount = subtotal + gstAmount

          await prisma.invoice.create({
            data: {
              bookingId: createdBooking.id,
              invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
              invoiceType: 'ROOM',
              isManual: false,
              guestName: booking.guestName,
              roomType: 'Deluxe',
              roomCharges,
              additionalGuestCharges: additionalCharges,
              gstEnabled: true,
              gstAmount,
              totalAmount,
            },
          })

          // Create payment
          await prisma.payment.create({
            data: {
              bookingId: createdBooking.id,
              mode: 'CASH',
              status: 'PAID',
              amount: totalAmount,
            },
          })
        }
      }
    }

    console.log('Created sample bookings with food orders and invoices')
  }

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
