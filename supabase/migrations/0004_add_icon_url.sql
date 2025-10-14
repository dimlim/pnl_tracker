-- Add icon_url column to assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS icon_url TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assets_icon_url ON assets(icon_url);
