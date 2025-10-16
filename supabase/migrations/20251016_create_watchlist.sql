-- Create watchlist table for user's favorite cryptocurrencies
CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_user_asset UNIQUE(user_id, asset_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_asset_id ON watchlist(asset_id);

-- Enable Row Level Security
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

-- Comments
COMMENT ON TABLE watchlist IS 'User watchlist for tracking favorite cryptocurrencies';
COMMENT ON COLUMN watchlist.user_id IS 'Reference to auth.users';
COMMENT ON COLUMN watchlist.asset_id IS 'CoinGecko asset ID (e.g., bitcoin, ethereum)';
