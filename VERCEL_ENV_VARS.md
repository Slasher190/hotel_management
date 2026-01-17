# Vercel Environment Variables

Use these exact values in Vercel Dashboard → Settings → Environment Variables:

## Required Environment Variables

### 1. DATABASE_URL
```
postgresql://neondb_owner:npg_v21OamswkVIE@ep-green-mode-ah37kp1q-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

### 2. JWT_SECRET
```
70114ee45c829bfa241795192ef8b59ef757b12b155845ce3aa890d92dac7f04
```

### 3. NODE_ENV
```
production
```

## How to Add in Vercel:

1. Go to your Vercel project dashboard
2. Click on "Settings"
3. Click on "Environment Variables"
4. Add each variable:
   - Key: `DATABASE_URL`
   - Value: (paste the connection string above)
   - Environment: Select "Production", "Preview", and "Development"
   
   - Key: `JWT_SECRET`
   - Value: (use the generated value below)
   - Environment: Select "Production", "Preview", and "Development"
   
   - Key: `NODE_ENV`
   - Value: `production`
   - Environment: Select "Production" only

## Important Notes:

- Make sure to add these to ALL environments (Production, Preview, Development)
- The DATABASE_URL is sensitive - don't share it publicly
- After adding variables, you'll need to redeploy for them to take effect
