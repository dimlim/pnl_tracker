# Deployment Guide - Crypto PnL Tracker

## 📋 Overview

Повний гайд по deployment проєкту на Vercel з Supabase backend.

---

## 🏗️ Architecture

```
┌─────────────┐
│   Vercel    │  ← Frontend (Next.js)
│  (Edge)     │
└──────┬──────┘
       │
       │ tRPC
       │
┌──────▼──────┐
│  Supabase   │  ← Backend (PostgreSQL + Auth)
│  (Cloud)    │
└─────────────┘
```

---

## 🔧 Prerequisites

### Required Accounts
1. **GitHub** - Code repository
2. **Vercel** - Hosting platform
3. **Supabase** - Database & Auth

### Required Tools
- Node.js 18+
- pnpm 9+
- Git

---

## 📦 Environment Setup

### 1. Supabase Setup

#### Create Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization
4. Set project name: `crypto-pnl-tracker`
5. Set database password (save it!)
6. Choose region (closest to users)
7. Wait for project creation (~2 minutes)

#### Get API Keys
1. Go to Project Settings → API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

#### Setup Database Schema

Run SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Portfolios table
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pnl_method TEXT NOT NULL CHECK (pnl_method IN ('fifo', 'lifo', 'avg')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets table
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon_url TEXT,
  current_price NUMERIC(20, 8),
  market_cap NUMERIC(20, 2),
  volume_24h NUMERIC(20, 2),
  price_change_24h NUMERIC(10, 4),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'transfer_in', 'transfer_out', 'deposit', 'withdraw', 'airdrop')),
  quantity NUMERIC(20, 8) NOT NULL,
  price NUMERIC(20, 8) NOT NULL,
  fee NUMERIC(20, 8) DEFAULT 0,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_transactions_asset_id ON transactions(asset_id);
CREATE INDEX idx_transactions_timestamp ON transactions(timestamp);

-- Row Level Security
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for portfolios
CREATE POLICY "Users can view their own portfolios"
  ON portfolios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own portfolios"
  ON portfolios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios"
  ON portfolios FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios"
  ON portfolios FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = transactions.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions in their portfolios"
  ON transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = transactions.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own transactions"
  ON transactions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = transactions.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own transactions"
  ON transactions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = transactions.portfolio_id
      AND portfolios.user_id = auth.uid()
    )
  );

