# Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Supabase

#### Option A: Use Supabase Cloud (Recommended)

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready (~2 minutes)
3. Go to Project Settings → API
4. Copy your project URL and anon key

#### Option B: Use Supabase Local

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# This will output your local credentials
```

### 3. Configure Environment Variables

```bash
# Copy the example file
cp apps/web/.env.local.example apps/web/.env.local

# Edit apps/web/.env.local with your Supabase credentials
```

Your `.env.local` should look like:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Run Database Migrations

```bash
# If using Supabase Cloud
supabase link --project-ref your-project-ref
supabase db push

# If using local Supabase
supabase db push --db-url postgresql://postgres:postgres@localhost:54322/postgres
```

### 5. Seed the Database

```bash
# Set environment variables for the seed script
export SUPABASE_URL=your-url
export SUPABASE_SERVICE_ROLE_KEY=your-key

# Run seed
pnpm db:seed
```

### 6. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## Troubleshooting

### "Module not found" errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
```

### Supabase connection errors

1. Check your `.env.local` file has correct values
2. Verify your Supabase project is running
3. Check if migrations were applied: `supabase db diff`

### Build errors

```bash
# Type check
pnpm turbo run build --dry-run

# Check for TypeScript errors
cd apps/web && npx tsc --noEmit
```

## Development Workflow

### Creating a new migration

```bash
# Create a new migration file
supabase migration new your_migration_name

# Edit the file in supabase/migrations/
# Then apply it
supabase db push
```

### Running tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests for specific package
cd packages/pnl-engine && pnpm test
```

### Adding a new package

```bash
# Create package directory
mkdir -p packages/your-package/src

# Create package.json
cat > packages/your-package/package.json << EOF
{
  "name": "@crypto-pnl/your-package",
  "version": "0.1.0",
  "private": true,
  "main": "./src/index.ts"
}
EOF
```

## Production Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

### Environment Variables for Production

Required in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Next Steps

- [ ] Add your first portfolio
- [ ] Import transactions
- [ ] Set up price alerts
- [ ] Connect exchange APIs
- [ ] Customize your dashboard

## Need Help?

- 📖 [Documentation](./README.md)
- 💬 [GitHub Issues](https://github.com/your-repo/issues)
- 📧 Email: support@cryptopnl.com
