# Crypto PnL Tracker - Full Project Analysis

**Date:** October 16, 2025  
**Version:** Current State

---

## 📋 Table of Contents

1. [Tech Stack](#tech-stack)
2. [Architecture](#architecture)
3. [Features Overview](#features-overview)
4. [Pages & Components](#pages--components)
5. [Data Flow](#data-flow)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [UI Components](#ui-components)
9. [Current Issues](#current-issues)
10. [Improvement Opportunities](#improvement-opportunities)

---

## 🛠 Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Library:** shadcn/ui
- **Animations:** Framer Motion
- **Charts:** Recharts, Lightweight Charts
- **State Management:** React hooks, tRPC
- **Forms:** React Hook Form (where used)

### Backend
- **API:** tRPC (type-safe API)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Security:** Row Level Security (RLS)

### Infrastructure
- **Monorepo:** Turborepo
- **Package Manager:** pnpm
- **Deployment:** Vercel
- **CI/CD:** GitHub Actions

### Packages
```
apps/
  web/                 # Next.js frontend
packages/
  pnl-engine/         # P&L calculation logic
  trpc/               # tRPC router & procedures
  types/              # Shared TypeScript types
```

---

## 🏗 Architecture

### Monorepo Structure
```
pnl_tracker/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/              # Next.js App Router
│       │   │   ├── (auth)/       # Auth pages
│       │   │   ├── dashboard/    # Main app
│       │   │   └── api/          # API routes
│       │   ├── components/       # React components
│       │   │   ├── ui/           # shadcn/ui base
│       │   │   ├── charts/       # Chart components
│       │   │   ├── portfolio/    # Portfolio components
│       │   │   └── transactions/ # Transaction components
│       │   └── lib/              # Utilities
│       └── public/
├── packages/
│   ├── pnl-engine/   # FIFO/LIFO/AVG calculations
│   ├── trpc/         # API layer
│   └── types/        # Shared types
└── docs/             # Documentation
```

### Data Flow
```
User Action → Component → tRPC Client → tRPC Server → Supabase → Response
                ↓
         React State Update
                ↓
           UI Re-render
```

---

## ✨ Features Overview

### 1. **Authentication**
- Email/Password login
- Magic link (email)
- OAuth providers (Google, GitHub)
- Protected routes
- Session management

### 2. **Dashboard**
- Total portfolio value
- Total P&L
- ROI percentage
- 24h change
- PnL Chart with timeframes (1D, 1W, 1M, 3M, 1Y, ALL)
- Portfolio cards grid
- Quick stats

### 3. **Portfolios**
- Create/Edit/Delete/Duplicate
- Multiple portfolios support
- P&L methods: FIFO, LIFO, AVG
- Base currency: USD (locked)
- Include/exclude fees
- Portfolio summary bar
- Filters & sorting
- Import/Export transactions

### 4. **Portfolio Detail Page**
- Portfolio stats (Value, P&L, ROI)
- Edit/Delete buttons
- Positions list
- Recent transactions (top 10)
- Add transaction button

### 5. **Transactions**
- List all transactions
- Filter by portfolio
- Search by asset
- Filter by type (buy/sell)
- Sort by date/quantity/price/value/ROI
- Bulk operations (select, delete)
- Import/Export (CSV, JSON)
- Add transaction dialog

### 6. **Assets**
- Asset detail page
- Current price
- 24h change
- Market cap
- Holdings stats
- Price chart (1h, 4h, 24h, 7d, 30d, all)
- Transaction history
- Profit/Loss per transaction
- ROI calculation

### 7. **Transaction Management**
- Add transaction (buy/sell/transfer)
- Edit transaction
- Delete transaction
- Bulk delete
- Import from CSV
- Export to CSV/JSON

---

## 📄 Pages & Components

### Main Pages

#### `/dashboard`
**Purpose:** Main overview of all portfolios  
**Components:**
- PnL Chart (with timeframe filters)
- Stats cards (Total Value, Total P&L, Portfolios, 24h Change)
- Portfolio cards grid
- PortfolioCardUnified (with sparkline, stats, actions)

**Features:**
- Real-time stats
- Interactive chart
- Portfolio actions (Edit, Delete, Duplicate, Export)
- Responsive grid

---

#### `/dashboard/portfolios`
**Purpose:** Manage all portfolios  
**Components:**
- Portfolio summary bar
- Portfolio filters (search, sort, currency)
- Portfolio cards grid
- Create portfolio dialog
- Import/Export buttons

**Features:**
- Create new portfolio
- Filter & sort
- Bulk operations
- Summary statistics

---

#### `/dashboard/portfolios/[id]`
**Purpose:** Single portfolio detail  
**Components:**
- Portfolio header (name, method, currency)
- Stats cards (Total Value, P&L, Positions)
- Edit/Delete buttons
- Positions list
- TransactionList (recent 10)

**Features:**
- Edit portfolio settings
- Delete portfolio
- View positions
- Add transactions
- Navigate to assets

---

#### `/dashboard/transactions`
**Purpose:** All transactions across portfolios  
**Components:**
- Portfolio filter cards
- Search & filters
- TransactionList (with all features)
- Import/Export buttons
- Add transaction dialog

**Features:**
- Filter by portfolio
- Search by asset
- Filter by type
- Sort by multiple fields
- Bulk delete
- Import/Export

---

#### `/dashboard/assets/[id]`
**Purpose:** Single asset detail  
**Components:**
- Asset header (icon, name, symbol)
- Current price & 24h change
- Stats cards (Holdings, Avg Buy Price, Total P&L, ROI)
- Price chart
- Transaction filters
- TransactionList (for this asset)

**Features:**
- Real-time price
- Historical price chart
- Transaction history
- Profit/Loss per transaction
- ROI calculation
- Bulk delete transactions

---

### Key Components

#### **PortfolioCardUnified**
```typescript
// Location: components/portfolio/portfolio-card-unified.tsx
// Purpose: Unified portfolio card for Dashboard & Portfolios page

Features:
- Portfolio name & base currency badge
- Total value & 24h change
- Total P&L with percentage
- Asset count with crypto icons
- Last updated time
- Sparkline chart (7-day trend)
- 3-dots menu (Edit, Delete, Duplicate, Export)
- Hover effects & animations
```

#### **TransactionRow**
```typescript
// Location: components/transactions/transaction-row.tsx
// Purpose: Universal transaction row

Features:
- Profit/Loss icon (green/red)
- Clickable asset (icon + name) → navigate to asset page
- Transaction type badge
- Profit/Loss badge with emoji
- Date & days held
- Quantity, Buy Price, Current Value, ROI
- Selection mode support
- Edit button
```

#### **TransactionList**
```typescript
// Location: components/transactions/transaction-list.tsx
// Purpose: Wrapper for multiple TransactionRows

Features:
- Card with title
- Selection mode (Select/Cancel buttons)
- Bulk delete
- Loading states (skeleton)
- Empty states
- Configurable: showAsset, showPortfolio, showROI
```

#### **PnL Chart**
```typescript
// Location: components/charts/pnl-chart.tsx
// Purpose: Portfolio history chart

Features:
- Timeframe filters (1D, 1W, 1M, 3M, 1Y, ALL)
- Gradient fills (green profit, red loss)
- Tooltips (Value, P&L, ROI)
- Reference line
- Responsive
- Loading states
```

#### **CryptoIcon**
```typescript
// Location: components/ui/crypto-icon.tsx
// Purpose: Display crypto icons

Priority:
1. Database icon_url (CoinGecko)
2. cryptocurrency-icons library (400+ coins)
3. Gradient fallback (violet→fuchsia)
```

#### **Custom Dialogs**
```typescript
// Location: components/ui/confirm-dialog.tsx, prompt-dialog.tsx
// Purpose: Replace native browser dialogs

Features:
- ConfirmDialog (default, destructive variants)
- PromptDialog (with validation)
- Promise-based API
- Keyboard navigation
- Beautiful shadcn/ui design
```

---

## 🔄 Data Flow

### Portfolio Creation
```
User fills form → createPortfolio.mutate() → tRPC → Supabase INSERT
→ Success → invalidate cache → UI refresh → Show new portfolio
```

### Transaction Add
```
User adds transaction → addTransaction.mutate() → tRPC → Supabase INSERT
→ Update positions → Recalculate P&L → invalidate cache → UI refresh
```

### P&L Calculation
```
Fetch transactions → Sort by date → Apply method (FIFO/LIFO/AVG)
→ Calculate cost basis → Current price - cost basis = P&L
→ Return positions with P&L
```

### Real-time Updates
```
tRPC useQuery → Auto-refetch on window focus
→ Optimistic updates on mutations
→ Cache invalidation on success
```

---

## 🗄 Database Schema

### Tables

#### **portfolios**
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES auth.users
name            TEXT NOT NULL
base_currency   TEXT DEFAULT 'USD'
pnl_method      TEXT DEFAULT 'fifo' -- 'fifo' | 'lifo' | 'avg'
include_fees    BOOLEAN DEFAULT true
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

#### **assets**
```sql
id              SERIAL PRIMARY KEY
symbol          TEXT UNIQUE NOT NULL
name            TEXT NOT NULL
icon_url        TEXT
current_price   NUMERIC
price_change_24h NUMERIC
market_cap      NUMERIC
last_updated    TIMESTAMP
```

#### **transactions**
```sql
id              SERIAL PRIMARY KEY
portfolio_id    UUID REFERENCES portfolios
asset_id        INTEGER REFERENCES assets
type            TEXT NOT NULL -- 'buy' | 'sell' | 'transfer_in' | 'transfer_out'
quantity        NUMERIC NOT NULL
price           NUMERIC NOT NULL
fee             NUMERIC DEFAULT 0
timestamp       TIMESTAMP NOT NULL
note            TEXT
created_at      TIMESTAMP
```

#### **positions**
```sql
-- Calculated view, not stored
portfolio_id    UUID
asset_id        INTEGER
quantity        NUMERIC
avg_cost        NUMERIC
total_cost      NUMERIC
current_value   NUMERIC
pnl             NUMERIC
pnl_percent     NUMERIC
```

---

## 🔌 API Endpoints (tRPC)

### Dashboard
- `dashboard.getStats` - Get overall stats
- `dashboard.getPortfolioHistory` - Get P&L history with timeframe

### Portfolios
- `portfolios.list` - Get all portfolios
- `portfolios.listWithStats` - Get portfolios with calculated stats
- `portfolios.getById` - Get single portfolio
- `portfolios.create` - Create new portfolio
- `portfolios.update` - Update portfolio
- `portfolios.delete` - Delete portfolio
- `portfolios.duplicate` - Duplicate portfolio (with/without transactions)

### Transactions
- `transactions.list` - Get transactions by portfolio
- `transactions.listAll` - Get all user transactions
- `transactions.create` - Create transaction
- `transactions.update` - Update transaction
- `transactions.delete` - Delete transaction
- `transactions.bulkDelete` - Delete multiple transactions

### Assets
- `assets.list` - Get all assets
- `assets.getById` - Get single asset
- `assets.search` - Search assets
- `assets.updatePrices` - Update current prices (admin)

### Positions
- `positions.list` - Get positions for portfolio
- `positions.getByAsset` - Get position for specific asset

---

## 🎨 UI Components Library

### shadcn/ui Components Used
- Button, Card, Dialog, Input, Label
- Select, Checkbox, Dropdown Menu
- Alert Dialog, Tabs, Separator
- Skeleton, Badge, Avatar
- Tooltip, Popover

### Custom Components
- CryptoIcon - Crypto currency icons
- Number - Animated number display
- ConfirmDialog - Custom confirmation
- PromptDialog - Custom input prompt
- TransactionRow - Transaction display
- TransactionList - Transaction list wrapper
- PortfolioCardUnified - Portfolio card
- PnL Chart - Portfolio history chart
- Price Chart - Asset price chart

---

## ⚠️ Current Issues

### 1. **Mock Data**
- Sparkline data is hardcoded: `[100, 105, 103, 108, 112, 110, 115]`
- Need real 7-day portfolio history

### 2. **Performance**
- No virtual scrolling for large transaction lists
- All transactions loaded at once
- No pagination

### 3. **UX Issues**
- No loading states in some places
- No error boundaries
- Limited error messages

### 4. **Missing Features**
- No date range filter for transactions
- No transaction categories/tags
- No notes/attachments
- No recurring transactions
- No alerts/notifications

### 5. **Data Validation**
- Limited input validation
- No duplicate transaction detection
- No price validation

---

## 🚀 Improvement Opportunities

### High Priority

#### 1. **Real Sparkline Data**
- Create endpoint for 7-day portfolio history
- Calculate daily P&L values
- Update PortfolioCardUnified to use real data
- Add caching for performance

#### 2. **Performance Optimization**
- Implement virtual scrolling (react-window)
- Add pagination for transactions
- Lazy load images
- Optimize tRPC queries

#### 3. **Enhanced Filters**
- Date range picker
- Amount range filter
- Profit/loss only filter
- Save filter presets
- Advanced search

### Medium Priority

#### 4. **Portfolio Analytics**
- Asset allocation pie chart
- Performance comparison
- Top gainers/losers
- Historical performance
- Benchmark comparison

#### 5. **Bulk Operations**
- Bulk edit transactions
- Bulk move to portfolio
- Bulk tag/categorize
- Bulk export selected

#### 6. **Better Error Handling**
- Error boundaries
- Toast notifications
- Retry mechanisms
- Offline support

### Low Priority

#### 7. **Additional Features**
- Transaction categories
- Notes & attachments
- Recurring transactions
- Price alerts
- Email notifications
- Mobile app

#### 8. **UI Enhancements**
- Dark/light mode toggle
- Customizable dashboard
- Draggable widgets
- Keyboard shortcuts
- Accessibility improvements

---

## 📊 Current Metrics

### Code Stats
- **Total Files:** ~150+
- **Components:** ~50+
- **Pages:** 8 main pages
- **tRPC Endpoints:** 20+
- **Database Tables:** 4 main tables

### Features Implemented
- ✅ Authentication
- ✅ Multi-portfolio support
- ✅ Transaction management
- ✅ P&L calculation (FIFO/LIFO/AVG)
- ✅ Real-time price tracking
- ✅ Import/Export
- ✅ Charts & visualizations
- ✅ Responsive design

### Features Partially Implemented
- ⚠️ Sparkline (mock data)
- ⚠️ Bulk operations (delete only)
- ⚠️ Filters (basic only)

### Features Missing
- ❌ Date range filters
- ❌ Categories/tags
- ❌ Alerts/notifications
- ❌ Multi-currency support
- ❌ Tax reports
- ❌ API integrations

---

## 🎯 Recommended Next Steps

### Phase 1: Core Improvements (1-2 weeks)
1. Real sparkline data
2. Performance optimization
3. Enhanced filters
4. Better error handling

### Phase 2: Analytics (2-3 weeks)
1. Asset allocation chart
2. Performance comparison
3. Historical analysis
4. Benchmark tracking

### Phase 3: Advanced Features (3-4 weeks)
1. Categories & tags
2. Alerts & notifications
3. Tax reports
4. API integrations

---

## 📝 Notes

- All currency locked to USD
- P&L methods: FIFO, LIFO, AVG
- Real-time price updates from CoinGecko
- Icons from database + cryptocurrency-icons library
- Responsive design for mobile/tablet/desktop
- Type-safe with TypeScript throughout
- RLS enabled for security

---

**Last Updated:** October 16, 2025  
**Status:** Production Ready (with improvements needed)
