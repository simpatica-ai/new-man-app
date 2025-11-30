-- Migration: Complete Work Product Reporting Setup
-- Date: 2025-01-12
-- Description: Adds missing columns and complete work product reporting functionality

-- ============================================================================
-- 1. ADD MISSING UPDATED_AT COLUMNS TO EXISTING TABLES
-- ============================================================================

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at to user_virtue_stage_progress if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_virtue_stage_progress' 
    AND column_name = 'updated_at' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_virtue_stage_progress 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Update existing records to have updated_at = created_at
    UPDATE public.user_virtue_stage_progress 
    SET updated_at = created_at 
    WHERE updated_at IS NULL;
    
    -- Add trigger
    DROP TRIGGER IF EXISTS update_user_virtue_stage_progress_updated_at ON public.user_virtue_stage_progress;
    CREATE TRIGGER update_user_virtue_stage_progress_updated_at
      BEFORE UPDATE ON public.user_virtue_stage_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add updated_at to user_virtue_stage_memos if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_virtue_stage_memos' 
    AND column_name = 'updated_at' 
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.user_virtue_stage_memos 
    ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    
    -- Update existing records to have updated_at = created_at
    UPDATE public.user_virtue_stage_memos 
    SET updated_at = created_at 
    WHERE updated_at IS NULL;
    
    -- Add trigger
    DROP TRIGGER IF EXISTS update_user_virtue_stage_memos_updated_at ON public.user_virtue_stage_memos;
    CREATE TRIGGER update_user_virtue_stage_memos_updated_at
      BEFORE UPDATE ON public.user_virtue_stage_memos
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE VIRTUE PROMPTS TABLE FOR WORK PRODUCT REPORTING
-- ============================================================================

-- This table stores AI-generated prompts for virtue stages to support reporting
CREATE TABLE IF NOT EXISTS public.virtue_prompts (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  virtue_id INTEGER NOT NULL REFERENCES public.virtues(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL CHECK (stage_number IN (1, 2, 3)),
  prompt_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT virtue_prompts_unique_user_virtue_stage 
    UNIQUE(user_id, virtue_id, stage_number)
);

-- Add RLS to virtue_prompts table
ALTER TABLE public.virtue_prompts ENABLE ROW LEVEL SECURITY;

-- Add updated_at trigger for virtue_prompts
CREATE TRIGGER update_virtue_prompts_updated_at 
  BEFORE UPDATE ON public.virtue_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. CREATE WORK PRODUCT REPORT CACHE TABLE
-- ============================================================================

-- This table can cache generated report data for performance
CREATE TABLE IF NOT EXISTS public.work_product_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('work_product', 'assessment', 'combined')),
  filters JSONB NOT NULL DEFAULT '{}',
  report_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Add RLS to work_product_reports table
ALTER TABLE public.work_product_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE INDEXES FOR WORK PRODUCT REPORTING PERFORMANCE
-- ============================================================================

-- Virtue prompts indexes
CREATE INDEX IF NOT EXISTS idx_virtue_prompts_user_virtue ON public.virtue_prompts(user_id, virtue_id);
CREATE INDEX IF NOT EXISTS idx_virtue_prompts_created_at ON public.virtue_prompts(created_at);

