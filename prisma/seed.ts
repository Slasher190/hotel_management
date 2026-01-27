import { PrismaClient, RoomStatus, RoomCategory } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const nodeEnv = process.env.NODE_ENV || 'development'
  const isProduction = nodeEnv === 'production'

  console.log(`Seeding database in ${nodeEnv} mode...`)

  // ============================================
  // USER MANAGEMENT
  // ============================================

  // Check and create/update manager user
  const existingManager = await prisma.user.findUnique({
    where: { email: 'manager@hotel.com' },
  })

  if (existingManager) {
    const hashedPassword = await bcrypt.hash('manager123', 10)
    await prisma.user.update({
      where: { email: 'manager@hotel.com' },
      data: {
        password: hashedPassword,
        name: 'Hotel Manager',
        role: 'MANAGER',
      },
    })
    console.log('✓ Updated manager user:', existingManager.email)
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
    console.log('✓ Created manager user:', manager.email)
  }

  // Check and create/update staff user
  const existingStaff = await prisma.user.findUnique({
    where: { email: 'staff@hotel.com' },
  })

  if (existingStaff) {
    const staffPassword = await bcrypt.hash('staff123', 10)
    await prisma.user.update({
      where: { email: 'staff@hotel.com' },
      data: {
        password: staffPassword,
        name: 'Hotel Staff',
        role: 'STAFF',
      },
    })
    console.log('✓ Updated staff user:', existingStaff.email)
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
    console.log('✓ Created staff user:', staff.email)
  }

  // Check and create/update chef user (NEW)
  const existingChef = await prisma.user.findUnique({
    where: { email: 'chef@hotel.com' },
  })

  if (existingChef) {
    const chefPassword = await bcrypt.hash('chef123', 10)
    await prisma.user.update({
      where: { email: 'chef@hotel.com' },
      data: {
        password: chefPassword,
        name: 'Head Chef',
        role: 'CHEF',
      },
    })
    console.log('✓ Updated chef user:', existingChef.email)
  } else {
    const chefPassword = await bcrypt.hash('chef123', 10)
    const chef = await prisma.user.create({
      data: {
        email: 'chef@hotel.com',
        password: chefPassword,
        name: 'Head Chef',
        role: 'CHEF',
      },
    })
    console.log('✓ Created chef user:', chef.email)
  }

  // ============================================
  // SYSTEM SETTINGS
  // ============================================

  // Create system settings if not exists
  const existingSystemSettings = await prisma.systemSettings.findFirst()
  if (!existingSystemSettings) {
    await prisma.systemSettings.create({
      data: {
        passwordResetSecret: 'HOTEL_RESET_2024',
      },
    })
    console.log('✓ Created system settings')
  }

  // ============================================
  // ROOM TYPES
  // ============================================

  // Create room types with categories
  const roomTypesData = [
    { name: 'AC', category: RoomCategory.ROOM, price: 1500 },
    { name: 'Non-AC', category: RoomCategory.ROOM, price: 1000 },
    { name: 'Deluxe', category: RoomCategory.ROOM, price: 2500 },
    { name: 'Single Bed', category: RoomCategory.ROOM, price: 800 },
    { name: 'Double Bed', category: RoomCategory.ROOM, price: 1200 },
    { name: 'Conference Hall', category: RoomCategory.HALL, price: 5000 },
    { name: 'Banquet Hall', category: RoomCategory.HALL, price: 8000 },
  ]

  const roomTypeMap: Record<string, string> = {}

  for (const roomTypeData of roomTypesData) {
    const existing = await prisma.roomType.findUnique({
      where: { name: roomTypeData.name },
    })

    if (!existing) {
      const roomType = await prisma.roomType.create({
        data: {
          name: roomTypeData.name,
          category: roomTypeData.category,
          price: roomTypeData.price,
        },
      })
      roomTypeMap[roomTypeData.name] = roomType.id
      console.log(`✓ Created room type: ${roomTypeData.name} (${roomTypeData.category})`)
    } else {
      // Update existing room type with category and price
      await prisma.roomType.update({
        where: { id: existing.id },
        data: {
          category: roomTypeData.category,
          price: roomTypeData.price,
        },
      })
      roomTypeMap[roomTypeData.name] = existing.id
      console.log(`✓ Updated room type: ${roomTypeData.name}`)
    }
  }

  // ============================================
  // HOTEL SETTINGS
  // ============================================

  const existingHotelSettings = await prisma.hotelSettings.findFirst()
  if (!existingHotelSettings) {
    await prisma.hotelSettings.create({
      data: {
        name: 'HOTEL SAMRAT INN',
        address: 'OLD BUS STAND, HAZARIBAGH HAZARIBAGH',
        phone: '7050240391, 9471302111',
        email: 'hotelsamratinn@gmail.com',
        gstin: '20AAIFH0390N3ZD',
      },
    })
    console.log('✓ Created hotel settings')
  }

  // ============================================
  // SAMPLE DATA (Development Only)
  // ============================================

  if (isProduction) {
    console.log('Production mode: Only users and settings seeded')
  } else {
    console.log('Development mode: Seeding sample data...')

    // Create sample rooms
    const rooms = [
      // Standard AC Rooms
      { roomNumber: '101', roomTypeName: 'AC', status: RoomStatus.OCCUPIED },
      { roomNumber: '102', roomTypeName: 'AC', status: RoomStatus.AVAILABLE },
      { roomNumber: '103', roomTypeName: 'AC', status: RoomStatus.AVAILABLE },
      { roomNumber: '104', roomTypeName: 'AC', status: RoomStatus.AVAILABLE },
      { roomNumber: '105', roomTypeName: 'AC', status: RoomStatus.AVAILABLE },

      // Non-AC Rooms
      { roomNumber: '201', roomTypeName: 'Non-AC', status: RoomStatus.OCCUPIED },
      { roomNumber: '202', roomTypeName: 'Non-AC', status: RoomStatus.AVAILABLE },
      { roomNumber: '203', roomTypeName: 'Non-AC', status: RoomStatus.AVAILABLE },

      // Deluxe Rooms
      { roomNumber: '301', roomTypeName: 'Deluxe', status: RoomStatus.OCCUPIED },
      { roomNumber: '302', roomTypeName: 'Deluxe', status: RoomStatus.AVAILABLE },
      { roomNumber: '303', roomTypeName: 'Deluxe', status: RoomStatus.AVAILABLE },

      // Single/Double Bed Rooms
      { roomNumber: '401', roomTypeName: 'Single Bed', status: RoomStatus.AVAILABLE },
      { roomNumber: '402', roomTypeName: 'Double Bed', status: RoomStatus.AVAILABLE },

      // Halls
      { roomNumber: 'H1', roomTypeName: 'Conference Hall', status: RoomStatus.AVAILABLE },
      { roomNumber: 'H2', roomTypeName: 'Banquet Hall', status: RoomStatus.AVAILABLE },
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

    console.log('✓ Created/updated sample rooms')

    // Create realistic food items organized by categories
    const foodItems = [
      // Beverages
      { name: 'Tea', category: 'Beverages', price: 30, gstPercent: 5 },
      { name: 'Coffee', category: 'Beverages', price: 50, gstPercent: 5 },
      { name: 'Juice (Orange)', category: 'Beverages', price: 60, gstPercent: 5 },
      { name: 'Juice (Apple)', category: 'Beverages', price: 60, gstPercent: 5 },
      { name: 'Soft Drink', category: 'Beverages', price: 40, gstPercent: 12 },
      { name: 'Lassi', category: 'Beverages', price: 50, gstPercent: 5 },

      // Main Course
      { name: 'Biryani (Veg)', category: 'Main Course', price: 200, gstPercent: 5 },
      { name: 'Biryani (Chicken)', category: 'Main Course', price: 250, gstPercent: 5 },
      { name: 'Dal Makhani', category: 'Main Course', price: 150, gstPercent: 5 },
      { name: 'Paneer Butter Masala', category: 'Main Course', price: 180, gstPercent: 5 },
      { name: 'Chicken Curry', category: 'Main Course', price: 220, gstPercent: 5 },
      { name: 'Noodles', category: 'Main Course', price: 120, gstPercent: 5 },
      { name: 'Fried Rice', category: 'Main Course', price: 130, gstPercent: 5 },

      // Breakfast
      { name: 'Paratha (Plain)', category: 'Breakfast', price: 40, gstPercent: 5 },
      { name: 'Paratha (Aloo)', category: 'Breakfast', price: 50, gstPercent: 5 },
      { name: 'Idli (2 pcs)', category: 'Breakfast', price: 60, gstPercent: 5 },
      { name: 'Dosa (Plain)', category: 'Breakfast', price: 70, gstPercent: 5 },
      { name: 'Dosa (Masala)', category: 'Breakfast', price: 90, gstPercent: 5 },
      { name: 'Poha', category: 'Breakfast', price: 50, gstPercent: 5 },
      { name: 'Upma', category: 'Breakfast', price: 50, gstPercent: 5 },

      // Snacks
      { name: 'Samosa (2 pcs)', category: 'Snacks', price: 40, gstPercent: 12 },
      { name: 'Pakora', category: 'Snacks', price: 60, gstPercent: 12 },
      { name: 'Sandwich (Veg)', category: 'Snacks', price: 80, gstPercent: 12 },
      { name: 'Sandwich (Cheese)', category: 'Snacks', price: 100, gstPercent: 12 },
      { name: 'French Fries', category: 'Snacks', price: 80, gstPercent: 12 },
      { name: 'Spring Roll', category: 'Snacks', price: 90, gstPercent: 12 },

      // Fast Food
      { name: 'Burger (Veg)', category: 'Fast Food', price: 120, gstPercent: 12 },
      { name: 'Burger (Chicken)', category: 'Fast Food', price: 150, gstPercent: 12 },
      { name: 'Pizza (Veg)', category: 'Fast Food', price: 250, gstPercent: 12 },
      { name: 'Pizza (Chicken)', category: 'Fast Food', price: 300, gstPercent: 12 },
      { name: 'Pasta (White Sauce)', category: 'Fast Food', price: 180, gstPercent: 12 },
      { name: 'Pasta (Red Sauce)', category: 'Fast Food', price: 180, gstPercent: 12 },

      // Desserts
      { name: 'Ice Cream', category: 'Dessert', price: 90, gstPercent: 12 },
      { name: 'Gulab Jamun (2 pcs)', category: 'Dessert', price: 60, gstPercent: 5 },
      { name: 'Rasgulla (2 pcs)', category: 'Dessert', price: 60, gstPercent: 5 },

      // Appetizers
      { name: 'Soup (Veg)', category: 'Appetizer', price: 80, gstPercent: 5 },
      { name: 'Soup (Chicken)', category: 'Appetizer', price: 100, gstPercent: 5 },
      { name: 'Salad', category: 'Appetizer', price: 70, gstPercent: 5 },
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
        // Update existing food items
        await prisma.foodItem.update({
          where: { id: existing.id },
          data: {
            category: item.category,
            price: item.price,
            gstPercent: item.gstPercent,
          },
        })
        foodItemMap[item.name] = existing.id
      }
    }

    console.log('✓ Created/updated sample food items')

    // Create sample bookings with realistic scenarios
    const now = new Date()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(now)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)
    const threeDaysAgo = new Date(now)
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const bookings = [
      // Active booking with food orders
      {
        roomNumber: '101',
        guestName: 'Rajesh Kumar',
        guestAddress: 'Mumbai, Maharashtra',
        guestMobile: '9876543210',
        idType: 'AADHAAR' as const,
        idNumber: '123456789012',
        roomPrice: 1500,
        adults: 2,
        children: 0,
        additionalGuests: 1,
        additionalGuestCharges: 500,
        mattresses: 0,
        discount: 0,
        status: 'ACTIVE' as const,
        checkInDate: twoDaysAgo,
        checkoutDate: null,
        hasFoodOrders: true,
      },
      // Active booking without food orders
      {
        roomNumber: '201',
        guestName: 'Priya Sharma',
        guestAddress: 'Delhi, Delhi',
        guestMobile: '9123456789',
        idType: 'DL' as const,
        idNumber: 'DL1234567890',
        roomPrice: 1000,
        adults: 1,
        children: 1,
        additionalGuests: 0,
        additionalGuestCharges: 0,
        mattresses: 1,
        discount: 100,
        status: 'ACTIVE' as const,
        checkInDate: yesterday,
        checkoutDate: null,
        hasFoodOrders: false,
      },
      // Active corporate booking
      {
        roomNumber: '301',
        guestName: 'Amit Singh',
        guestAddress: 'Bangalore, Karnataka',
        guestMobile: '9988776655',
        guestGstNumber: '29ABCDE1234F1Z5',
        companyName: 'Tech Solutions Pvt Ltd',
        department: 'Sales',
        designation: 'Manager',
        idType: 'PASSPORT' as const,
        idNumber: 'P12345678',
        roomPrice: 2500,
        adults: 1,
        children: 0,
        additionalGuests: 0,
        additionalGuestCharges: 0,
        mattresses: 0,
        discount: 200,
        status: 'ACTIVE' as const,
        checkInDate: yesterday,
        checkoutDate: null,
        hasFoodOrders: true,
      },
      // Checked out booking with payment PAID
      {
        roomNumber: '302',
        guestName: 'Sunita Verma',
        guestAddress: 'Kolkata, West Bengal',
        guestMobile: '9876512345',
        idType: 'VOTER_ID' as const,
        idNumber: 'VOT123456',
        roomPrice: 2500,
        adults: 2,
        children: 1,
        additionalGuests: 1,
        additionalGuestCharges: 600,
        mattresses: 0,
        discount: 0,
        status: 'CHECKED_OUT' as const,
        checkInDate: threeDaysAgo,
        checkoutDate: yesterday,
        hasFoodOrders: true,
        paymentStatus: 'PAID' as const,
        paymentMode: 'CASH' as const,
      },
      // Checked out booking with payment PENDING
      {
        roomNumber: '303',
        guestName: 'Vikram Malhotra',
        guestAddress: 'Pune, Maharashtra',
        guestMobile: '9123498765',
        guestGstNumber: '27XYZAB5678G1H2',
        companyName: 'Global Enterprises',
        idType: 'AADHAAR' as const,
        idNumber: '987654321098',
        roomPrice: 2500,
        adults: 1,
        children: 0,
        additionalGuests: 0,
        additionalGuestCharges: 0,
        mattresses: 0,
        discount: 500,
        status: 'CHECKED_OUT' as const,
        checkInDate: threeDaysAgo,
        checkoutDate: yesterday,
        hasFoodOrders: false,
        paymentStatus: 'PENDING' as const,
        paymentMode: 'ONLINE' as const,
      },
    ]

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
            guestAddress: booking.guestAddress,
            guestMobile: booking.guestMobile,
            guestGstNumber: booking.guestGstNumber,
            companyName: booking.companyName,
            department: booking.department,
            designation: booking.designation,
            idType: booking.idType,
            idNumber: booking.idNumber,
            adults: booking.adults,
            children: booking.children,
            roomPrice: booking.roomPrice,
            additionalGuests: booking.additionalGuests,
            additionalGuestCharges: booking.additionalGuestCharges,
            mattresses: booking.mattresses,
            discount: booking.discount,
            status: booking.status,
            checkInDate: booking.checkInDate,
            checkoutDate: booking.checkoutDate,
          },
        })

        // Create food orders for bookings that have them
        if (booking.hasFoodOrders) {
          const foodOrders = []

          if (booking.status === 'ACTIVE') {
            // Active bookings have uninvoiced food orders
            foodOrders.push(
              {
                bookingId: createdBooking.id,
                foodItemId: foodItemMap['Tea'],
                quantity: 2,
                invoiceId: null,
              },
              {
                bookingId: createdBooking.id,
                foodItemId: foodItemMap['Coffee'],
                quantity: 1,
                invoiceId: null,
              },
              {
                bookingId: createdBooking.id,
                foodItemId: foodItemMap['Paratha (Aloo)'],
                quantity: 3,
                invoiceId: null,
              }
            )
          }

          if (foodOrders.length > 0) {
            await prisma.foodOrder.createMany({
              data: foodOrders,
            })
          }
        }

        // Create invoice and payment for checked out bookings
        if (booking.status === 'CHECKED_OUT') {
          const days = Math.max(1, Math.ceil(
            (booking.checkoutDate!.getTime() - booking.checkInDate.getTime()) / (1000 * 60 * 60 * 24)
          ))

          const roomCharges = booking.roomPrice * days
          const additionalCharges = booking.additionalGuestCharges * booking.additionalGuests * days
          const subtotal = roomCharges + additionalCharges - booking.discount

          // Calculate food charges if applicable
          let foodCharges = 0
          if (booking.hasFoodOrders) {
            // Sample food charges for checked out bookings
            foodCharges = 450 // Tea (30x2) + Coffee (50x1) + Paratha (50x3) + Biryani (200x1)
          }

          const totalBeforeGst = subtotal + foodCharges
          const gstAmount = totalBeforeGst * 0.05
          const totalAmount = totalBeforeGst + gstAmount

          const invoice = await prisma.invoice.create({
            data: {
              bookingId: createdBooking.id,
              invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
              invoiceType: 'ROOM',
              isManual: false,
              guestName: booking.guestName,
              guestAddress: booking.guestAddress,
              guestMobile: booking.guestMobile,
              guestGstNumber: booking.guestGstNumber,
              companyName: booking.companyName,
              department: booking.department,
              designation: booking.designation,
              idType: booking.idType,
              idNumber: booking.idNumber,
              roomNumber: booking.roomNumber,
              roomType: 'Deluxe',
              checkInDate: booking.checkInDate,
              checkOutDate: booking.checkoutDate,
              adults: booking.adults,
              children: booking.children,
              numberOfDays: days,
              roomCharges,
              foodCharges,
              additionalGuestCharges: additionalCharges,
              discount: booking.discount,
              gstEnabled: true,
              gstAmount,
              totalAmount,
            },
          })

          // Link food orders to invoice if applicable
          if (booking.hasFoodOrders) {
            const foodOrdersToLink = [
              {
                bookingId: createdBooking.id,
                foodItemId: foodItemMap['Tea'],
                quantity: 2,
                invoiceId: invoice.id,
              },
              {
                bookingId: createdBooking.id,
                foodItemId: foodItemMap['Coffee'],
                quantity: 1,
                invoiceId: invoice.id,
              },
              {
                bookingId: createdBooking.id,
                foodItemId: foodItemMap['Paratha (Aloo)'],
                quantity: 3,
                invoiceId: invoice.id,
              },
              {
                bookingId: createdBooking.id,
                foodItemId: foodItemMap['Biryani (Chicken)'],
                quantity: 1,
                invoiceId: invoice.id,
              },
            ]

            await prisma.foodOrder.createMany({
              data: foodOrdersToLink,
            })
          }

          // Create payment
          await prisma.payment.create({
            data: {
              bookingId: createdBooking.id,
              mode: booking.paymentMode || 'CASH',
              status: booking.paymentStatus || 'PAID',
              amount: totalAmount,
            },
          })
        }

        console.log(`✓ Created booking for ${booking.guestName}`)
      }
    }

    console.log('✓ Created sample bookings with food orders, invoices, and payments')
  }

  console.log('\n========================================')
  console.log('Seeding completed successfully!')
  console.log('========================================')
  console.log('Users created:')
  console.log('  - manager@hotel.com / manager123 (MANAGER)')
  console.log('  - staff@hotel.com / staff123 (STAFF)')
  console.log('  - chef@hotel.com / chef123 (CHEF)')
  console.log('========================================\n')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
