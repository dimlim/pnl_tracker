# Watchlist Setup Instructions

## Problem
Getting 500 error when trying to add coins to watchlist:
```
POST /api/trpc/markets.toggleWatchlist 500 (Internal Server Error)
```

## Cause
The `watchlist` table doesn't exist in production Supabase database.

## Solution

### Option 1: Run Migration via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Production: https://supabase.com/dashboard/project/ypwwjsvwmwoksmtyqgjy
   - Or Dev: https://supabase.com/dashboard/project/mabkfometbozulapznak

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in left sidebar

3. **Run the Migration**
   - Click "New Query"
   - Copy and paste the entire content from:
     `supabase/migrations/20251016_create_watchlist.sql`
   - Click "Run" or press Cmd/Ctrl + Enter

4. **Verify**
   - Go to "Table Editor"
   - Check if `watchlist` table exists
   - Should have columns: id, user_id, asset_id, created_at

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Link to your project
supabase link --project-ref ypwwjsvwmwoksmtyqgjy

# Run migrations
supabase db push
```

### Option 3: Manual SQL (Quick Fix)

Run this SQL in Supabase SQL Editor:

```sql
-- Create watchlist table
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_asset UNIQUE(user_id, asset_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_asset_id ON watchlist(asset_id);

-- Enable RLS
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own watchlist"
  ON watchlist FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their watchlist"
  ON watchlist FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their watchlist"
  ON watchlist FOR DELETE
  USING (auth.uid() = user_id);
```

## Verification

After running the migration, test:

1. **Go to Markets page**
2. **Search for a coin** (e.g., "bitcoin")
3. **Click the star icon**
4. **Should see**: "Added to watchlist" toast
5. **Check Watchlist tab**: Coin should appear there

## Troubleshooting

### Still getting 500 error?

Check server logs in Vercel:
1. Go to Vercel Dashboard
2. Click on your deployment
3. Go to "Functions" → "Logs"
4. Look for error details

### RLS Policy Issues?

Make sure you're logged in:
- Check if `auth.uid()` returns your user ID
- Try: `SELECT auth.uid();` in SQL Editor

### Table exists but empty?

Check if policies are active:
```sql
SELECT * FROM pg_policies WHERE tablename = 'watchlist';
```

## Expected Result

After setup:
- ✅ Can add coins to watchlist
- ✅ Can remove coins from watchlist
- ✅ Watchlist persists across sessions
- ✅ Each user has their own watchlist
- ✅ RLS prevents users from seeing others' watchlists
