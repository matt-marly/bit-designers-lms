ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read tracks"
  ON tracks FOR SELECT
  USING (auth.role() = 'authenticated');
