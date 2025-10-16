# API Documentation - Crypto PnL Tracker

## 📋 Overview

API побудовано на tRPC для type-safe communication між frontend та backend.

---

## 🔧 tRPC Router Structure

```typescript
appRouter
├── auth          # Authentication
├── portfolios    # Portfolio management
├── transactions  # Transaction operations
├── assets        # Asset data
├── positions     # Portfolio positions
└── dashboard     # Dashboard data
```

---

## 🔐 Authentication

### Context
Кожен request має доступ до:
```typescript
{
  supabase: SupabaseClient,
  user: User | null,
  session: Session | null
}
```

### Protected Procedures
Використовують middleware для перевірки авторизації:
```typescript
.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({ ctx: { ...ctx, user: ctx.user } })
})
```

---

## 💼 Portfolios API

### `portfolios.list`
Отримати всі портфелі користувача.

**Type:** Query  
**Auth:** Required  
**Input:** None  
**Output:**
```typescript
{
  id: string
  name: string
  pnl_method: 'fifo' | 'lifo' | 'avg'
  created_at: string
  user_id: string
}[]
```

### `portfolios.listWithStats`
Отримати портфелі зі статистикою.

**Type:** Query  
**Auth:** Required  
**Input:** None  
**Output:**
```typescript
{
  id: string
  name: string
  pnl_method: string
  totalValue: number
  totalCost: number
  totalPnL: number
  roi: number
  dayChange: number
  assetCount: number
  transactionCount: number
  positions: Position[]
}[]
```

### `portfolios.getById`
Отримати портфель за ID.

**Type:** Query  
**Auth:** Required  
**Input:**
```typescript
{
  id: string
}
```
**Output:**
```typescript
{
  id: string
  name: string
  pnl_method: string
  created_at: string
  // ... stats
}
```

### `portfolios.create`
Створити новий портфель.

**Type:** Mutation  
**Auth:** Required  
**Input:**
```typescript
{
  name: string
  pnl_method: 'fifo' | 'lifo' | 'avg'
}
```
**Output:**
```typescript
{
  id: string
  name: string
  pnl_method: string
  created_at: string
  user_id: string
}
```

### `portfolios.update`
Оновити портфель.

**Type:** Mutation  
**Auth:** Required  
**Input:**
```typescript
{
  id: string
  name?: string
  pnl_method?: 'fifo' | 'lifo' | 'avg'
}
```
**Output:**
```typescript
{
  id: string
  name: string
  pnl_method: string
  // ...
}
```

### `portfolios.delete`
Видалити портфель.

**Type:** Mutation  
**Auth:** Required  
**Input:**
```typescript
{
  id: string
}
```
**Output:**
```typescript
{
  success: boolean
}
```

### `portfolios.duplicate`
Дублювати портфель.

**Type:** Mutation  
**Auth:** Required  
**Input:**
```typescript
{
  id: string
}
```
**Output:**
```typescript
{
  id: string
  name: string // "Portfolio Name Copy"
  pnl_method: string
  // ...
}
```

### `portfolios.getHistory`
Отримати історію портфеля.

**Type:** Query  
**Auth:** Required  
**Input:**
```typescript
{
  portfolioId: string
  days: number // 7, 30, 90, etc
  interval: 'daily' | 'hourly'
}
```
**Output:**
```typescript
{
  date: string
  totalValue: number
  totalCost: number
  pnl: number
  roi: number
}[]
```

---

## 💸 Transactions API

### `transactions.listAll`
Отримати всі транзакції користувача.

**Type:** Query  
**Auth:** Required  
**Input:** None  
**Output:**
```typescript
{
  id: number
  portfolio_id: string
  asset_id: number
  type: TransactionType
  quantity: number
  price: number
  fee: number
  timestamp: string
  assets: {
    symbol: string
    name: string
    icon_url: string
    current_price: number
  }
  portfolios: {
    name: string
  }
}[]
```

