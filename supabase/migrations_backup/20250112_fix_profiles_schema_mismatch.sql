-- Migration: Fix Profiles Schema Mismatch
-- Date: 2025-01-12
-- Description: Fixes discrepancies between organizational model and application expectations

-- ============================================================================
-- 1. ENSURE PROFILES TABLE HAS EXPECTED COLUMNS
-- ============================================================================

-- Add missing columns that the application expects but may not exist
DO $$
BEGIN
  -- Add organization_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'organization_id' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN organization_id UUID;
  END IF;

  -- Add roles array if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'roles' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN roles TEXT[] DEFAULT ARRAY['practitioner'];
  END IF;

  -- Add role column for backward compatibility if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'role' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN role TEXT DEFAULT 'practitioner';
  END IF;

  -- Add last_activity if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'last_activity' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  -- Add is_active if it doesn't exist
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

-- ============================================================================
-- 2. SYNC ROLE AND ROLES COLUMNS
-- ============================================================================

-- Ensure role and roles columns are in sync
DO $$
BEGIN
  -- Update role column based on roles array (take first role)
  UPDATE public.profiles 
  SET role = COALESCE(roles[1], 'practitioner')
  WHERE role IS NULL OR role = '';

  -- Update roles array based on role column
  UPDATE public.profiles 
  SET roles = ARRAY[COALESCE(role, 'practitioner')]
  WHERE roles IS NULL OR array_length(roles, 1) IS NULL;
END $$;

-- ============================================================================
-- 3. CREATE TRIGGER TO KEEP ROLE AND ROLES IN SYNC
-- ============================================================================

-- Function to sync role and roles columns
CREATE OR REPLACE FUNCTION sync_role_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- If roles array is updated, update role column with first role
  IF TG_OP = 'UPDATE' AND OLD.roles IS DISTINCT FROM NEW.roles THEN
    NEW.role := COALESCE(NEW.roles[1], 'practitioner');
  END IF;
  
  -- If role column is updated, update roles array
  IF TG_OP = 'UPDATE' AND OLD.role IS DISTINCT FROM NEW.role THEN
    NEW.roles := ARRAY[COALESCE(NEW.role, 'practitioner')];
  END IF;
  
  -- For inserts, ensure both are set
  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NULL AND NEW.roles IS NOT NULL AND array_length(NEW.roles, 1) > 0 THEN
      NEW.role := NEW.roles[1];
    ELSIF NEW.roles IS NULL AND NEW.role IS NOT NULL THEN
      NEW.roles := ARRAY[NEW.role];
    ELSIF NEW.role IS NULL AND NEW.roles IS NULL THEN
      NEW.role := 'practitioner';
      NEW.roles := ARRAY['practitioner'];
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync role columns
DROP TRIGGER IF EXISTS sync_role_columns_trigger ON public.profiles;
CREATE TRIGGER sync_role_columns_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION sync_role_columns();

-- ============================================================================
-- 4. ADD MISSING UPDATED_AT COLUMN TO PROFILES IF NEEDED
-- ============================================================================

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
    
    -- Update existing records
    UPDATE public.profiles 
    SET updated_at = COALESCE(created_at, NOW()) 
    WHERE updated_at IS NULL;
    
    -- Add trigger for automatic updates
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 5. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN public.profiles.role IS 'Single role for backward compatibility (synced with roles[1])';
COMMENT ON COLUMN public.profiles.roles IS 'Array of user roles (primary column for organizational model)';
COMMENT ON COLUMN public.profiles.organization_id IS 'Reference to organization (NULL for individual users)';
COMMENT ON COLUMN public.profiles.last_activity IS 'Timestamp of user last activity';
COMMENT ON COLUMN public.profiles.is_active IS 'Whether user is active (false = archived)';

-- ============================================================================
-- 6. REMOVE DEVELOPMENT-ONLY VIEWS THAT DON'T EXIST IN PRODUCTION
-- ============================================================================

-- Drop profile_with_email view if it exists (not in production)
DROP VIEW IF EXISTS public.profile_with_email;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- This migration ensures backward compatibility while supporting the new organizational model
-- and removes development-only database objects that cause production mismatches