# Vercel Deployment Guide

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A PostgreSQL database (you can use Vercel Postgres, Supabase, Neon, or any PostgreSQL provider)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Database

Since Vercel doesn't support Docker, you'll need to use a cloud PostgreSQL database:

### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel project dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the connection string

### Option B: External PostgreSQL (Supabase, Neon, Railway, etc.)
1. Create a PostgreSQL database on your preferred provider
2. Get the connection string

## Step 2: Set Up Environment Variables

In your Vercel project settings, add these environment variables:

### Required Variables:
```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
JWT_SECRET=your-secret-key-here (use a strong random string)
NODE_ENV=production
```

### To generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 3: Deploy to Vercel

### Method 1: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. For production deployment:
```bash
vercel --prod
```

### Method 2: Using GitHub Integration (Recommended)

1. Push your code to GitHub:
```bash
git push origin main
```

2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Add environment variables in the project settings
6. Click Deploy

## Step 4: Run Database Migrations

After deployment, you need to run migrations and seed the database:

### Option A: Using Vercel CLI
```bash
vercel env pull .env.local
npx prisma migrate deploy
NODE_ENV=production npx prisma db seed
```

### Option B: Using Vercel Postgres Dashboard
1. Go to your Vercel project → Storage → Postgres
2. Use the SQL Editor to run migrations manually

### Option C: Create a Migration API Route (Temporary)

Create `app/api/migrate/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  // Add authentication here
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Run migrations
    // This is a simplified version - use prisma migrate deploy in production
    return NextResponse.json({ message: 'Migrations completed' })
  } catch (error) {
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 })
  }
}
```

## Step 5: Seed the Database

After migrations, seed the database (only creates admin/manager users in production):

```bash
NODE_ENV=production npx prisma db seed
```

Or use Vercel CLI:
```bash
vercel env pull .env.local
NODE_ENV=production npx tsx prisma/seed.ts
```

## Important Notes

1. **Database Connection**: Make sure your `DATABASE_URL` is accessible from Vercel's servers
2. **Prisma Client**: Vercel will automatically run `prisma generate` during build
3. **Environment Variables**: Never commit `.env` file - use Vercel's environment variables
4. **Build Time**: The build process includes Prisma generation, which may take a few minutes
5. **Serverless Functions**: API routes run as serverless functions on Vercel

## Troubleshooting

### Build Fails
- Check that `DATABASE_URL` is set correctly
- Ensure Prisma schema is valid
- Check build logs in Vercel dashboard

### Database Connection Issues
- Verify `DATABASE_URL` format is correct
- Check if your database allows connections from Vercel IPs
- Some providers require IP whitelisting

### Migration Issues
- Run migrations manually using Vercel CLI or database provider's SQL editor
- Check Prisma migration files are committed to git

## Post-Deployment

1. Test the application at your Vercel URL
2. Login with default credentials:
   - Manager: `manager@hotel.com` / `manager123`
   - Admin: `admin@hotel.com` / `admin123`
3. Change default passwords immediately in production!

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
