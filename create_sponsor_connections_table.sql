-- ============================================================================
-- Create sponsor_connections table and migrate existing relationships
-- Date: 2025-11-30
-- 
-- This script:
-- 1. Creates sponsor_connections table if it doesn't exist
-- 2. Sets up RLS policies for proper access control
-- 3. Migrates existing active sponsor_relationships to sponsor_connections
-- ============================================================================

-- Create the sponsor_connections table
CREATE TABLE IF NOT EXISTS public.sponsor_connections (
  id SERIAL PRIMARY KEY,
  practitioner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(practitioner_user_id, sponsor_user_id, status)
);

-- Enable RLS
ALTER TABLE public.sponsor_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Sponsors can view their connections" ON public.sponsor_connections;
DROP POLICY IF EXISTS "Practitioners can view their connections" ON public.sponsor_connections;
DROP POLICY IF EXISTS "Users can insert connections" ON public.sponsor_connections;

-- Create RLS policies
-- Sponsors can view connections where they are the sponsor
CREATE POLICY "Sponsors can view their connections" 
ON public.sponsor_connections
FOR SELECT
USING (auth.uid() = sponsor_user_id);

-- Practitioners can view connections where they are the practitioner
CREATE POLICY "Practitioners can view their connections" 
ON public.sponsor_connections
FOR SELECT
USING (auth.uid() = practitioner_user_id);

-- Allow authenticated users to insert connections (for invitation acceptance)
CREATE POLICY "Users can insert connections" 
ON public.sponsor_connections
FOR INSERT
WITH CHECK (auth.uid() = sponsor_user_id OR auth.uid() = practitioner_user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.sponsor_connections TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE sponsor_connections_id_seq TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sponsor_connections_sponsor 
ON public.sponsor_connections(sponsor_user_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_connections_practitioner 
ON public.sponsor_connections(practitioner_user_id);

CREATE INDEX IF NOT EXISTS idx_sponsor_connections_status 
ON public.sponsor_connections(status);

-- Migrate existing active relationships from sponsor_relationships to sponsor_connections
-- Only insert if the connection doesn't already exist
INSERT INTO public.sponsor_connections (practitioner_user_id, sponsor_user_id, status, created_at)
SELECT 
  sr.practitioner_id,
  sr.sponsor_id,
  'active',
  sr.created_at
FROM public.sponsor_relationships sr
WHERE sr.status = 'active'
  AND sr.sponsor_id IS NOT NULL
  AND sr.practitioner_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.sponsor_connections sc
    WHERE sc.practitioner_user_id = sr.practitioner_id
      AND sc.sponsor_user_id = sr.sponsor_id
      AND sc.status = 'active'
  );

-- Verify the migration
SELECT 
  'Migration Summary' as info,
  (SELECT COUNT(*) FROM public.sponsor_relationships WHERE status = 'active' AND sponsor_id IS NOT NULL) as active_relationships,
  (SELECT COUNT(*) FROM public.sponsor_connections WHERE status = 'active') as active_connections;

-- Show any relationships that couldn't be migrated
SELECT 
  'Unmigrated Relationships' as info,
  sr.id,
  sr.practitioner_id,
  sr.sponsor_id,
  sr.sponsor_email,
  sr.status
FROM public.sponsor_relationships sr
WHERE sr.status = 'active'
  AND (sr.sponsor_id IS NULL OR sr.practitioner_id IS NULL);
