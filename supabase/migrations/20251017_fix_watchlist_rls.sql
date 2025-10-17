-- Fix watchlist RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can add to their watchlist" ON watchlist;
DROP POLICY IF EXISTS "Users can remove from their watchlist" ON watchlist;

-- Create new policies with better error handling
CREATE POLICY "Users can view their own watchlist"
  ON watchlist FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their watchlist"
  ON watchlist FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their watchlist"
  ON watchlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Also allow UPDATE in case we need it later
CREATE POLICY "Users can update their watchlist"
  ON watchlist FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
