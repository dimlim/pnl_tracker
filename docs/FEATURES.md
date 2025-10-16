# Features Documentation - Crypto PnL Tracker

## 📋 Table of Contents

1. [Dashboard](#dashboard)
2. [Portfolio Management](#portfolio-management)
3. [Transaction Management](#transaction-management)
4. [Quick Insights](#quick-insights)
5. [Tax Reports](#tax-reports)
6. [Bulk Operations](#bulk-operations)
7. [Charts & Analytics](#charts--analytics)
8. [Search & Filters](#search--filters)
9. [Quick Add](#quick-add)
10. [Performance Features](#performance-features)

---

## 🏠 Dashboard

### Overview
Central hub для моніторингу всіх портфелів та активів.

### Features

#### Stats Cards
- **Total Value** - Загальна вартість всіх портфелів
- **Total P&L** - Загальний прибуток/збиток
- **Total ROI** - Загальний ROI у відсотках
- **24h Change** - Зміна за останні 24 години

#### PnL Chart
- Історія вартості портфеля
- 6 timeframes: 1D, 1W, 1M, 3M, 1Y, ALL
- Gradient fills (зелений для profit, червоний для loss)
- Interactive tooltips
- Responsive design

#### Quick Insights
- **Top Performer** - Найкращий asset за ROI
- **Best Day** - День з найбільшим приростом
- **Recent Activity** - Останні транзакції
- **Diversification** - Поради щодо диверсифікації
- **Overall Performance** - Загальна продуктивність

#### Portfolio Cards
- Sparkline (7-day trend)
- Current value
- P&L amount & percentage
- ROI
- Top 3 assets
- Quick actions (Edit, Delete, Duplicate, Export)

### User Actions
- Create new portfolio
- Add transaction
- View detailed analytics
- Navigate to specific portfolio

---

## 💼 Portfolio Management

### Features

#### Create Portfolio
- Custom name
- PnL method selection (FIFO/LIFO/AVG)
- Automatic initialization
- Validation

#### Edit Portfolio
- Update name
- Change PnL method
- Recalculate positions

#### Delete Portfolio
- Confirmation dialog
- Cascade delete transactions
- Update stats

#### Duplicate Portfolio
- Copy all settings
- Append "Copy" to name
- Fresh portfolio ID

#### PnL Methods

**FIFO (First In, First Out)**
- Queue-based lot tracking
- Tax-compliant in most jurisdictions
- Accurate cost basis
- Best for: Long-term holders

**LIFO (Last In, First Out)**
- Stack-based lot tracking
- Tax optimization potential
- Recent cost basis
- Best for: Active traders

**Average Cost**
- Weighted average calculation
- Simple to understand
- Popular method
- Best for: Casual investors

### Portfolio Stats
- Total value
- Total cost
- Unrealized P&L
- Realized P&L
- ROI percentage
- Asset count
- Transaction count
- First purchase date
- Last activity

---

## 💸 Transaction Management

### Transaction Types
1. **Buy** - Purchase crypto
2. **Sell** - Sell crypto
3. **Transfer In** - Receive from external wallet
4. **Transfer Out** - Send to external wallet
5. **Deposit** - Fiat deposit
6. **Withdraw** - Fiat withdrawal
7. **Airdrop** - Free tokens received

### Transaction Fields
- Asset (symbol & name)
- Type (buy/sell/etc)
- Quantity (amount)
- Price (per unit in USD)
- Fee (transaction fee)
- Date & Time
- Portfolio (destination)
- Notes (optional)

### Features

#### Add Transaction
- Quick add dialog (3-step wizard)
- Full form dialog
- Asset search
- Auto-fill current price
- Validation
- Toast notifications

#### Edit Transaction
- Update any field
- Recalculate P&L
- Validation
- Confirmation

#### Delete Transaction
- Confirmation dialog
- Update portfolio stats
- Recalculate positions

#### Transaction List
- Sortable columns
- Pagination
- Loading states
- Empty states
- Responsive design

---

## 💡 Quick Insights

### Insights Types

#### Top Performer
- Shows best asset by ROI
- Percentage gain
- Color-coded (green for profit)
- Icon: Trophy

#### Best Day
- Biggest gain from history
- Date and amount
- Calculated from 7-day data
- Icon: Calendar

#### Recent Activity
- Days since last transaction
- Activity status
- Encourages engagement
- Icon: Zap

#### Diversification
- Asset count
- Recommendations
- Health indicator
- Icon: Target

#### Overall Performance
- Total ROI
- Trend direction
- Color-coded
- Icon: TrendingUp/Down

### Display
- Max 4 insights shown
- Auto-calculated from real data
- Hover effects
- Responsive grid (2 columns on mobile, 2 on desktop)

---

## 💰 Tax Reports

### Overview
Professional tax reporting for cryptocurrency transactions.

### Features

#### Capital Gains Calculation
- **Short-term gains** (held ≤ 1 year)
- **Long-term gains** (held > 1 year)
- **Total capital gains**
- FIFO method for cost basis

#### Tax Year Selection
- Dropdown selector
- All available years
- Automatic year detection from transactions

#### Summary Cards
1. **Total Capital Gains**
   - Combined short + long term
   - Color-coded (profit/loss)
   - Tax year label

2. **Short-Term Gains**
   - Held ≤ 1 year
   - Taxed as ordinary income
   - Amount in USD

3. **Long-Term Gains**
   - Held > 1 year
   - Preferential tax rates
   - Amount in USD

4. **Transactions**
   - Count of taxable events
   - Sell transactions only

#### Detailed Breakdown
- Total proceeds
- Total cost basis
- Transaction count
- Important tax notes
- Disclaimers

#### Export (Premium Feature)
- **PDF Export** - Professional report
- **CSV Export** - For accountant/tax software
- Locked behind premium paywall
- Clear upgrade CTA

### Premium Upsell
- Banner at top of page
- Lock icon
- Clear value proposition
- "$9.99/month" pricing
- "Upgrade to Premium" button

### Tax Notes
- FIFO method explanation
- Short-term vs long-term
- Tax rate information
- Professional advice disclaimer
- Informational purposes only

---

## 🔄 Bulk Operations

### Features

#### Selection Mode
- Checkbox on each transaction
- Select All / Deselect All
- Selected count display
- Cancel selection

#### Bulk Actions Bar
- Fixed bottom position
- Slides up when items selected
- Gradient purple background
- Shows selected count

#### Available Actions

**1. Bulk Delete**
- Confirmation dialog
- Shows count
- Deletes all selected
- Updates stats
- Toast notification

**2. Bulk Move to Portfolio**
- Portfolio selector dialog
- Validates ownership
- Moves all selected
- Updates both portfolios
- Toast notification

**3. Bulk Export**
- Exports to CSV
- Selected transactions only
- Downloads file
- Filename with timestamp

**4. Select All**
- Selects all visible transactions
- Updates count
- Visual feedback

**5. Deselect All**
- Clears selection
- Hides action bar
- Resets state

### UX Features
- Smooth animations
- Loading states
- Error handling
- Toast notifications
- Keyboard accessible

---

## 📊 Charts & Analytics

### PnL Chart
- **Type**: Area chart with gradient
- **Data**: Portfolio value over time
- **Timeframes**: 1D, 1W, 1M, 3M, 1Y, ALL
- **Features**:
  - Hover tooltips
  - Gradient fills
  - Reference line
  - Responsive
  - Loading states

### Sparklines
- **Type**: Mini line chart
- **Data**: 7-day portfolio trend
- **Location**: Portfolio cards
- **Features**:
  - Compact design
  - Real-time data
  - Color-coded
  - Smooth animations

### Asset Allocation (Removed - будемо додавати пізніше)
- Pie chart
- Top 7 assets + Others
- Percentage labels
- Interactive legend

---

## 🔍 Search & Filters

### Search
- **Field**: Asset name or symbol
- **Debounced**: 300ms delay
- **Real-time**: Updates as you type
- **Case-insensitive**: Flexible matching

### Filter Types

#### 1. Date Range Filter
- Calendar picker
- Presets (Last 7 days, Last 30 days, etc)
- Custom range
- Clear button

#### 2. Transaction Type Filter
- Checkboxes for each type
- Multiple selection
- Buy, Sell, Transfer, etc
- Visual indicators

#### 3. P&L Filter
- All transactions
- Profit only
- Loss only
- Breakeven

#### 4. Amount Range Filter
- Min amount
- Max amount
- Number inputs
- Validation

#### 5. Asset Filter
- Dropdown or search
- Filter by specific asset
- Clear selection

### Filter UI
- Collapsible panel
- Active filter count
- Clear all filters
- Responsive design

---

## ⚡ Quick Add

### 3-Step Wizard

#### Step 1: Select Asset
- Command palette UI
- Search functionality
- Popular assets section (BTC, ETH, SOL, etc)
- All assets list
- Current price display
- Auto-advance on selection

#### Step 2: Buy or Sell
- Large visual buttons
- Color-coded (green=buy, red=sell)
- Icons (TrendingUp/Down)
- Auto-advance on selection

#### Step 3: Transaction Details
- Quantity input (auto-focus)
- Price input (auto-filled from current price)
- Portfolio selector (default pre-selected)
- Date picker (defaults to today)
- Submit button with loading state

### Features
- Progress bar (3 steps)
- Back navigation
- Auto-fill current price
- Smart defaults
- Validation
- Toast notifications
- Auto-reset on close

### Access Methods
- **FAB** (Floating Action Button)
  - Fixed bottom-right
  - Gradient purple
  - Hover animations
  - Always visible

- **Keyboard Shortcut**
  - Shift + A
  - Works from any dashboard page
  - Prevents default behavior

---

## 🚀 Performance Features

### Loading Skeletons
- **Stats Skeleton**: 4 animated cards
- **Chart Skeleton**: Chart placeholder
- **Card Skeleton**: Generic card
- **Table Skeleton**: Table rows

### Benefits
- Better perceived performance
- No blank screens
- Reduces layout shift
- Professional UX

### Lazy Loading
- Images load on demand
- `loading="lazy"` attribute
- Reduces initial page load
- Better for long lists

### Debounced Search
- 300ms delay
- Reduces API calls
- Prevents excessive re-renders
- Smooth typing experience

### React Query Caching
- 15-minute stale time
- Automatic refetching
- Optimistic updates
- Background updates

### Code Splitting
- Dynamic imports
- Route-based splitting
- Component-level splitting
- Smaller bundles

---

## 🎨 UI/UX Features

### Design System
- Glass morphism
- Gradient backgrounds
- Smooth animations
- Consistent spacing
- Color-coded metrics

### Responsive Design
- Mobile-first approach
- Breakpoints: sm, md, lg, xl
- Touch-friendly buttons
- Adaptive layouts

### Accessibility
- ARIA labels
- Keyboard navigation
- Focus indicators
- Screen reader support
- Semantic HTML

### Animations
- Framer Motion
- Page transitions
- Component animations
- Hover effects
- Loading states

### Toast Notifications
- Success messages
- Error messages
- Info messages
- Auto-dismiss
- Action buttons

---

## 🔐 Security Features

### Authentication
- Supabase Auth
- Email/password
- Session management
- JWT tokens
- Secure cookies

### Authorization
- Row Level Security (RLS)
- User-specific data
- Portfolio ownership
- Transaction permissions

### Data Protection
- Encrypted at rest
- HTTPS only
- Input validation
- SQL injection prevention
- XSS protection

---

## 📱 Mobile Features

### Responsive UI
- Mobile navigation
- Touch gestures
- Swipe actions
- Bottom sheets
- Mobile-optimized forms

### Performance
- Smaller images
- Lazy loading
- Reduced animations
- Optimized queries

---

## 🔮 Upcoming Features

### Planned
1. **Onboarding Flow**
   - 3-step wizard
   - First portfolio
   - First transaction
   - Tutorial

2. **Advanced Analytics**
   - Asset allocation pie chart
   - Performance comparison
   - Risk analysis
   - Correlation matrix

3. **Export/Import**
   - CSV import from exchanges
   - Binance integration
   - Coinbase integration
   - Backup/restore

4. **Notifications**
   - Price alerts
   - Portfolio milestones
   - Email notifications
   - Push notifications

5. **Premium Features**
   - Advanced tax tools
   - Priority support
   - API access
   - Custom reports

---

**Last Updated:** October 16, 2025  
**Version:** 1.0.0
