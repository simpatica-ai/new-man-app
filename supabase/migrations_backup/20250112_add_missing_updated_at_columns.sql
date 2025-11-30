-- Migration: Add Missing Updated At Columns
-- Date: 2025-01-12
-- Description: Adds updated_at columns to existing tables that need them for work product reporting

-- ============================================================================
-- 1. ADD UPDATED_AT COLUMNS TO EXISTING TABLES
-- ============================================================================

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
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE TRIGGERS FOR AUTOMATIC UPDATED_AT UPDATES
-- ============================================================================

-- Create or replace the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for user_virtue_stage_progress
DROP TRIGGER IF EXISTS update_user_virtue_stage_progress_updated_at ON public.user_virtue_stage_progress;
CREATE TRIGGER update_user_virtue_stage_progress_updated_at
  BEFORE UPDATE ON public.user_virtue_stage_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for user_virtue_stage_memos
DROP TRIGGER IF EXISTS update_user_virtue_stage_memos_updated_at ON public.user_virtue_stage_memos;
CREATE TRIGGER update_user_virtue_stage_memos_updated_at
  BEFORE UPDATE ON public.user_virtue_stage_memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 3. COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.user_virtue_stage_progress.updated_at IS 'Timestamp when the record was last updated';
COMMENT ON COLUMN public.user_virtue_stage_memos.updated_at IS 'Timestamp when the record was last updated';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================