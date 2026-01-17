import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProduction = nodeEnv === 'production'

  console.log(`Seeding database in ${nodeEnv} mode...`)

  // Check and create manager user
  const existingManager = await prisma.user.findUnique({
    where: { email: 'manager@hotel.com' },
  })

  if (existingManager) {
    console.log('Manager user already exists, skipping creation')
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

  // Check and create admin user
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@hotel.com' },
  })

  if (existingAdmin) {
    console.log('Admin user already exists, skipping creation')
  } else {
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@hotel.com',
        password: adminPassword,
        name: 'System Admin',
        role: 'ADMIN',
      },
    })
    console.log('Created admin user:', admin.email)
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

  // Only seed sample data in development
  if (isProduction) {
    console.log('Production mode: Only admin and manager users seeded')
  } else {
    console.log('Development mode: Seeding sample data...')

    // Create sample rooms
    const rooms = [
      { roomNumber: '101', roomTypeName: 'AC' },
      { roomNumber: '102', roomTypeName: 'AC' },
      { roomNumber: '103', roomTypeName: 'Non-AC' },
      { roomNumber: '201', roomTypeName: 'AC' },
      { roomNumber: '202', roomTypeName: 'Deluxe' },
      { roomNumber: '203', roomTypeName: 'Single Bed' },
    ]

    for (const room of rooms) {
      const existingRoom = await prisma.room.findUnique({
        where: { roomNumber: room.roomNumber },
      })

      if (!existingRoom && roomTypeMap[room.roomTypeName]) {
        await prisma.room.create({
          data: {
            roomNumber: room.roomNumber,
            roomTypeId: roomTypeMap[room.roomTypeName],
            status: 'AVAILABLE',
          },
        })
      }
    }

    console.log('Created sample rooms')

    // Create sample food items
    const foodItems = [
      { name: 'Biryani', category: 'Main Course', price: 250, gstPercent: 5 },
      { name: 'Pizza', category: 'Fast Food', price: 300, gstPercent: 12 },
      { name: 'Coffee', category: 'Beverages', price: 50, gstPercent: 5 },
      { name: 'Tea', category: 'Beverages', price: 30, gstPercent: 5 },
      { name: 'Sandwich', category: 'Fast Food', price: 150, gstPercent: 12 },
    ]

    for (const item of foodItems) {
      const existing = await prisma.foodItem.findFirst({
        where: { name: item.name },
      })

      if (!existing) {
        await prisma.foodItem.create({
          data: {
            name: item.name,
            category: item.category,
            price: item.price,
            gstPercent: item.gstPercent,
            enabled: true,
          },
        })
      }
    }

    console.log('Created sample food items')
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
