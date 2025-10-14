-- Users: using auth.users (Supabase built-in)

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
  o numeric(38,10),
  h numeric(38,10),
  l numeric(38,10),
  c numeric(38,10),
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

-- Enable RLS
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

-- RLS Policies: owner-only access
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

-- Indexes for performance
create index idx_portfolios_user on public.portfolios(user_id);
create index idx_positions_portfolio on public.portfolio_positions(portfolio_id);
create index idx_transactions_portfolio on public.transactions(portfolio_id);
create index idx_transactions_timestamp on public.transactions(timestamp);
create index idx_price_ticks_asset_ts on public.price_ticks(asset_id, ts desc);
create index idx_alerts_user on public.alerts(user_id);