-- Assets are public (no RLS needed)
```

#### Seed Assets Data

```sql
INSERT INTO assets (symbol, name, icon_url, current_price) VALUES
('BTC', 'Bitcoin', 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png', 50000),
('ETH', 'Ethereum', 'https://assets.coingecko.com/coins/images/279/small/ethereum.png', 3000),
('BNB', 'Binance Coin', 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png', 400),
('SOL', 'Solana', 'https://assets.coingecko.com/coins/images/4128/small/solana.png', 100),
('ADA', 'Cardano', 'https://assets.coingecko.com/coins/images/975/small/cardano.png', 0.5),
('USDT', 'Tether', 'https://assets.coingecko.com/coins/images/325/small/Tether.png', 1),
('USDC', 'USD Coin', 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png', 1);
```

#### Setup Auth

1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates (optional)
4. Set Site URL: `https://your-domain.vercel.app`
5. Add Redirect URLs:
   - `http://localhost:3001/auth/callback`
   - `https://your-domain.vercel.app/auth/callback`

---

### 2. Vercel Setup

#### Connect Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import GitHub repository
4. Select `pnl_tracker` repo

#### Configure Project
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: `pnpm run build`
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

#### Environment Variables

Add in Vercel Dashboard → Settings → Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

⚠️ **Important:**
- Add variables to all environments (Production, Preview, Development)
- `SUPABASE_SERVICE_ROLE_KEY` should be encrypted

---

## 🚀 Deployment Process

### Initial Deployment

1. **Push to GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Vercel Auto-Deploy**
   - Vercel automatically detects push
   - Starts build process
   - Deploys to production
   - Assigns domain: `your-project.vercel.app`

3. **Verify Deployment**
   - Check build logs
   - Visit deployed URL
   - Test authentication
   - Create test portfolio

### Branch Deployments

#### Development Branch
```bash
git checkout -b develop
git push origin develop
```
- Vercel creates preview deployment
- URL: `your-project-git-develop.vercel.app`

#### Feature Branches
```bash
git checkout -b feature/new-feature
git push origin feature/new-feature
```
- Vercel creates unique preview
- URL: `your-project-git-feature-new-feature.vercel.app`

---

## 🔄 CI/CD Pipeline

### Automatic Deployments

**Triggers:**
- Push to `main` → Production deployment
- Push to `develop` → Preview deployment
- Pull Request → Preview deployment
- Commit to any branch → Preview deployment

**Build Process:**
1. Install dependencies (`pnpm install`)
2. Run linting (`pnpm lint`)
3. Type checking (`tsc --noEmit`)
4. Build application (`pnpm build`)
5. Deploy to Vercel Edge Network

**Build Time:** ~2-3 minutes

---

## 🌍 Custom Domain

### Add Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter domain: `cryptopnl.com`
4. Follow DNS configuration:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

5. Wait for DNS propagation (~24 hours)
6. Vercel auto-provisions SSL certificate

### Configure Supabase

Update Supabase Auth URLs:
1. Go to Authentication → URL Configuration
2. Set Site URL: `https://cryptopnl.com`
3. Add Redirect URLs:
   - `https://cryptopnl.com/auth/callback`
   - `https://www.cryptopnl.com/auth/callback`

---

## 📊 Monitoring

### Vercel Analytics

Enable in Dashboard:
1. Go to Analytics tab
2. Enable Web Analytics
3. Add `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` to env vars

Metrics tracked:
- Page views
- Unique visitors
- Top pages
- Referrers
- Devices
- Locations

### Error Tracking (Optional)

**Sentry Integration:**
```bash
pnpm add @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
  tracesSampleRate: 1.0,
})
```

---

## 🔐 Security

### Environment Variables
- Never commit `.env.local`
- Use Vercel encrypted variables
- Rotate keys regularly
- Separate dev/prod keys

### HTTPS
- Vercel provides automatic HTTPS
- Forces HTTPS redirects
- TLS 1.3 support

### Headers
Add in `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ]
}
```

---

## 🧪 Testing Deployment

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Auth configured
- [ ] Build succeeds locally

### Post-Deployment Verification
- [ ] Homepage loads
- [ ] Sign up works
- [ ] Login works
- [ ] Create portfolio works
- [ ] Add transaction works
- [ ] Charts display
- [ ] Mobile responsive
- [ ] No console errors

---

## 🐛 Troubleshooting

### Build Failures

**Error: Missing environment variables**
```
Solution: Add all required env vars in Vercel dashboard
```

**Error: TypeScript errors**
```bash
# Check locally
pnpm tsc --noEmit

# Fix errors and redeploy
```

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

### Runtime Errors

**Error: Supabase connection failed**
```
Check:
1. SUPABASE_URL is correct
2. SUPABASE_ANON_KEY is correct
3. RLS policies are set
4. Auth redirect URLs configured
```

**Error: 404 on API routes**
```
Check:
1. tRPC router is exported correctly
2. API route is in correct location
3. Middleware is configured
```

---

## 📈 Performance Optimization

### Vercel Edge Network
- Global CDN
- Automatic caching
- Edge functions
- Image optimization

### Caching Strategy
```typescript
// Static pages
export const revalidate = 3600 // 1 hour

// Dynamic pages
export const dynamic = 'force-dynamic'

// API routes
export const runtime = 'edge'
```

### Image Optimization
```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority // Above fold
/>
```

---

## 🔄 Rollback

### Instant Rollback

1. Go to Vercel Dashboard → Deployments
2. Find previous successful deployment
3. Click "..." → "Promote to Production"
4. Confirm rollback
5. Takes effect immediately

### Git Rollback
```bash
git revert HEAD
git push origin main
```

---

## 📱 Mobile Deployment

### PWA Support (Future)
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})

module.exports = withPWA({
  // ... config
})
```

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🆘 Support

### Vercel Support
- Dashboard → Help
- [Community Discord](https://vercel.com/discord)
- [GitHub Discussions](https://github.com/vercel/next.js/discussions)

### Supabase Support
- [Discord Community](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Documentation](https://supabase.com/docs)

---

**Last Updated:** October 16, 2025  
**Deployment Version:** 1.0.0
