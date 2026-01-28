# Hotel Management System

A comprehensive internal hotel management system built with Next.js, PostgreSQL, and Prisma. Designed for efficient room booking, billing, and operations management

## Feature

- **Room Management**: Manage AC and Non-AC rooms with real-time availability
- **Booking Management**: Easy check-in process with manual checkout
- **Food Management**: Add food items to bookings with GST calculation
- **Invoice Generation**: Professional PDF invoices with GST support
- **Payment Tracking**: Track payments (Cash/Online) with pending payment management
- **Reports & Analytics**: Monthly revenue reports with Excel/CSV export
- **Hidden Admin Controls**: Administrative API endpoints for data management (not visible in UI)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (via Docker)
- **ORM**: Prisma
- **PDF Generation**: jsPDF
- **Export**: XLSX, CSV

## Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- npm or yarn

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd hotel_management
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://hotel_user:hotel_password@localhost:5432/hotel_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 3. Start PostgreSQL Database

```bash
docker-compose up -d
```

This will start a PostgreSQL container on port 5432.

### 4. Run Database Migrations

```bash
npm run db:migrate
```

### 5. Seed the Database

```bash
npm run db:seed
```

This creates:
- Default manager user: `manager@hotel.com` / `manager123`
- Staff user: `staff@hotel.com` / `staff123`
- Chef user: `chef@hotel.com` / `chef123`
- System settings for password reset
- Room types including ROOM and HALL categories
- Sample rooms and food items organized by categories
- Sample bookings with invoices and payments

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Default Credentials

- **Manager**: `manager@hotel.com` / `manager123`
- **Staff**: `staff@hotel.com` / `staff123`
- **Chef**: `chef@hotel.com` / `chef123`

## Project Structure

```
hotel_management/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── login/            # Login page
│   └── page.tsx          # Landing page
├── lib/                  # Utility functions
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts          # Database seed script
├── docker-compose.yml    # Docker configuration
└── README.md
```

## Key Features Implementation

### Room Management
- Add rooms with room number and type (AC/Non-AC)
- Automatic status updates (Available/Occupied)
- View all rooms with filtering

### Booking Management
- Check-in only (no checkout date during booking)
- Select available room and room type
- Manual room price entry
- Guest details with ID type (no ID number storage)
- Manual checkout process

### Food Management
- Add food items with category, price, and GST percentage
- Enable/disable food items
- Link food orders to bookings
- Food charges included in checkout

### Invoice Generation
- PDF invoice generation on checkout
- GST support with tax breakdown
- Invoice number generation
- Permanent storage in database

### Payment Management
- Payment mode: Cash or Online
- Payment status: Paid or Pending
- No payment gateway integration
- Pending payment tracking

### Reports
- Monthly revenue overview
- Filter by GST bookings
- Filter by payment status
- Export to Excel and CSV

## Hidden Admin Features

Admin API endpoints are available at `/api/admin` but are not visible in the UI. These allow:
- View all data (for audits)
- Create/update/delete users, rooms, bookings
- Modify invoices and payments
- Adjust pricing and GST
- Insert test/mock data

Access requires admin role token.

## Development

### Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create migration
npm run db:migrate

# Seed database
npm run db:seed
```

### Build for Production

```bash
npm run build
npm start
```

## Security Notes

- Change default passwords in production
- Use strong JWT_SECRET
- Enable HTTPS in production
- Implement rate limiting
- Add input validation and sanitization
- Regular database backups

## License

This project is for internal use only.
