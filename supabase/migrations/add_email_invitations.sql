-- Add email invitation support to sponsor_relationships table
ALTER TABLE public.sponsor_relationships 
ADD COLUMN IF NOT EXISTS sponsor_email TEXT,
ADD COLUMN IF NOT EXISTS invitation_token UUID DEFAULT gen_random_uuid();

-- Update status enum to include email_sent
-- Note: This assumes status is stored as TEXT, not an enum type
-- If you're using an enum, you'll need to alter the enum type instead

-- Add index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_sponsor_relationships_invitation_token 
ON public.sponsor_relationships(invitation_token);

-- Add index for email lookups
CREATE INDEX IF NOT EXISTS idx_sponsor_relationships_sponsor_email 
ON public.sponsor_relationships(sponsor_email);

-- Update RLS policies to handle email invitations
DROP POLICY IF EXISTS "Users can view their sponsor relationships" ON public.sponsor_relationships;

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
