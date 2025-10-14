# 🚀 Quick Start Guide

Get your Crypto PnL Tracker running in 5 minutes!

## Prerequisites

Make sure you have installed:
- **Node.js 18+** ([download](https://nodejs.org/))
- **pnpm** (install with `npm install -g pnpm`)

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Set Up Supabase

### Option A: Supabase Cloud (Easiest)

1. Go to [supabase.com](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details and wait ~2 minutes
4. Go to **Settings** → **API**
5. Copy:
   - Project URL
   - `anon` `public` key
   - `service_role` `secret` key

### Option B: Local Supabase

```bash
# Install Supabase CLI
npm install -g supabase

# Start local instance
supabase start
```

## Step 3: Configure Environment

```bash
# Copy example env file
cp apps/web/.env.local.example apps/web/.env.local
```

Edit `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Set Up Database

```bash
# Link to your Supabase project (Cloud only)
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Seed with sample data
export SUPABASE_URL=your-url
export SUPABASE_SERVICE_ROLE_KEY=your-key
pnpm db:seed
```

## Step 5: Start Development Server

```bash
pnpm dev
```

🎉 **Done!** Open [http://localhost:3000](http://localhost:3000)

## What's Next?

1. **Sign up** for an account
2. **Create** your first portfolio
3. **Add** some transactions
4. **Track** your PnL in real-time

## Common Issues

### Port 3000 already in use?

```bash
# Use a different port
PORT=3001 pnpm dev
```

### Supabase connection error?

Double-check your `.env.local` file has the correct values from Supabase dashboard.

### Module not found?

```bash
# Clean install
rm -rf node_modules
pnpm install
```

## Need Help?

- 📖 Read the full [README.md](./README.md)
- 🔧 Check [SETUP.md](./SETUP.md) for detailed setup
- 🐛 [Open an issue](https://github.com/your-repo/issues)

---

**Happy tracking! 📈**
