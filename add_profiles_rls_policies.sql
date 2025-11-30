-- ============================================================================
-- ADD RLS POLICIES FOR PROFILES TABLE
-- Date: 2025-01-26
-- 
-- Purpose: Allow sponsors and practitioners to view each other's profiles
-- when they have an active relationship
-- 
-- SAFE: These are additive policies only, no data modification
-- ============================================================================

-- Allow sponsors to view their practitioners' profiles
CREATE POLICY IF NOT EXISTS "Sponsors can view their practitioners' profiles"
ON profiles
FOR SELECT
USING (
  id IN (
    SELECT practitioner_id 
    FROM sponsor_relationships 
    WHERE sponsor_id = auth.uid() 
    AND status = 'active'
  )
);

-- Allow practitioners to view their sponsors' profiles
CREATE POLICY IF NOT EXISTS "Practitioners can view their sponsors' profiles"
ON profiles
FOR SELECT
USING (
  id IN (
    SELECT sponsor_id 
    FROM sponsor_relationships 
    WHERE practitioner_id = auth.uid() 
    AND status = 'active'
  )
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- List all RLS policies on profiles table
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Expected output should include:
-- 1. "Users can view own profile"
-- 2. "Users can update own profile"
-- 3. "Sponsors can view their practitioners' profiles"
-- 4. "Practitioners can view their sponsors' profiles"
