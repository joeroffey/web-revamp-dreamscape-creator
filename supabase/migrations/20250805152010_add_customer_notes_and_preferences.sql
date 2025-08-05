CREATE TABLE customer_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'regular';

CREATE INDEX idx_customer_notes_customer_id ON customer_notes(customer_id);
CREATE INDEX idx_customer_notes_created_at ON customer_notes(created_at DESC);
CREATE INDEX idx_profiles_tags ON profiles USING GIN(tags);
CREATE INDEX idx_profiles_customer_type ON profiles(customer_type);

ALTER TABLE customer_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view all customer notes" ON customer_notes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert customer notes" ON customer_notes
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update customer notes" ON customer_notes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete customer notes" ON customer_notes
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_customer_notes_updated_at BEFORE UPDATE ON customer_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
