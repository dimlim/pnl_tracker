# Репозиторій: `crypto-pnl-tracker`

Монорепо під Vercel + Supabase з веб‑апкою (Next.js 15, App Router), каркасом мобільного клієнта (Expo), tRPC, i18n, Edge Functions, SQL‑схемами, RLS‑політиками, шифруванням ключів і базовим PnL‑движком з тестами. Орієнтовано на розробку в Cursor AI.

---

## 0) Структура папок
```
crypto-pnl-tracker/
├─ apps/
│  ├─ web/                # Next.js 15 (App Router)
│  └─ mobile/             # Expo (React Native)
├─ packages/
│  ├─ ui/                 # Спільні UI-компоненти
│  ├─ trpc/               # Сервер/клієнт tRPC
│  ├─ types/              # Spacers для типів TS
│  └─ config/             # ESLint/TS/Jest/Vitest конфіги
├─ supabase/
│  ├─ migrations/         # SQL-міграції (RLS/policies у файлах)
│  ├─ seeds/
│  └─ functions/          # Edge Functions (alerts, price-cache)
├─ .github/workflows/     # CI/CD
├─ vercel.json            # Маршрути/edge/headers
├─ turbo.json             # Таски для монорепо
├─ package.json           # Кореневі скрипти
├─ .env.example           # Базові змінні середовища
└─ README.md              # Інструкції
```

---

## 1) Кореневі файли

### `package.json`
```json
{
  "name": "crypto-pnl-tracker",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "db:migrate": "supabase db reset --db-url $SUPABASE_DB_URL && supabase db push",
    "db:seed": "node supabase/seeds/seed.mjs"
  },
  "devDependencies": {
    "turbo": "^2.1.0",
    "typescript": "^5.6.3",
    "eslint": "^9.9.0",
    "prettier": "^3.3.3",
    "vitest": "^2.0.5"
  },
  "workspaces": ["apps/*", "packages/*"]
}
```

### `turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "dev": { "cache": false },
    "lint": {},
    "test": { "dependsOn": ["^build"], "outputs": ["coverage/**"] }
  }
}
```

### `vercel.json`
```json
{
  "functions": {
    "apps/web/app/api/**/*.ts": { "runtime": "edge" }
  },
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/apps/web/app/api/$1" }
  ],
  "headers": [
    { "source": "/(.*)", "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "geolocation=()" }
    ]}
  ]
}
```

### `.env.example`
```
# Загальні
NEXT_PUBLIC_APP_NAME=Crypto PnL
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_FALLBACK_MARKET_PROVIDER=coingecko

# Supabase (per-env у Vercel Env Groups)
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# Encryption (master key — 32 байти base64)
ENCRYPTION_MASTER_KEY_B64=

# Push Web VAPID
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# Providers (дефолтні обмежені ключі або пусто)
COINGECKO_API_KEY=
COINMARKETCAP_API_KEY=
OPENAI_API_KEY=

# Ads
NEXT_PUBLIC_GAM_NETWORK_CODE=
NEXT_PUBLIC_ADS_ENABLED=true
```

---

## 2) Supabase: схема, RLS, політики

### `supabase/migrations/0001_init.sql`
```sql
-- Users: використовуємо auth.users (Supabase)

create table public.assets (
  id bigserial primary key,
  slug text unique not null,
  symbol text not null,
  name text not null,
  icon_url text
);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  base_currency text not null default 'USD',
  pnl_method text not null check (pnl_method in ('fifo','lifo','avg')),
  include_fees boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.portfolio_positions (
  id bigserial primary key,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  asset_id bigint not null references public.assets(id),
  quantity_total numeric(38,18) not null default 0,
  avg_entry_price numeric(38,10) not null default 0,
  realized_pnl numeric(38,10) not null default 0,
  unique (portfolio_id, asset_id)
);

create type tx_type as enum ('buy','sell','transfer_in','transfer_out','deposit','withdraw','airdrop');

create table public.transactions (
  id bigserial primary key,
  portfolio_id uuid not null references public.portfolios(id) on delete cascade,
  asset_id bigint not null references public.assets(id),
  type tx_type not null,
  quantity numeric(38,18) not null,
  price numeric(38,10) not null,
  fee numeric(38,10) default 0,
  timestamp timestamptz not null,
  note text,
  tx_hash text
);

create table public.price_ticks (
  id bigserial primary key,
  asset_id bigint not null references public.assets(id),
  source text not null,
  ts timestamptz not null,
  price numeric(38,10) not null,
  o numeric(38,10), h numeric(38,10), l numeric(38,10), c numeric(38,10),
  volume numeric(38,10)
);

