// Transaction types
export type TxType =
  | 'buy'
  | 'sell'
  | 'transfer_in'
  | 'transfer_out'
  | 'deposit'
  | 'withdraw'
  | 'airdrop'

export type Transaction = {
  id?: number
  portfolio_id: string
  asset_id: number
  type: TxType
  quantity: number
  price: number
  fee?: number
  timestamp: Date | string
  note?: string
  tx_hash?: string
}

// PnL calculation types
export type PnLMethod = 'fifo' | 'lifo' | 'avg'

export type Lot = {
  qty: number
  price: number
}

export type PnLResult = {
  realized: number
  quantity: number
  avgPrice: number
}

// Portfolio types
export type Portfolio = {
  id: string
  user_id: string
  name: string
  base_currency: string
  pnl_method: PnLMethod
  include_fees: boolean
  created_at: Date | string
}

export type PortfolioPosition = {
  id: number
  portfolio_id: string
  asset_id: number
  quantity_total: number
  avg_entry_price: number
  realized_pnl: number
}

// Asset types
export type Asset = {
  id: number
  slug: string
  symbol: string
  name: string
  icon_url?: string
}

// Price data
export type PriceTick = {
  id: number
  asset_id: number
  source: string
  ts: Date | string
  price: number
  o?: number
  h?: number
  l?: number
  c?: number
  volume?: number
}

// Alert types
export type AlertType = 'price_above' | 'price_below' | 'change_pct'
export type AlertChannel = 'push' | 'email'

export type Alert = {
  id: number
  user_id: string
  asset_id?: number
  portfolio_id?: string
  type: AlertType
  params: Record<string, any>
  channel: AlertChannel
  active: boolean
  created_at: Date | string
}

// User keys (encrypted)
export type UserKey = {
  id: number
  user_id: string
  provider: 'cmc' | 'coingecko' | 'openai' | 'binance' | 'coinbase' | 'kraken' | 'kucoin' | 'bingx'
  key_ciphertext: string
  dek_wrapped: string
  created_at: Date | string
}

// AI types
export type AIThread = {
  id: string
  user_id: string
  title?: string
  created_at: Date | string
}

export type AIMessage = {
  id: number
  thread_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  tokens_used?: number
  ts: Date | string
}

// Quota types
export type Quota = {
  user_id: string
  cmc_daily_credits: number
  ai_daily_tokens: number
  period_start: Date | string
  period_end: Date | string
}
