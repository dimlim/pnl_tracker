# Crypto PnL Tracker

Professional cryptocurrency portfolio tracking with advanced PnL calculations, real-time updates, and beautiful analytics.

## Features

- **Advanced PnL Calculations**: FIFO, LIFO, and Average Cost methods
- **Real-time Tracking**: Live price updates and portfolio monitoring
- **Beautiful UI**: Modern dark theme with glassmorphism effects
- **Secure**: Bank-level encryption for API keys
- **Multi-Portfolio**: Manage multiple portfolios with different strategies
- **Transaction History**: Complete audit trail of all trades
- **Analytics**: Professional charts powered by TradingView technology

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: tRPC, Supabase (PostgreSQL + Auth + RLS)
- **UI**: Tailwind CSS, shadcn/ui, Framer Motion
- **Charts**: Lightweight Charts (TradingView)
- **Deployment**: Vercel
- **Monorepo**: Turborepo + pnpm

## 📦 Project Structure

```
crypto-pnl-tracker/
├── apps/
│   └── web/                 # Next.js web app
├── packages/
│   ├── types/              # Shared TypeScript types
│   ├── trpc/               # tRPC server & client
│   └── pnl-engine/         # PnL calculation engine
├── supabase/
│   ├── migrations/         # Database migrations
│   └── seeds/              # Seed data
└── .github/workflows/      # CI/CD pipelines
```

## 🏃 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase account
- Vercel account (for deployment)

### Installation

1. **Clone the repository**

```bash
git clone <your-repo-url>
cd crypto-pnl-tracker
```

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` in `apps/web/`:

```bash
cp .env.example apps/web/.env.local
```

Fill in your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Set up Supabase**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Seed database
pnpm db:seed
```

5. **Start development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧪 Testing

Run tests for the PnL engine:

```bash
pnpm test
```

## 📝 Database Schema

The app uses the following main tables:

- `portfolios` - User portfolios with PnL settings
- `transactions` - All buy/sell/transfer transactions
- `portfolio_positions` - Current positions per asset
- `assets` - Cryptocurrency asset information
- `price_ticks` - Historical price data
- `user_keys` - Encrypted API keys

All tables have Row Level Security (RLS) enabled for data protection.

## 🔐 Security

- API keys are encrypted using AES-256-GCM
- Row Level Security (RLS) on all tables
- Supabase Auth for user management
- HTTPS only in production
- Security headers configured in `vercel.json`

## 🚢 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Manual Deployment

```bash
pnpm build
pnpm start
```

## 📊 PnL Calculation Methods

### FIFO (First In, First Out)
Sells the oldest assets first. Common for tax reporting.

### LIFO (Last In, First Out)
Sells the newest assets first. Can reduce short-term gains.

### Average Cost
Uses the average purchase price. Simplest method.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Supabase](https://supabase.com/) for backend infrastructure
- [TradingView](https://www.tradingview.com/) for charting technology
- [Vercel](https://vercel.com/) for hosting

## 📧 Support

For support, email support@cryptopnl.com or open an issue on GitHub.

---

Made with ❤️ by the Crypto PnL Team
