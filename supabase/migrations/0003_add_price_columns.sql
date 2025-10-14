-- Add price-related columns to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS current_price DECIMAL(20, 8) DEFAULT 0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS price_change_24h DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS market_cap BIGINT DEFAULT 0;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_current_price ON assets(current_price);
CREATE INDEX IF NOT EXISTS idx_assets_last_updated ON assets(last_updated);