create table public.alerts (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id bigint references public.assets(id),
  portfolio_id uuid references public.portfolios(id) on delete cascade,
  type text not null check (type in ('price_above','price_below','change_pct')),
  params jsonb not null,
  channel text not null check (channel in ('push','email')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.ai_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text,
  created_at timestamptz not null default now()
);

create table public.ai_messages (
  id bigserial primary key,
  thread_id uuid not null references public.ai_threads(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  tokens_used int default 0,
  ts timestamptz not null default now()
);

create table public.user_keys (
  id bigserial primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('cmc','coingecko','openai','binance','coinbase','kraken','kucoin','bingx')),
  key_ciphertext text not null,
  dek_wrapped text not null,
  created_at timestamptz not null default now()
);

create table public.quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cmc_daily_credits int default 2000,
  ai_daily_tokens int default 10000,
  period_start date default current_date,
  period_end date default current_date
);

create table public.consents (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade,
  region text,
  ad_personalization boolean,
  ts timestamptz not null default now()
);

create table public.ad_impressions (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  placement text not null,
  meta jsonb,
  ts timestamptz not null default now()
);

-- RLS
alter table public.portfolios enable row level security;
alter table public.portfolio_positions enable row level security;
alter table public.transactions enable row level security;
alter table public.alerts enable row level security;
alter table public.ai_threads enable row level security;
alter table public.ai_messages enable row level security;
alter table public.user_keys enable row level security;
alter table public.quotas enable row level security;
alter table public.consents enable row level security;
alter table public.ad_impressions enable row level security;

-- Політики: доступ тільки власнику
create policy "own_portfolios" on public.portfolios
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own_positions" on public.portfolio_positions
for all using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()))
with check (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()));

create policy "own_transactions" on public.transactions
for all using (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()))
with check (exists (select 1 from public.portfolios p where p.id = portfolio_id and p.user_id = auth.uid()));

create policy "own_alerts" on public.alerts
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_ai_threads" on public.ai_threads
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_ai_messages" on public.ai_messages
for all using (exists (select 1 from public.ai_threads t where t.id = thread_id and t.user_id = auth.uid()))
with check (exists (select 1 from public.ai_threads t where t.id = thread_id and t.user_id = auth.uid()));

create policy "own_user_keys" on public.user_keys
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_quotas" on public.quotas
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_consents" on public.consents
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own_ad_impressions" on public.ad_impressions
for select using (user_id = auth.uid() or user_id is null);
```

### `supabase/seeds/seed.mjs`
```js
import { createClient } from '@supabase/supabase-js'
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(url, key)

async function run(){
  // простий сид активів
  const assets = [
    { slug:'bitcoin', symbol:'BTC', name:'Bitcoin' },
    { slug:'ethereum', symbol:'ETH', name:'Ethereum' }
  ]
  for (const a of assets){
    await supabase.from('assets').upsert(a, { onConflict: 'slug' })
  }
  console.log('Seed done')
}
run()
```

---

## 3) Edge Functions (Supabase)

### `supabase/functions/alerts/index.ts`
```ts
// Псевдокод: проходить активні алерти, звіряє з цінами, шле пуши/email
export const onSchedule = async () => {
  // 1) зчитати активні алерти
  // 2) отримати останню ціну з кеша/провайдера
  // 3) якщо тригер — створити повідомлення у черзі пушів
}
```

### `supabase/functions/price-cache/index.ts`
```ts
// Псевдокод: періодично оновлює топ-100 у локальному кеші price_ticks
export const onSchedule = async () => {
  // 1) отримати список топ-100 з провайдера
  // 2) upsert у таблицю price_ticks
}
```

---

## 4) apps/web — Next.js

### `apps/web/package.json`
```json
{
  "name": "web",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest"
  },
  "dependencies": {
    "next": "15.0.0",
    "react": "19.0.0-rc-20240905",
    "react-dom": "19.0.0-rc-20240905",
    "@supabase/supabase-js": "^2.45.0",
    "@trpc/server": "^11.0.0",
    "@trpc/client": "^11.0.0",
    "zod": "^3.23.8",
    "tailwindcss": "^3.4.10",
    "class-variance-authority": "^0.7.0",
    "framer-motion": "^11.3.8",
    "recharts": "^2.12.7",
    "next-intl": "^3.16.0"
  }
}
```

### `apps/web/app/layout.tsx`
```tsx
import './globals.css'
import { NextIntlClientProvider } from 'next-intl'
export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
```

### `apps/web/app/page.tsx`
```tsx
export default function Home(){
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Crypto PnL</h1>
      <p>Welcome. Go to /auth or /dashboard</p>
    </main>
  )
}
```

### `apps/web/app/(auth)/login/page.tsx`
```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
export default function Login(){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const onSubmit = async (e:any)=>{ e.preventDefault(); await supabase.auth.signInWithPassword({email,password}) }
  return (
    <form onSubmit={onSubmit} className="max-w-sm p-6 space-y-3">
      <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="input" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button className="btn">Login</button>
    </form>
  )
}
```

### `apps/web/app/dashboard/page.tsx`
```tsx
export default function Dashboard(){
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      {/* TODO: KPI, графіки, список активів */}
    </div>
  )
}
```

### `apps/web/app/api/ai/analyze/route.ts`
```ts
import { NextRequest } from 'next/server'
export const runtime = 'edge'
export async function POST(req: NextRequest){
  // SSE stream заглушка
  return new Response('event: message\ndata: {"status":"ok"}\n\n', {
    headers: { 'Content-Type': 'text/event-stream' }
  })
}
```

### `apps/web/app/api/keys/route.ts`
```ts
import { NextRequest } from 'next/server'
import { encryptForUser } from '../../../lib/crypto'
export const runtime = 'edge'
export async function POST(req: NextRequest){
  const { provider, key } = await req.json()
  // TODO: перевірка сесії користувача (middleware)
  const { ciphertext, wrapped } = await encryptForUser(key)
  // TODO: зберегти у public.user_keys
  return Response.json({ ok:true })
}
```

### `apps/web/app/lib/crypto.ts`
```ts
// Простий AES-GCM з master key (32 байти), обгортання DEK
const enc = new TextEncoder();
const dec = new TextDecoder();

