-- Update CoinGecko IDs for existing assets
-- This ensures all assets have correct coingecko_id for portfolio holdings lookup

UPDATE assets SET coingecko_id = 'bitcoin' WHERE symbol = 'BTC' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'ethereum' WHERE symbol = 'ETH' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'tether' WHERE symbol = 'USDT' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'binancecoin' WHERE symbol = 'BNB' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'solana' WHERE symbol = 'SOL' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'ripple' WHERE symbol = 'XRP' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'usd-coin' WHERE symbol = 'USDC' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'cardano' WHERE symbol = 'ADA' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'dogecoin' WHERE symbol = 'DOGE' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'tron' WHERE symbol = 'TRX' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'polkadot' WHERE symbol = 'DOT' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'matic-network' WHERE symbol = 'MATIC' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'avalanche-2' WHERE symbol = 'AVAX' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'chainlink' WHERE symbol = 'LINK' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'uniswap' WHERE symbol = 'UNI' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'litecoin' WHERE symbol = 'LTC' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'cosmos' WHERE symbol = 'ATOM' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'monero' WHERE symbol = 'XMR' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'ethereum-classic' WHERE symbol = 'ETC' AND (coingecko_id IS NULL OR coingecko_id = '');
UPDATE assets SET coingecko_id = 'stellar' WHERE symbol = 'XLM' AND (coingecko_id IS NULL OR coingecko_id = '');

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_assets_coingecko_id ON assets(coingecko_id);

-- Add comment
COMMENT ON COLUMN assets.coingecko_id IS 'CoinGecko API ID for price tracking and market data';
