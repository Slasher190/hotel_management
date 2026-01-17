# Quick Setup Guide

## Prerequisites
- Node.js 18+
- Docker Desktop installed and running

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Environment File
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://hotel_user:hotel_password@localhost:5432/hotel_management?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

### 3. Start Database
```bash
docker-compose up -d
```

Wait a few seconds for PostgreSQL to initialize.

### 4. Generate Prisma Client
```bash
npm run db:generate
```

### 5. Run Migrations
```bash
npm run db:migrate
```

When prompted for a migration name, you can use: `init`

### 6. Seed Database
```bash
npm run db:seed
```

This creates:
- Manager user: `manager@hotel.com` / `manager123`
- Admin user: `admin@hotel.com` / `admin123`
- Sample rooms (101, 102, 103, 201, 202, 203)
- Sample food items

### 7. Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` and login with manager credentials.

## Troubleshooting

### Database Connection Issues
- Ensure Docker is running: `docker ps`
- Check if container is up: `docker-compose ps`
- Restart database: `docker-compose restart`

### Prisma Issues
- Regenerate client: `npm run db:generate`
- Reset database: `docker-compose down -v` then `docker-compose up -d` and run migrations again

### Port Already in Use
- Change port in `docker-compose.yml` if 5432 is taken
- Update `DATABASE_URL` in `.env` accordingly

## Next Steps

1. Login at `http://localhost:3000/login`
2. Explore the dashboard
3. Add rooms, create bookings, and test checkout
4. Generate reports and invoices

## Production Deployment

Before deploying:
1. Change all default passwords
2. Use strong JWT_SECRET
3. Enable HTTPS
4. Set up proper database backups
5. Configure environment variables securely
