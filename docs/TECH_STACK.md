# Tech Stack - Crypto PnL Tracker

## 📋 Overview

Crypto PnL Tracker - професійний трекер криптовалютного портфеля з розширеною аналітикою та tax reporting.

---

## 🏗️ Architecture

### Monorepo Structure (Turborepo)

```
pnl_tracker/
├── apps/
│   └── web/              # Next.js web application
├── packages/
│   ├── pnl-engine/       # Core PnL calculation engine
│   ├── trpc/             # tRPC API router & procedures
│   └── types/            # Shared TypeScript types
└── docs/                 # Documentation
```

---

## 🎨 Frontend Stack

### Core Framework
- **Next.js 15.0.3** - React framework with App Router
  - Server Components
  - Server Actions
  - Route Handlers
  - Middleware
  - Image Optimization

- **React 18** - UI library
  - Hooks (useState, useEffect, useMemo, useCallback)
  - Context API
  - Suspense
  - Error Boundaries

- **TypeScript 5.x** - Type safety
  - Strict mode enabled
  - Path aliases (@/)
  - Type inference
  - Generic types

### UI & Styling
- **Tailwind CSS 3.x** - Utility-first CSS
  - Custom color palette
  - Glass morphism utilities
  - Responsive breakpoints
  - Dark mode support

- **shadcn/ui** - Component library
  - Radix UI primitives
  - Accessible components
  - Customizable with Tailwind
  - Components used:
    - Button, Card, Dialog, Dropdown
    - Select, Input, Label, Checkbox
    - Popover, Command, Tabs
    - Alert Dialog, Toast

- **Framer Motion** - Animations
  - Page transitions
  - Component animations
  - Gesture handling
  - Layout animations

### Data Visualization
- **Recharts** - Chart library
  - Line charts
  - Pie charts
  - Area charts
  - Custom tooltips
  - Responsive containers

- **Lightweight Charts** - Trading charts
  - Candlestick charts
  - Volume indicators
  - Technical analysis

### State Management
- **tRPC** - End-to-end typesafe APIs
  - React Query integration
  - Automatic type inference
  - Optimistic updates
  - Cache management

- **@tanstack/react-query** - Server state
  - Data fetching
  - Caching
  - Synchronization
  - Invalidation

### Forms & Validation
- **React Hook Form** - Form management
  - Uncontrolled components
  - Validation
  - Error handling

- **Zod** - Schema validation
  - Type inference
  - Runtime validation
  - Error messages

### Utilities
- **date-fns** - Date manipulation
  - Formatting
  - Parsing
  - Calculations
  - Timezones

- **clsx** - Conditional classes
- **tailwind-merge** - Merge Tailwind classes
- **lucide-react** - Icon library (500+ icons)
- **sonner** - Toast notifications

---

## 🔧 Backend Stack

### API Layer
- **tRPC 10.x** - Type-safe API
  - Procedures (queries & mutations)
  - Middleware
  - Context
  - Error handling
  - Batching

### Database
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Storage
  - Edge Functions

- **@supabase/supabase-js** - Client library
- **@supabase/ssr** - Server-side rendering support

### Authentication
- **Supabase Auth** - User management
  - Email/password
  - OAuth providers
  - Session management
  - JWT tokens
  - RLS policies

### Database Schema
```sql
-- Users (managed by Supabase Auth)
auth.users

-- Portfolios
portfolios
  - id (uuid)
  - user_id (uuid, FK)
  - name (text)
  - pnl_method (enum: FIFO, LIFO, AVG)
  - created_at (timestamp)

-- Assets
assets
  - id (serial)
  - symbol (text)
  - name (text)
  - icon_url (text)
  - current_price (numeric)
  - updated_at (timestamp)

-- Transactions
transactions
  - id (serial)
  - portfolio_id (uuid, FK)
  - asset_id (integer, FK)
  - type (enum: buy, sell, transfer_in, transfer_out)
  - quantity (numeric)
  - price (numeric)
  - fee (numeric)
  - timestamp (timestamp)

-- Positions (calculated view)
positions
  - portfolio_id
  - asset_id
  - quantity
  - avg_price
  - current_value
  - unrealized_pnl
  - roi
```

---

## 🧮 Business Logic

