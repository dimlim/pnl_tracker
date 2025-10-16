# Markets Feature - Live Crypto Tracking

## Overview
Comprehensive markets page with live cryptocurrency prices, top gainers/losers, watchlist, and detailed asset pages.

## Features

### 1. Markets Overview Page
- **Location**: `/dashboard/markets`
- **Live Updates**: Every 60 seconds
- **Top Gainers/Losers**: 24h performance widgets
- **Full Market Table**: 100+ cryptocurrencies
- **Filters**: All, Watchlist, Holdings
- **Sorting**: Market cap, price, volume, 24h change
- **Search**: Real-time search by name/symbol

### 2. Asset Detail Page
- **Location**: `/dashboard/assets/[id]`
- **Interactive Chart**: TradingView-style with multiple timeframes
- **Statistics**: Market cap, volume, supply, ATH/ATL
- **User Holdings**: Show user's positions for this asset
- **Watchlist**: Star to add/remove from watchlist
- **Quick Add**: Add transaction directly from asset page

### 3. Watchlist
- **Database**: User-specific watchlist table
- **Toggle**: Star button on each asset
- **Filter**: View only watchlisted assets
- **Persistent**: Saved to database

## Database Schema

```sql
-- Watchlist table
CREATE TABLE watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  asset_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, asset_id)
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);

-- RLS Policies
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own watchlist"
  ON watchlist FOR ALL
  USING (auth.uid() = user_id);
```

## API Endpoints

### markets.getAll
- **Type**: Query
- **Auth**: Public
- **Refresh**: 60s
- **Returns**: Array of market data

### markets.getTopGainers
- **Type**: Query
- **Auth**: Public
- **Refresh**: 30s
- **Returns**: Top 5 gainers

### markets.getTopLosers
- **Type**: Query
- **Auth**: Public
- **Refresh**: 30s
- **Returns**: Top 5 losers

### markets.toggleWatchlist
- **Type**: Mutation
- **Auth**: Protected
- **Returns**: { added: boolean }

### assets.getDetailedInfo
- **Type**: Query
- **Auth**: Public
- **Returns**: Detailed asset information

### assets.getHistoricalPrices
- **Type**: Query
- **Auth**: Public
- **Returns**: Candlestick chart data

## Components

### TopGainersWidget
- Green gradient card
- Top 5 gainers (24h)
- Live badge
- Click to view all

### TopLosersWidget
- Red gradient card
- Top 5 losers (24h)
- Live badge
- Click to view all

### MarketsTable
- Sortable columns
- Search filter
- Tab filters (All/Watchlist/Holdings)
- Sparkline charts
- Watchlist star button
- Quick add button

### AssetDetailPage
- Header with icon, name, rank
- Current price with live updates
- Interactive price chart
- Statistics grid
- User holdings section
- Transaction history

## Data Sources

### CoinGecko API
- Free tier: 50 calls/minute
- Endpoints used:
  - `/coins/markets` - Market data
  - `/coins/{id}` - Detailed info
  - `/coins/{id}/market_chart` - Historical prices

### Caching Strategy
- Cache market data for 60s
- Cache asset details for 5 minutes
- Cache historical prices for 15 minutes
- Use React Query for client-side caching

## Implementation Notes

### Live Updates
```typescript
// Auto-refresh every 60 seconds
const { data } = trpc.markets.getAll.useQuery(input, {
  refetchInterval: 60000
})
```

### Sparklines
```typescript
// 7-day mini chart
<MiniSparkline 
  data={coin.sparkline7d}
  color={coin.priceChange7d >= 0 ? 'green' : 'red'}
/>
```

### Watchlist Toggle
```typescript
const toggleWatchlist = trpc.markets.toggleWatchlist.useMutation({
  onSuccess: () => {
    utils.markets.getAll.invalidate()
  }
})
```

## Mobile Responsive
- Horizontal scroll for table
- Stacked cards on mobile
- Touch-friendly buttons
- Optimized chart size

## Performance
- Lazy load table rows
- Debounced search (300ms)
- Virtualized list for 1000+ items
- Optimized re-renders

## Future Enhancements
- Price alerts
- Portfolio comparison
- News feed
- Social sentiment
- Advanced charts (indicators)
- Export watchlist
- Share watchlist

---

**Created**: October 16, 2025
**Status**: In Development