async function importKey(raw: ArrayBuffer){
  return await crypto.subtle.importKey('raw', raw, 'AES-GCM', true, ['encrypt','decrypt'])
}

function b64ToArrayBuffer(b64:string){
  const bin = Buffer.from(b64, 'base64');
  return bin.buffer.slice(bin.byteOffset, bin.byteLength + bin.byteOffset)
}

export async function encryptForUser(plaintext: string){
  // 1) Генеруємо DEK
  const dekRaw = crypto.getRandomValues(new Uint8Array(32))
  const dek = await importKey(dekRaw.buffer)
  // 2) Шифруємо дані
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dek, enc.encode(plaintext))
  // 3) Обгортаємо DEK master-ключем
  const masterRaw = b64ToArrayBuffer(process.env.ENCRYPTION_MASTER_KEY_B64!)
  const master = await importKey(masterRaw)
  const iv2 = crypto.getRandomValues(new Uint8Array(12))
  const wrapped = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv2 }, master, dekRaw)
  return {
    ciphertext: Buffer.from(iv).toString('base64') + '.' + Buffer.from(ct).toString('base64'),
    wrapped: Buffer.from(iv2).toString('base64') + '.' + Buffer.from(wrapped).toString('base64')
  }
}

export async function decryptForUser(ciphertext: string, wrapped: string){
  const [ivB64, ctB64] = ciphertext.split('.')
  const [iv2B64, wrapB64] = wrapped.split('.')
  const masterRaw = b64ToArrayBuffer(process.env.ENCRYPTION_MASTER_KEY_B64!)
  const master = await importKey(masterRaw)
  const dekRaw = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(iv2B64,'base64') }, master, Buffer.from(wrapB64,'base64'))
  const dek = await importKey(dekRaw)
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(ivB64,'base64') }, dek, Buffer.from(ctB64,'base64'))
  return new TextDecoder().decode(pt)
}
```

### `apps/web/tailwind.config.ts`
```ts
import type { Config } from 'tailwindcss'
export default {
  content: ["./app/**/*.{ts,tsx}", "../../packages/ui/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: []
} satisfies Config
```

### `apps/web/app/globals.css`
```css
@tailwind base; @tailwind components; @tailwind utilities;
.input{ @apply border p-2 rounded w-full; }
.btn{ @apply bg-black text-white px-4 py-2 rounded; }
```

---

## 5) packages/trpc — базовий роутер

### `packages/trpc/src/router.ts`
```ts
import { initTRPC } from '@trpc/server'
import { z } from 'zod'
const t = initTRPC.create()
export const appRouter = t.router({
  health: t.procedure.query(() => ({ ok:true })),
  addPortfolio: t.procedure.input(z.object({ name:z.string(), base:z.string().default('USD'), method:z.enum(['fifo','lifo','avg']), includeFees:z.boolean().default(true) })).mutation(async({ input })=>{
    // TODO: вставка у supabase через service
    return { id: 'uuid' }
  })
})
export type AppRouter = typeof appRouter
```

---

## 6) PnL‑движок (чернетка) + тести

### `packages/types/src/index.ts`
```ts
export type Tx = { type:'buy'|'sell'|'transfer_in'|'transfer_out'|'deposit'|'withdraw'|'airdrop', qty:number, price:number, fee?:number, ts:number }
export type Lot = { qty:number, price:number }
export type Method = 'fifo'|'lifo'|'avg'
```

### `packages/ui/src/pnl.ts`
```ts
import type { Tx, Lot, Method } from '@types'

export function computePnL(txs: Tx[], method: Method, includeFees=true){
  const lots: Lot[] = []
  let realized = 0
  for(const tx of txs.sort((a,b)=>a.ts-b.ts)){
    const fee = includeFees ? (tx.fee||0) : 0
    if(tx.type==='buy' || tx.type==='transfer_in' || tx.type==='airdrop'){
      lots.push({ qty: tx.qty, price: (tx.price*tx.qty + fee)/tx.qty })
    }
    if(tx.type==='sell' || tx.type==='transfer_out'){
      let remain = tx.qty
      const take = method==='lifo' ? () => lots.pop() : () => lots.shift()
      while(remain>0 && lots.length){
        const l = method==='avg' ? avgCollapse(lots) : take()!
        const takeQty = Math.min(remain, l.qty)
        realized += (tx.price - l.price) * takeQty - (fee * (takeQty/tx.qty))
        const left = l.qty - takeQty
        if(method!=='avg'){
          if(left>0) lots.unshift({ qty:left, price:l.price })
        }
        remain -= takeQty
      }
    }
  }
  const quantity = lots.reduce((s,l)=>s+l.qty,0)
  const avg = quantity? lots.reduce((s,l)=>s+l.qty*l.price,0)/quantity : 0
  return { realized, quantity, avg }
}

function avgCollapse(lots: Lot[]): Lot{
  const qty = lots.reduce((s,l)=>s+l.qty,0)
  const price = qty? lots.reduce((s,l)=>s+l.qty*l.price,0)/qty : 0
  lots.length = 0
  return { qty, price }
}
```

### `packages/ui/test/pnl.test.ts`
```ts
import { describe, it, expect } from 'vitest'
import { computePnL } from '../src/pnl'

describe('PnL engine', ()=>{
  it('FIFO with fees', ()=>{
    const out = computePnL([
      { type:'buy', qty:1, price:100, ts:1, fee:1 },
      { type:'sell', qty:1, price:120, ts:2, fee:1 }
    ], 'fifo', true)
    expect(out.realized).toBeCloseTo(18) // (120-101) - 1
  })
})
```

---

## 7) CI/CD — GitHub Actions

### `.github/workflows/ci.yml`
```yaml
name: CI
on: [push, pull_request]
jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test
  preview-db:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Apply Supabase migrations (preview)
        env:
          SUPABASE_DB_URL: ${{ secrets.PREVIEW_SUPABASE_DB_URL }}
        run: |
          npx supabase@latest db push --db-url $SUPABASE_DB_URL
```

### `.github/workflows/deploy.yml`
```yaml
name: Deploy
on:
  push:
    branches: [ main, develop ]
jobs:
  migrate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Migrate DB
        env:
          SUPABASE_DB_URL: ${{ secrets.PROD_SUPABASE_DB_URL }}
        if: github.ref == 'refs/heads/main'
        run: npx supabase@latest db push --db-url $SUPABASE_DB_URL
      - name: Migrate Staging DB
        env:
          SUPABASE_DB_URL: ${{ secrets.STAGING_SUPABASE_DB_URL }}
        if: github.ref == 'refs/heads/develop'
        run: npx supabase@latest db push --db-url $SUPABASE_DB_URL
      - name: Trigger Vercel Deploy
        run: |
          echo "Deploy is triggered by Vercel Git Integration"
```

---

## 8) README.md (скорочено)

### Локальний запуск
1. `pnpm i`
2. Скопіюйте `.env.example` → `.env.local` у `apps/web` і корені; заповніть Supabase URL/keys, ENCRYPTION_MASTER_KEY_B64 (32 байти).
3. `pnpm dev` — веб на `localhost:3000`.

### Міграції
- `npx supabase db push` — застосувати схему.
- `pnpm db:seed` — базові записи активів.

### Середовища
- **main → Production** (окремий Supabase project + Vercel Env Group)
- **develop → Staging** (окремий Supabase project)
- **PR → Preview** (окремий project або schema namespace), auto‑migrate via CI.

### Безпека
- Ключі користувачів: зберігаються у `user_keys` як `key_ciphertext` + `dek_wrapped`. Дешифрування — тільки на сервері.

---

## 9) Далі
- Додати реальну авторизацію (middleware) для API‑роутів.
- Підключити CoinGecko/CMC провайдер з кешем у `price_ticks`.
- Реалізувати UI: дашборд, портфелі, транзакції, графіки з маркерами.
- Додати Web Push (VAPID) і Expo push (мобайл).
- Інтегрувати Google OAuth, 2FA, CMP для реклами.
```

