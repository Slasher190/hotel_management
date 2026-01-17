# Quick Vercel Deployment Guide

## 🚀 Quick Start

### 1. Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Deploy on Vercel

**Option A: Via Vercel Website (Recommended)**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will auto-detect Next.js
4. Add environment variables (see below)
5. Click "Deploy"

**Option B: Via Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### 3. Set Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
JWT_SECRET=<generate-a-random-32-char-string>
NODE_ENV=production
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Set Up Database

**Recommended: Vercel Postgres**
1. In Vercel Dashboard → Storage → Create Database → Postgres
2. Copy the connection string to `DATABASE_URL`

**Alternative: External Database**
- Supabase (free tier available)
- Neon (free tier available)
- Railway
- Any PostgreSQL provider

### 5. Run Migrations & Seed

After first deployment, run:

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Seed database (creates admin/manager users)
NODE_ENV=production npx prisma db seed
```

Or use your database provider's SQL editor to run the migration SQL manually.

### 6. Access Your App

Your app will be available at: `https://your-project.vercel.app`

**Default Login Credentials:**
- Manager: `manager@hotel.com` / `manager123`
- Admin: `admin@hotel.com` / `admin123`

⚠️ **Change these passwords immediately in production!**

## 📝 Notes

- The `postinstall` script in package.json automatically runs `prisma generate` after npm install
- Build command includes Prisma generation automatically
- Database migrations need to be run manually after first deployment
- In production, seed script only creates admin/manager users (no sample data)

## 🔧 Troubleshooting

**Build fails?**
- Check `DATABASE_URL` is set correctly
- Verify Prisma schema is valid
- Check build logs in Vercel dashboard

**Database connection issues?**
- Verify `DATABASE_URL` format
- Check database allows external connections
- Some providers require IP whitelisting (Vercel IPs)

**Need help?**
- Check Vercel logs in dashboard
- Review `VERCEL_DEPLOYMENT.md` for detailed guide
