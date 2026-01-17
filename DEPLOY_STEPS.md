# Step-by-Step Vercel Deployment

## ✅ What You Need (Credentials)

You only need:
1. **GitHub account** (to push your code)
2. **Vercel account** (free at https://vercel.com)
3. **Your Neon database connection string** (you already have this)

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### Step 2: Deploy on Vercel

1. Go to **https://vercel.com/new**
2. Click **"Import Git Repository"**
3. Select your GitHub repository
4. Vercel will auto-detect Next.js - click **"Deploy"** (don't configure yet)

### Step 3: Add Environment Variables

**After the first deployment attempt**, go to:
- Your Project → **Settings** → **Environment Variables**

Add these **3 variables**:

#### Variable 1: DATABASE_URL
- **Key:** `DATABASE_URL`
- **Value:** 
```
postgresql://neondb_owner:npg_v21OamswkVIE@ep-green-mode-ah37kp1q-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: JWT_SECRET
- **Key:** `JWT_SECRET`
- **Value:**
```
70114ee45c829bfa241795192ef8b59ef757b12b155845ce3aa890d92dac7f04
```
- **Environments:** ✅ Production, ✅ Preview, ✅ Development

#### Variable 3: NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`
- **Environments:** ✅ Production only

### Step 4: Redeploy

After adding environment variables:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for build to complete

### Step 5: Run Database Migrations

After successful deployment, run migrations:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project (if not already linked)
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Seed database (creates admin/manager users)
NODE_ENV=production npx prisma db seed
```

**Alternative:** If CLI doesn't work, you can run migrations via Neon dashboard SQL editor using the migration SQL file.

### Step 6: Test Your App

1. Visit your Vercel URL: `https://your-project.vercel.app`
2. Login with:
   - **Manager:** `manager@hotel.com` / `manager123`
   - **Admin:** `admin@hotel.com` / `admin123`

## 📋 Summary of Credentials Needed

| What | Where to Get |
|------|-------------|
| GitHub Account | Sign up at github.com (if you don't have one) |
| Vercel Account | Sign up at vercel.com (if you don't have one) |
| DATABASE_URL | ✅ You already have this (Neon connection string) |
| JWT_SECRET | ✅ Generated above: `70114ee45c829bfa241795192ef8b59ef757b12b155845ce3aa890d92dac7f04` |

## ⚠️ Important Notes

1. **Neon Database**: Make sure your Neon database allows connections from Vercel IPs (usually enabled by default)
2. **First Deployment**: The first build might fail - that's okay! Add environment variables and redeploy
3. **Migrations**: Must be run manually after first deployment
4. **Security**: Change default passwords after first login in production!

## 🆘 Troubleshooting

**Build fails?**
- Check environment variables are added correctly
- Verify DATABASE_URL format
- Check build logs in Vercel dashboard

**Can't connect to database?**
- Verify Neon database is running
- Check if connection string is correct
- Some Neon plans require IP whitelisting

**Need help?**
- Check Vercel deployment logs
- Review Neon database connection settings