### PnL Engine (@crypto-pnl/pnl-engine)
- **FIFO (First In, First Out)**
  - Queue-based lot tracking
  - Cost basis calculation
  - Realized gains

- **LIFO (Last In, First Out)**
  - Stack-based lot tracking
  - Tax optimization
  - Recent cost basis

- **Average Cost**
  - Weighted average
  - Simple calculation
  - Popular method

### Calculations
- Portfolio value
- Unrealized P&L
- Realized P&L
- ROI (Return on Investment)
- Cost basis
- Capital gains (short/long term)
- Fee tracking

---

## 🧪 Testing

### E2E Testing
- **Playwright** - Browser automation
  - 37 test cases
  - Cross-browser (Chromium, Firefox, WebKit)
  - Mobile testing (Pixel 5, iPhone 12)
  - Screenshots on failure
  - Video recording
  - Trace viewer

### Test Coverage
- Portfolio CRUD operations
- Transaction management
- Bulk operations
- Search & filters
- Analytics
- Navigation
- Keyboard shortcuts
- Responsive design

---

## 🚀 Deployment

### Hosting
- **Vercel** - Serverless deployment
  - Edge Network
  - Automatic HTTPS
  - Preview deployments
  - Analytics
  - Environment variables

### CI/CD
- **GitHub Actions** (potential)
  - Automated tests
  - Linting
  - Type checking
  - Build verification

### Environments
- **Development** - Local (localhost:3001)
- **Staging** - Vercel preview
- **Production** - Vercel production

### Database Environments
- **DEV**: https://mabkfometbozulapznak.supabase.co
- **PROD**: https://ypwwjsvwmwoksmtyqgjy.supabase.co

---

## 📦 Package Manager

### pnpm
- Fast, disk space efficient
- Strict dependency resolution
- Workspace support
- Lockfile version 9

### Scripts
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

---

## 🔐 Security

### Authentication
- JWT tokens
- HTTP-only cookies
- CSRF protection
- Session management

### Database
- Row Level Security (RLS)
- Prepared statements
- Input validation
- SQL injection prevention

### API
- Type validation (Zod)
- Rate limiting (potential)
- CORS configuration
- Error sanitization

---

## 📊 Performance

### Optimizations
- Server Components (RSC)
- Lazy loading images
- Code splitting
- Tree shaking
- Debounced search
- Skeleton loaders
- React Query caching

### Monitoring
- Vercel Analytics
- Web Vitals
- Error tracking (potential: Sentry)

---

## 🛠️ Development Tools

### Code Quality
- **ESLint** - Linting
  - Next.js rules
  - React hooks rules
  - TypeScript rules

- **Prettier** - Code formatting
- **TypeScript** - Type checking

### IDE
- VS Code recommended
- Extensions:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript

---

## 📱 Browser Support

### Desktop
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

### Mobile
- iOS Safari (latest)
- Chrome Android (latest)

---

## 🔄 Version Control

### Git
- **Main branch** - Production
- **Develop branch** - Development
- **Staging branch** - Testing

### Commit Convention
- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Code restructuring
- test: Testing
- chore: Maintenance

---

## 📈 Scalability

### Current Limits
- Unlimited portfolios per user
- Unlimited transactions
- Real-time price updates
- 7-day history for sparklines

### Future Scaling
- Redis caching
- CDN for assets
- Database indexing
- Query optimization
- Horizontal scaling

---

## 🔮 Future Tech Additions

### Planned
- Stripe integration (payments)
- Email service (SendGrid/Resend)
- PDF generation (jsPDF)
- CSV export (Papa Parse)
- WebSocket (real-time prices)
- Push notifications (FCM)
- Mobile app (React Native)

---

## 📚 Documentation

### Available Docs
- README.md - Project overview
- TECH_STACK.md - This file
- FEATURES.md - Feature documentation
- API.md - API documentation
- DEPLOYMENT.md - Deployment guide

---

## 🤝 Contributing

### Setup
```bash
# Clone repository
git clone https://github.com/dimlim/pnl_tracker.git

# Install dependencies
pnpm install

# Setup environment variables
cp .env.example .env.local

# Run development server
pnpm dev
```

### Environment Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

---

## 📄 License

MIT License - See LICENSE file

---

**Last Updated:** October 16, 2025  
**Version:** 1.0.0  
**Maintainer:** Crypto PnL Team
