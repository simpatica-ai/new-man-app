-- Migration: Fix Profiles Schema Mismatch (Simplified)
-- Date: 2025-01-12
-- Description: Adds missing columns to profiles table for organizational model compatibility

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO PROFILES TABLE
-- ============================================================================

-- Add organization_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'organization_id' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN organization_id UUID;
  END IF;
END $$;

-- Add roles array column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'roles' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN roles TEXT[] DEFAULT ARRAY['practitioner'];
  END IF;
END $$;

-- Add role column for backward compatibility if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role TEXT DEFAULT 'practitioner';
  END IF;
END $$;

-- Add last_activity column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'last_activity' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_active' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'updated_at' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- ============================================================================
-- 2. SYNC EXISTING DATA
-- ============================================================================

-- Update role column based on roles array (if both exist)
UPDATE public.profiles 
SET role = COALESCE(roles[1], 'practitioner')
WHERE role IS NULL OR role = '';

-- Update roles array based on role column (if both exist)
UPDATE public.profiles 
SET roles = ARRAY[COALESCE(role, 'practitioner')]
WHERE roles IS NULL OR array_length(roles, 1) IS NULL;

-- Update updated_at for existing records
UPDATE public.profiles 
SET updated_at = COALESCE(created_at, NOW()) 
WHERE updated_at IS NULL;

-- ============================================================================
-- 3. CREATE TRIGGER FUNCTION AND TRIGGER
-- ============================================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.profiles.role IS 'Single role for backward compatibility';
COMMENT ON COLUMN public.profiles.roles IS 'Array of user roles (primary for organizational model)';
COMMENT ON COLUMN public.profiles.organization_id IS 'Reference to organization (NULL for individual users)';
COMMENT ON COLUMN public.profiles.last_activity IS 'Timestamp of user last activity';
COMMENT ON COLUMN public.profiles.is_active IS 'Whether user is active (false = archived)';
COMMENT ON COLUMN public.profiles.updated_at IS 'Timestamp when record was last updated';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================