### `transactions.listByPortfolio`
Отримати транзакції портфеля.

**Type:** Query  
**Auth:** Required  
**Input:**
```typescript
{
  portfolioId: string
}
```
**Output:** Same as `listAll`

### `transactions.create`
Створити транзакцію.

**Type:** Mutation  
**Auth:** Required  
**Input:**
```typescript
{
  portfolio_id: string
  asset_id: number
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out' | 'deposit' | 'withdraw' | 'airdrop'
  quantity: number
  price: number
  fee?: number
  timestamp: string
}
```
**Output:**
```typescript
{
  id: number
  // ... all fields
}
```

### `transactions.update`
Оновити транзакцію.

**Type:** Mutation  
**Auth:** Required  
**Input:**
```typescript
{
  id: number
  quantity?: number
  price?: number
  fee?: number
  timestamp?: string
}
```
**Output:** Updated transaction

### `transactions.delete`
Видалити транзакцію.

**Type:** Mutation  
**Auth:** Required  
**Input:**
```typescript
{
  id: number
}
```
**Output:**
```typescript
{
  success: boolean
}
```

### `transactions.bulkDelete`
Видалити кілька транзакцій.

**Type:** Mutation  
**Auth:** Required  
**Input:**
```typescript
{
  ids: number[]
}
```
**Output:**
```typescript
{
  count: number
}
```

### `transactions.bulkMove`
Перемістити транзакції в інший портфель.

**Type:** Mutation  
**Auth:** Required  
**Input:**
```typescript
{
  transactionIds: number[]
  targetPortfolioId: string
}
```
**Output:**
```typescript
{
  count: number
}
```

---

## 🪙 Assets API

### `assets.list`
Отримати всі assets.

**Type:** Query  
**Auth:** Optional  
**Input:** None  
**Output:**
```typescript
{
  id: number
  symbol: string
  name: string
  icon_url: string
  current_price: number
  updated_at: string
}[]
```

### `assets.search`
Пошук assets.

**Type:** Query  
**Auth:** Optional  
**Input:**
```typescript
{
  query: string
}
```
**Output:** Same as `list`

### `assets.getById`
Отримати asset за ID.

**Type:** Query  
**Auth:** Optional  
**Input:**
```typescript
{
  id: number
}
```
**Output:**
```typescript
{
  id: number
  symbol: string
  name: string
  icon_url: string
  current_price: number
  market_cap: number
  volume_24h: number
  price_change_24h: number
}
```

---

## 📊 Positions API

### `positions.list`
Отримати всі позиції користувача.

**Type:** Query  
**Auth:** Required  
**Input:**
```typescript
{
  portfolio_id?: string // Optional filter
}
```
**Output:**
```typescript
{
  id: number
  portfolio_id: string
  asset_id: number
  quantity: number
  avg_price: number
  current_value: number
  total_cost: number
  unrealized_pnl: number
  realized_pnl: number
  roi: number
  first_purchase_date: string
  assets: {
    symbol: string
    name: string
    current_price: number
  }
}[]
```

---

## 📈 Dashboard API

### `dashboard.getStats`
Отримати загальну статистику.

**Type:** Query  
**Auth:** Required  
**Input:** None  
**Output:**
```typescript
{
  totalValue: number
  totalCost: number
  totalPnL: number
  totalROI: number
  dayChange: number
  portfolioCount: number
  assetCount: number
  transactionCount: number
}
```

### `dashboard.getPortfolioHistory`
Отримати історію всіх портфелів.

**Type:** Query  
**Auth:** Required  
**Input:**
```typescript
{
  timeframe: '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL'
  benchmark?: 'BTC' | 'ETH' | 'NONE'
  granularity?: '1h' | '1d' | '1w'
}
```
**Output:**
```typescript
{
  data: {
    t: number // timestamp
    date: string
    value: number
    invested: number
    pnl: number
    realized: number
    unrealized: number
    pnlPercent: number
  }[]
  granularity: string
  benchmark?: string
}
```

