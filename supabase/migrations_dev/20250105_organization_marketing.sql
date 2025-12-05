-- Migration for organization marketing and signup features
-- Created: 2025-01-05

-- Create table for organization demo requests
CREATE TABLE IF NOT EXISTS organization_demo_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT NOT NULL,
  organization_type TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'demo_scheduled', 'demo_completed', 'converted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted_at TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_organization_demo_requests_status ON organization_demo_requests(status);
CREATE INDEX IF NOT EXISTS idx_organization_demo_requests_created_at ON organization_demo_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_organization_demo_requests_email ON organization_demo_requests(email);

-- Enable RLS
ALTER TABLE organization_demo_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only (for now)
CREATE POLICY "Admin can manage demo requests" ON organization_demo_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND 'admin' = ANY(profiles.roles)
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organization_demo_requests_updated_at 
  BEFORE UPDATE ON organization_demo_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE organization_demo_requests IS 'Stores demo requests from potential organizational customers';