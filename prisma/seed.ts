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

  // Only seed sample data in development
  if (isProduction) {
    console.log('Production mode: Only admin and manager users seeded')
  } else {
    console.log('Development mode: Seeding sample data...')

    // Create sample rooms
    const rooms = [
      { roomNumber: '101', roomType: 'AC' as const },
      { roomNumber: '102', roomType: 'AC' as const },
      { roomNumber: '103', roomType: 'NON_AC' as const },
      { roomNumber: '201', roomType: 'AC' as const },
      { roomNumber: '202', roomType: 'AC' as const },
      { roomNumber: '203', roomType: 'NON_AC' as const },
    ]

    for (const room of rooms) {
      const existingRoom = await prisma.room.findUnique({
        where: { roomNumber: room.roomNumber },
      })

      if (!existingRoom) {
        await prisma.room.create({
          data: {
            roomNumber: room.roomNumber,
            roomType: room.roomType,
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