### `dashboard.getTopPerformers`
Отримати топ assets за ROI.

**Type:** Query  
**Auth:** Required  
**Input:**
```typescript
{
  limit?: number // default 5
}
```
**Output:**
```typescript
{
  asset_id: number
  symbol: string
  name: string
  roi: number
  pnl: number
  current_value: number
}[]
```

---

## 🔄 Error Handling

### Error Codes
```typescript
'UNAUTHORIZED'      // Not authenticated
'FORBIDDEN'         // Not authorized
'NOT_FOUND'         // Resource not found
'BAD_REQUEST'       // Invalid input
'INTERNAL_SERVER_ERROR' // Server error
'CONFLICT'          // Resource conflict
```

### Error Response
```typescript
{
  code: string
  message: string
  data?: {
    zodError?: ZodError // Validation errors
  }
}
```

### Example Error
```typescript
{
  code: 'BAD_REQUEST',
  message: 'Invalid portfolio ID',
  data: {
    zodError: {
      issues: [{
        path: ['id'],
        message: 'Invalid UUID'
      }]
    }
  }
}
```

---

## 🎯 Input Validation

### Zod Schemas

#### Portfolio Input
```typescript
z.object({
  name: z.string().min(1).max(100),
  pnl_method: z.enum(['fifo', 'lifo', 'avg'])
})
```

#### Transaction Input
```typescript
z.object({
  portfolio_id: z.string().uuid(),
  asset_id: z.number().int().positive(),
  type: z.enum(['buy', 'sell', 'transfer_in', 'transfer_out', 'deposit', 'withdraw', 'airdrop']),
  quantity: z.number().positive(),
  price: z.number().nonnegative(),
  fee: z.number().nonnegative().optional(),
  timestamp: z.string().datetime()
})
```

---

## 🚀 Usage Examples

### React Query Hook
```typescript
// Query
const { data, isLoading, error } = trpc.portfolios.list.useQuery()

// Mutation
const createPortfolio = trpc.portfolios.create.useMutation({
  onSuccess: () => {
    utils.portfolios.list.invalidate()
  }
})

// Call mutation
createPortfolio.mutate({
  name: 'My Portfolio',
  pnl_method: 'fifo'
})
```

### Optimistic Updates
```typescript
const updatePortfolio = trpc.portfolios.update.useMutation({
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await utils.portfolios.list.cancel()
    
    // Snapshot previous value
    const previous = utils.portfolios.list.getData()
    
    // Optimistically update
    utils.portfolios.list.setData(undefined, (old) => 
      old?.map(p => p.id === newData.id ? { ...p, ...newData } : p)
    )
    
    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    utils.portfolios.list.setData(undefined, context?.previous)
  },
  onSettled: () => {
    // Refetch after error or success
    utils.portfolios.list.invalidate()
  }
})
```

### Batching
```typescript
// Multiple queries batched into single HTTP request
const [portfolios, transactions, assets] = await Promise.all([
  trpc.portfolios.list.query(),
  trpc.transactions.listAll.query(),
  trpc.assets.list.query()
])
```

---

## 📊 Rate Limiting

### Current Limits
- No rate limiting implemented
- Relies on Supabase limits

### Future Implementation
- Per-user rate limiting
- Per-endpoint limits
- Redis-based tracking

---

## 🔐 Security

### RLS Policies
All queries filtered by `user_id`:
```sql
CREATE POLICY "Users can only access their own data"
ON portfolios FOR ALL
USING (auth.uid() = user_id);
```

### Input Sanitization
- Zod validation
- SQL injection prevention
- XSS protection

---

## 📚 Additional Resources

- [tRPC Documentation](https://trpc.io)
- [React Query Documentation](https://tanstack.com/query)
- [Zod Documentation](https://zod.dev)

---

**Last Updated:** October 16, 2025  
**API Version:** 1.0.0
