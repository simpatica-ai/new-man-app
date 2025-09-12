-- Create sponsor_relationships table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.sponsor_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  practitioner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sponsor_email TEXT,
  invitation_token UUID DEFAULT gen_random_uuid(),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sponsor_id, practitioner_id)
);

-- Add columns if table exists but columns don't
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sponsor_relationships') THEN
    -- Add sponsor_email column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sponsor_relationships' AND column_name = 'sponsor_email') THEN
      ALTER TABLE public.sponsor_relationships ADD COLUMN sponsor_email TEXT;
    END IF;
    
    -- Add invitation_token column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'sponsor_relationships' AND column_name = 'invitation_token') THEN
      ALTER TABLE public.sponsor_relationships ADD COLUMN invitation_token UUID DEFAULT gen_random_uuid();
    END IF;
  END IF;
END $$;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_sponsor_relationships_invitation_token 
ON public.sponsor_relationships(invitation_token);

CREATE INDEX IF NOT EXISTS idx_sponsor_relationships_sponsor_email 
ON public.sponsor_relationships(sponsor_email);

-- Enable RLS
ALTER TABLE public.sponsor_relationships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their sponsor relationships" ON public.sponsor_relationships;
DROP POLICY IF EXISTS "Users can accept sponsor invitations" ON public.sponsor_relationships;

-- Create updated RLS policies
CREATE POLICY "Users can view their sponsor relationships" ON public.sponsor_relationships
  FOR SELECT USING (
    auth.uid() = sponsor_id 
    OR auth.uid() = practitioner_id 
    OR (sponsor_id IS NULL AND sponsor_email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- Allow users to accept invitations
CREATE POLICY "Users can accept sponsor invitations" ON public.sponsor_relationships
  FOR UPDATE USING (
    sponsor_id IS NULL 
    AND sponsor_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'email_sent'
  );

-- Allow practitioners to create invitations
CREATE POLICY "Users can create sponsor invitations" ON public.sponsor_relationships
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id);
