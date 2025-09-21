-- Create table for virtue training data
CREATE TABLE virtue_training_data (
  id SERIAL PRIMARY KEY,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  prompt_used TEXT,
  prompt_name VARCHAR(100),
  philosophical_tradition VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  is_approved BOOLEAN DEFAULT false,
  notes TEXT
);

-- Enable RLS
ALTER TABLE virtue_training_data ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can access
CREATE POLICY "Admin access only" ON virtue_training_data
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Create index for faster queries
CREATE INDEX idx_virtue_training_philosophical_tradition ON virtue_training_data(philosophical_tradition);
CREATE INDEX idx_virtue_training_approved ON virtue_training_data(is_approved);