# 📈 PnL Chart Feature

## Overview
Інтерактивний графік зміни вартості портфеля з фільтрами часу, gradient fills та детальними tooltips.

## Features

### ✅ Timeframe Filters
- **1D** - Last 24 hours
- **1W** - Last 7 days
- **1M** - Last month (default)
- **3M** - Last 3 months
- **1Y** - Last year
- **ALL** - All time

### ✅ Visual Features
- **Gradient Fills**: Зелений для profit, червоний для loss
- **Smooth Animations**: 500ms ease-in-out transitions
- **Reference Line**: Показує початкове значення
- **Responsive Design**: Адаптується під всі екрани

### ✅ Interactive Tooltips
Hover на графік показує:
- **Date**: Дата точки
- **Value**: Поточна вартість портфеля
- **P&L**: Profit/Loss в доларах
- **ROI**: Return on Investment у відсотках

### ✅ Stats Display
Відображає в header:
- **Current Value**: Поточна вартість портфеля
- **Total P&L**: Загальний profit/loss
- **P&L %**: ROI у відсотках
- **Trend Icon**: ↗️ для profit, ↘️ для loss

## Technical Implementation

### 1. Backend (tRPC)
**File**: `packages/trpc/src/router.ts`

```typescript
dashboard.getPortfolioHistory: protectedProcedure
  .input(z.object({
    timeframe: z.enum(['1D', '1W', '1M', '3M', '1Y', 'ALL'])
  }))
  .query(async ({ ctx, input }) => {
    // Calculate portfolio value history
    // Returns: { date, value, pnl, pnlPercent }[]
  })
```

**Logic**:
1. Отримує всі портфелі користувача
2. Розраховує date range на основі timeframe
3. Завантажує транзакції в timeframe + історичні для початкових позицій
4. Групує по днях та розраховує value/cost/pnl
5. Повертає масив точок з датою, вартістю та P&L

### 2. Frontend Component
**File**: `apps/web/src/components/charts/pnl-chart.tsx`

**Props**:
```typescript
interface PnLChartProps {
  data: PnLDataPoint[]
  isLoading?: boolean
  onTimeframeChange?: (timeframe: Timeframe) => void
  height?: number
}
```

**Key Features**:
- Uses Recharts `AreaChart` component
- Custom gradient definitions based on profit/loss
- Memoized calculations for performance
- Loading and empty states

### 3. Dashboard Integration
**File**: `apps/web/src/app/dashboard/page.tsx`

```typescript
const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1M')

const { data: portfolioHistory, isLoading: historyLoading } = 
  trpc.dashboard.getPortfolioHistory.useQuery(
    { timeframe: selectedTimeframe },
    { refetchOnWindowFocus: false }
  )

<PnLChart 
  data={portfolioHistory || []}
  isLoading={historyLoading}
  onTimeframeChange={setSelectedTimeframe}
  height={350}
/>
```

## Dependencies
- **recharts** (^3.2.1) - Charting library
- **date-fns** (^3.6.0) - Date formatting
- **framer-motion** (^11.5.4) - Animations (already in project)

## Usage Example

```tsx
import { PnLChart } from '@/components/charts/pnl-chart'

function MyDashboard() {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M')
  
  const { data, isLoading } = trpc.dashboard.getPortfolioHistory.useQuery({
    timeframe
  })

  return (
    <PnLChart 
      data={data || []}
      isLoading={isLoading}
      onTimeframeChange={setTimeframe}
      height={400}
    />
  )
}
```

## Performance Considerations

1. **Data Sampling**: Chart automatically samples large datasets to max 100 points
2. **Memoization**: Uses `useMemo` for expensive calculations
3. **Conditional Animations**: Disables animations for large datasets
4. **Lazy Loading**: Chart only loads when visible

## Future Enhancements

- [ ] Add zoom functionality
- [ ] Export chart as image
- [ ] Compare multiple portfolios
- [ ] Add volume bars
- [ ] Show transaction markers on chart
- [ ] Add custom date range picker
- [ ] Mobile swipe gestures for timeframe change

## Testing

To test the chart:
1. Create a portfolio
2. Add some transactions
3. Navigate to Dashboard
4. Chart should display with default 1M timeframe
5. Click different timeframe buttons to see data change
6. Hover over chart to see tooltips

## Troubleshooting

**Chart shows "No portfolio data"**:
- Ensure you have created at least one portfolio
- Add some transactions to the portfolio
- Check that transactions have valid timestamps

**Chart not updating**:
- Check browser console for errors
- Verify tRPC endpoint is working (check Network tab)
- Ensure user is authenticated

**Performance issues**:
- Reduce timeframe (use 1D or 1W instead of ALL)
- Check if you have too many transactions (>10,000)
- Consider implementing pagination for historical data

## Related Files

- `packages/trpc/src/router.ts` - Backend endpoint
- `apps/web/src/components/charts/pnl-chart.tsx` - Chart component
- `apps/web/src/app/dashboard/page.tsx` - Dashboard integration
- `apps/web/src/components/charts/price-chart.tsx` - Similar chart for asset prices

---

**Created**: 2025-01-15  
**Last Updated**: 2025-01-15  
**Status**: ✅ Production Ready
