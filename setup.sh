#!/bin/bash

echo "🚀 Hotel Management System Setup"
echo "================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "   Then run this script again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Start database
echo "📦 Starting PostgreSQL database..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 5

# Check if database is ready
until docker-compose exec -T postgres pg_isready -U hotel_user > /dev/null 2>&1; do
    echo "   Still waiting..."
    sleep 2
done

echo "✅ Database is ready"
echo ""

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run db:generate

# Run migrations
echo "📊 Running database migrations..."
npm run db:migrate

# Seed database
echo "🌱 Seeding database..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "Default credentials:"
echo "  Manager: manager@hotel.com / manager123"
echo "  Admin:   admin@hotel.com / admin123"
echo ""
echo "Start the development server with: npm run dev"