-- Work product reports indexes
CREATE INDEX IF NOT EXISTS idx_work_product_reports_practitioner_created ON public.work_product_reports(practitioner_id, created_at);
CREATE INDEX IF NOT EXISTS idx_work_product_reports_generated_by_created ON public.work_product_reports(generated_by, created_at);
CREATE INDEX IF NOT EXISTS idx_work_product_reports_organization_created ON public.work_product_reports(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_work_product_reports_expires_at ON public.work_product_reports(expires_at);

-- Enhanced indexes for existing tables to support reporting queries
CREATE INDEX IF NOT EXISTS idx_user_virtue_stage_progress_user_status ON public.user_virtue_stage_progress(user_id, status);
CREATE INDEX IF NOT EXISTS idx_user_virtue_stage_progress_updated_at ON public.user_virtue_stage_progress(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_virtue_stage_memos_user_virtue ON public.user_virtue_stage_memos(user_id, virtue_id);
CREATE INDEX IF NOT EXISTS idx_user_virtue_stage_memos_updated_at ON public.user_virtue_stage_memos(updated_at);
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_created ON public.journal_entries(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_assessments_user_type_created ON public.user_assessments(user_id, assessment_type, created_at);

-- ============================================================================
-- 5. CREATE FUNCTIONS FOR WORK PRODUCT REPORTING
-- ============================================================================

-- Function to get work product summary for a user
CREATE OR REPLACE FUNCTION get_work_product_summary(
  target_user_id UUID,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  status_filter TEXT DEFAULT 'both'
)
RETURNS TABLE (
  total_stages_completed BIGINT,
  total_stages_in_progress BIGINT,
  total_journal_entries BIGINT,
  total_assessments BIGINT,
  virtues_with_progress BIGINT,
  date_range_start TIMESTAMP WITH TIME ZONE,
  date_range_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  effective_start_date TIMESTAMP WITH TIME ZONE;
  effective_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set default date range if not provided (last 90 days)
  effective_start_date := COALESCE(start_date, NOW() - INTERVAL '90 days');
  effective_end_date := COALESCE(end_date, NOW());
  
  RETURN QUERY
  WITH stage_counts AS (
    SELECT 
      COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_count,
      COUNT(DISTINCT virtue_id) as virtue_count
    FROM public.user_virtue_stage_progress uvsp
    WHERE uvsp.user_id = target_user_id
      AND uvsp.updated_at >= effective_start_date
      AND uvsp.updated_at <= effective_end_date
      AND (
        status_filter = 'both' OR
        (status_filter = 'completed' AND status = 'completed') OR
        (status_filter = 'in_progress' AND status = 'in_progress')
      )
  ),
  journal_count AS (
    SELECT COUNT(*) as entry_count
    FROM public.journal_entries je
    WHERE je.user_id = target_user_id
      AND je.created_at >= effective_start_date
      AND je.created_at <= effective_end_date
  ),
  assessment_count AS (
    SELECT COUNT(*) as assessment_count
    FROM public.user_assessments ua
    WHERE ua.user_id = target_user_id
      AND ua.created_at >= effective_start_date
      AND ua.created_at <= effective_end_date
  )
  SELECT 
    sc.completed_count,
    sc.in_progress_count,
    jc.entry_count,
    ac.assessment_count,
    sc.virtue_count,
    effective_start_date,
    effective_end_date
  FROM stage_counts sc, journal_count jc, assessment_count ac;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get virtue stage work details for reporting
CREATE OR REPLACE FUNCTION get_virtue_stage_work_details(
  target_user_id UUID,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  status_filter TEXT DEFAULT 'both',
  virtue_ids INTEGER[] DEFAULT NULL
)
RETURNS TABLE (
  virtue_id INTEGER,
  virtue_name TEXT,
  stage_number INTEGER,
  stage_title TEXT,
  status TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  memo_text TEXT
) AS $$
DECLARE
  effective_start_date TIMESTAMP WITH TIME ZONE;
  effective_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Set default date range if not provided (last 90 days)
  effective_start_date := COALESCE(start_date, NOW() - INTERVAL '90 days');
  effective_end_date := COALESCE(end_date, NOW());
  
  RETURN QUERY
  SELECT 
    uvsp.virtue_id,
    v.name as virtue_name,
    uvsp.stage_number,
    vs.title as stage_title,
    uvsp.status,
    uvsp.created_at as started_at,
    CASE WHEN uvsp.status = 'completed' THEN uvsp.updated_at ELSE NULL END as completed_at,
    uvsp.updated_at,
    uvsm.memo_text
  FROM public.user_virtue_stage_progress uvsp
  JOIN public.virtues v ON uvsp.virtue_id = v.id
  LEFT JOIN public.virtue_stages vs ON v.id = vs.virtue_id AND uvsp.stage_number = vs.stage_number
  LEFT JOIN public.user_virtue_stage_memos uvsm ON (
    uvsp.user_id = uvsm.user_id AND 
    uvsp.virtue_id = uvsm.virtue_id AND 
    uvsp.stage_number = uvsm.stage_number
  )
  WHERE uvsp.user_id = target_user_id
    AND uvsp.updated_at >= effective_start_date
    AND uvsp.updated_at <= effective_end_date
    AND (
      status_filter = 'both' OR
      (status_filter = 'completed' AND uvsp.status = 'completed') OR
      (status_filter = 'in_progress' AND uvsp.status = 'in_progress')
    )
    AND (virtue_ids IS NULL OR uvsp.virtue_id = ANY(virtue_ids))
  ORDER BY v.name, uvsp.stage_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available virtues for a practitioner (for filtering)
CREATE OR REPLACE FUNCTION get_available_virtues_for_user(target_user_id UUID)
RETURNS TABLE (
  virtue_id INTEGER,
  virtue_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    v.id as virtue_id,
    v.name as virtue_name
  FROM public.user_virtue_stage_progress uvsp
  JOIN public.virtues v ON uvsp.virtue_id = v.id
  WHERE uvsp.user_id = target_user_id
  ORDER BY v.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired report cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.work_product_reports
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. ROW LEVEL SECURITY POLICIES FOR WORK PRODUCT REPORTING
-- ============================================================================

-- Virtue prompts policies
CREATE POLICY "Users can view own virtue prompts" ON public.virtue_prompts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own virtue prompts" ON public.virtue_prompts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own virtue prompts" ON public.virtue_prompts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Supervisors can view assigned practitioners' virtue prompts" ON public.virtue_prompts
  FOR SELECT USING (
    user_id IN (
      SELECT practitioner_id 
      FROM public.practitioner_assignments 
      WHERE supervisor_id = auth.uid() AND active = true
    )
  );

-- Work product reports policies
CREATE POLICY "Users can view own reports" ON public.work_product_reports
  FOR SELECT USING (
    auth.uid() = practitioner_id OR auth.uid() = generated_by
  );

CREATE POLICY "Supervisors can view assigned practitioners' reports" ON public.work_product_reports
  FOR SELECT USING (
    practitioner_id IN (
      SELECT practitioner_id 
      FROM public.practitioner_assignments 
      WHERE supervisor_id = auth.uid() AND active = true
    )
  );

CREATE POLICY "Organization admins can view organization reports" ON public.work_product_reports
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id 
      FROM public.profiles 
      WHERE id = auth.uid() 
        AND organization_id IS NOT NULL 
        AND 'admin' = ANY(roles)
    )
  );

CREATE POLICY "Authorized users can create reports" ON public.work_product_reports
  FOR INSERT WITH CHECK (
    auth.uid() = generated_by AND (
      -- Can create reports for themselves
      auth.uid() = practitioner_id OR
      -- Supervisors can create reports for assigned practitioners
      practitioner_id IN (
        SELECT practitioner_id 
        FROM public.practitioner_assignments 
        WHERE supervisor_id = auth.uid() AND active = true
      ) OR
      -- Organization admins can create reports for organization members
      practitioner_id IN (
        SELECT id 
        FROM public.profiles 
        WHERE organization_id IN (
          SELECT organization_id 
          FROM public.profiles 
          WHERE id = auth.uid() 
            AND organization_id IS NOT NULL 
            AND 'admin' = ANY(roles)
        )
      )
    )
  );

-- ============================================================================
-- 7. GRANT PERMISSIONS FOR REPORTING FUNCTIONS
-- ============================================================================

-- Grant execute permissions on reporting functions to authenticated users
GRANT EXECUTE ON FUNCTION get_work_product_summary(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_virtue_stage_work_details(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, INTEGER[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_virtues_for_user(UUID) TO authenticated;

-- Grant execute permission on cleanup function to service role only
GRANT EXECUTE ON FUNCTION cleanup_expired_reports() TO service_role;

-- ============================================================================
-- 8. ADD HELPFUL INDEXES FOR REPORTING QUERIES ON EXISTING TABLES
-- ============================================================================

-- Add helpful indexes for reporting queries on existing tables
CREATE INDEX IF NOT EXISTS idx_user_assessment_results_user_virtue ON public.user_assessment_results(user_id, virtue_name);
CREATE INDEX IF NOT EXISTS idx_virtue_analysis_assessment_virtue ON public.virtue_analysis(assessment_id, virtue_id);
CREATE INDEX IF NOT EXISTS idx_virtue_stages_virtue_stage ON public.virtue_stages(virtue_id, stage_number);

-- ============================================================================
-- 9. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.virtue_prompts IS 'Stores AI-generated prompts for virtue stages used in work product reporting';
COMMENT ON TABLE public.work_product_reports IS 'Cache table for generated work product reports with automatic expiration';

COMMENT ON FUNCTION get_work_product_summary(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT) IS 'Returns summary statistics for work product reporting';
COMMENT ON FUNCTION get_virtue_stage_work_details(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, INTEGER[]) IS 'Returns detailed virtue stage work for reporting with filtering options';
COMMENT ON FUNCTION get_available_virtues_for_user(UUID) IS 'Returns list of virtues that a user has progress on for filtering';
COMMENT ON FUNCTION cleanup_expired_reports() IS 'Removes expired report cache entries';

-- ============================================================================
-- 9. IMPLEMENT CLEAR ROLE SYSTEM AND MIGRATE EXISTING ROLES
-- ============================================================================

-- Set system administrator role for bwenzlau@simpatica.ai
UPDATE public.profiles 
SET roles = ARRAY['sys-admin']
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'bwenzlau@simpatica.ai'
);

-- Migrate existing roles to new clear system
-- Handle production simple roles (admin, sponsor, user) and development arrays

-- Show current role distribution before migration
DO $$
BEGIN
  RAISE NOTICE 'ROLE MIGRATION: Starting role system migration';
END $$;

-- Migrate 'admin' users
UPDATE public.profiles 
SET roles = CASE 
  -- If admin has no organization, they're likely the system admin
  WHEN organization_id IS NULL THEN ARRAY['sys-admin']
  -- If admin has organization, they're organization admin
  ELSE ARRAY['org-admin']
END
WHERE role = 'admin' AND (roles IS NULL OR roles = ARRAY[]::TEXT[]);

-- Migrate 'sponsor' users  
UPDATE public.profiles 
SET roles = CASE 
  -- Sponsors become individual sponsors (legacy model)
  WHEN organization_id IS NULL THEN ARRAY['ind-sponsor']
  -- Sponsors in organizations become coaches
  ELSE ARRAY['org-coach']
END
WHERE role = 'sponsor' AND (roles IS NULL OR roles = ARRAY[]::TEXT[]);

-- Migrate 'user' and 'practitioner' users
UPDATE public.profiles 
SET roles = CASE 
  -- Users without organization remain individual practitioners
  WHEN organization_id IS NULL THEN ARRAY['ind-practitioner']
  -- Users with organization become org practitioners
  ELSE ARRAY['org-practitioner']
END
WHERE role IN ('user', 'practitioner') AND (roles IS NULL OR roles = ARRAY[]::TEXT[]);

-- Handle any 'coach' or 'therapist' roles (if they exist in dev)
UPDATE public.profiles 
SET roles = CASE 
  WHEN role = 'coach' AND organization_id IS NULL THEN ARRAY['ind-sponsor']
  WHEN role = 'coach' AND organization_id IS NOT NULL THEN ARRAY['org-coach']
  WHEN role = 'therapist' AND organization_id IS NULL THEN ARRAY['ind-sponsor'] 
  WHEN role = 'therapist' AND organization_id IS NOT NULL THEN ARRAY['org-therapist']
  ELSE roles -- Keep existing if already set
END
WHERE role IN ('coach', 'therapist') AND (roles IS NULL OR roles = ARRAY[]::TEXT[]);

-- Handle NULL or empty roles (set default based on organization)
UPDATE public.profiles 
SET roles = CASE 
  WHEN organization_id IS NULL THEN ARRAY['ind-practitioner']
  ELSE ARRAY['org-practitioner']
END
WHERE (role IS NULL OR role = '') AND (roles IS NULL OR roles = ARRAY[]::TEXT[]);

-- Create role validation function
CREATE OR REPLACE FUNCTION validate_user_roles(user_roles TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
  valid_roles TEXT[] := ARRAY[
    'sys-admin',
    'org-admin', 'org-coach', 'org-therapist', 'org-practitioner',
    'ind-sponsor', 'ind-practitioner',
    -- Legacy roles for backward compatibility
    'admin', 'coach', 'therapist', 'practitioner', 'sponsor', 'user'
  ];
  role TEXT;
BEGIN
  FOREACH role IN ARRAY user_roles
  LOOP
    IF NOT (role = ANY(valid_roles)) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create helper functions for role checking
CREATE OR REPLACE FUNCTION has_system_admin_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT roles INTO user_roles FROM public.profiles WHERE id = user_id;
  RETURN 'sys-admin' = ANY(user_roles) OR 'admin' = ANY(user_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_org_admin_access(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT roles INTO user_roles FROM public.profiles WHERE id = user_id;
  RETURN 'sys-admin' = ANY(user_roles) OR 'org-admin' = ANY(user_roles) OR 'admin' = ANY(user_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_supervise_users(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  SELECT roles INTO user_roles FROM public.profiles WHERE id = user_id;
  RETURN 'sys-admin' = ANY(user_roles) 
    OR 'org-admin' = ANY(user_roles) 
    OR 'org-coach' = ANY(user_roles)
    OR 'org-therapist' = ANY(user_roles)
    OR 'ind-sponsor' = ANY(user_roles)
    -- Backward compatibility
    OR 'admin' = ANY(user_roles)
    OR 'coach' = ANY(user_roles)
    OR 'therapist' = ANY(user_roles)
    OR 'sponsor' = ANY(user_roles);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_user_roles(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION has_system_admin_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_org_admin_access(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_supervise_users(UUID) TO authenticated;

-- Verify system administrator role was set
DO $$
DECLARE
  admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO admin_count 
  FROM public.profiles p
  JOIN auth.users au ON p.id = au.id
  WHERE au.email = 'bwenzlau@simpatica.ai' AND 'sys-admin' = ANY(p.roles);
  
  IF admin_count > 0 THEN
    RAISE NOTICE 'SUCCESS: System administrator role set for bwenzlau@simpatica.ai';
  ELSE
    RAISE WARNING 'WARNING: System administrator role not found for bwenzlau@simpatica.ai';
  END IF;
END $$;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Migration completed successfully
-- This migration adds complete work product reporting functionality including:
-- 1. Missing updated_at columns and triggers
-- 2. Virtue prompts storage for AI-generated content
-- 3. Report caching system for performance
-- 4. Optimized functions for report data generation
-- 5. Proper RLS policies for organizational security
-- 6. Performance indexes for reporting queries
-- 7. Clear role system with sys-admin, org-*, and ind-* roles
-- 8. Role migration from legacy admin/sponsor/user to new system