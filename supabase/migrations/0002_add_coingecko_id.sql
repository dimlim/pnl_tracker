-- Add coingecko_id column to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS coingecko_id TEXT;

-- Update existing assets with CoinGecko IDs
UPDATE assets SET coingecko_id = 'bitcoin' WHERE symbol = 'BTC';
UPDATE assets SET coingecko_id = 'ethereum' WHERE symbol = 'ETH';
UPDATE assets SET coingecko_id = 'tether' WHERE symbol = 'USDT';
UPDATE assets SET coingecko_id = 'binancecoin' WHERE symbol = 'BNB';
UPDATE assets SET coingecko_id = 'solana' WHERE symbol = 'SOL';
UPDATE assets SET coingecko_id = 'ripple' WHERE symbol = 'XRP';
UPDATE assets SET coingecko_id = 'usd-coin' WHERE symbol = 'USDC';
UPDATE assets SET coingecko_id = 'cardano' WHERE symbol = 'ADA';
UPDATE assets SET coingecko_id = 'dogecoin' WHERE symbol = 'DOGE';
UPDATE assets SET coingecko_id = 'tron' WHERE symbol = 'TRX';

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assets_coingecko_id ON assets(coingecko_id);
