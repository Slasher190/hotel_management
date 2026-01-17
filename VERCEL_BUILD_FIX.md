# Fix Vercel Build Error

## ❌ Problem

Your build command is:
```
npm run build && npm run db:migrate && npm run db:seed
```

This is **WRONG** because:
- Migrations need database connection during build (not available)
- Seed should not run during build
- Build should only compile the Next.js app

## ✅ Solution

### Step 1: Fix Build Command in Vercel

1. Go to your Vercel project dashboard
2. Go to **Settings** → **General** → **Build & Development Settings**
3. Find **Build Command**
4. Change it to:
   ```
   npm run build
   ```
5. **Remove** `&& npm run db:migrate && npm run db:seed` from the build command
6. Click **Save**

### Step 2: Redeploy

After fixing the build command:
1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**

### Step 3: Run Migrations Separately (After Build Succeeds)

After the build succeeds, run migrations manually:

**Option A: Using Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Seed database (only creates admin/manager users)
NODE_ENV=production npx prisma db seed
```

**Option B: Using Neon Dashboard**
1. Go to your Neon dashboard
2. Open SQL Editor
3. Copy the SQL from `prisma/migrations/20260117072908_init/migration.sql`
4. Run it in the SQL editor
5. Then run the seed script via CLI

## 📋 Correct Build Command

The build command should be:
```
npm run build
```

That's it! The `postinstall` script in package.json already runs `prisma generate` automatically.

## Why This Works

- `postinstall` script runs `prisma generate` after `npm install`
- `npm run build` compiles your Next.js app
- Migrations run separately after deployment
- Seed runs separately after migrations
