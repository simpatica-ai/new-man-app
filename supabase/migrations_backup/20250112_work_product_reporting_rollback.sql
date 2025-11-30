-- Rollback Migration: Work Product Reporting Enhancement
-- Date: 2025-01-12
-- Description: Rollback script for work product reporting migration
--              Use this to undo changes if needed

-- ============================================================================
-- 1. DROP FUNCTIONS
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_work_product_summary(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT);
DROP FUNCTION IF EXISTS public.get_virtue_stage_work_details(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE, TEXT, INTEGER[]);
DROP FUNCTION IF EXISTS public.get_available_virtues_for_user(UUID);
DROP FUNCTION IF EXISTS public.cleanup_expired_reports();

-- ============================================================================
-- 2. DROP SCHEDULED JOBS (IF CREATED)
-- ============================================================================

-- Uncomment if pg_cron was used and the job was created
-- SELECT cron.unschedule('cleanup-expired-reports');

-- ============================================================================
-- 3. DROP TABLES
-- ============================================================================

DROP TABLE IF EXISTS public.work_product_reports;
DROP TABLE IF EXISTS public.virtue_prompts;

-- ============================================================================
-- 4. DROP INDEXES CREATED FOR REPORTING
-- ============================================================================

-- Drop indexes created specifically for work product reporting
DROP INDEX IF EXISTS idx_virtue_prompts_user_virtue;
DROP INDEX IF EXISTS idx_virtue_prompts_created_at;
DROP INDEX IF EXISTS idx_user_virtue_stage_progress_user_status;
DROP INDEX IF EXISTS idx_user_virtue_stage_progress_updated_at;
DROP INDEX IF EXISTS idx_user_virtue_stage_memos_user_virtue;
DROP INDEX IF EXISTS idx_user_virtue_stage_memos_updated_at;
DROP INDEX IF EXISTS idx_journal_entries_user_created;
DROP INDEX IF EXISTS idx_user_assessments_user_type_created;
DROP INDEX IF EXISTS idx_user_assessment_results_user_virtue;
DROP INDEX IF EXISTS idx_virtue_analysis_assessment_virtue;
DROP INDEX IF EXISTS idx_virtue_stages_virtue_stage;

-- ============================================================================
-- END OF ROLLBACK
-- ============================================================================

-- Rollback completed
-- All work product reporting enhancements have been removed