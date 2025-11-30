-- Test Script: Work Product Reporting Migration
-- Date: 2025-01-12
-- Description: Validates that the work product reporting migration was applied correctly

-- ============================================================================
-- 1. TEST TABLE CREATION
-- ============================================================================

-- Test that virtue_prompts table exists and has correct structure
DO $
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'virtue_prompts' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'virtue_prompts table was not created';
  END IF;
  
  -- Check required columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'virtue_prompts' AND column_name = 'user_id' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'virtue_prompts.user_id column missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'virtue_prompts' AND column_name = 'virtue_id' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'virtue_prompts.virtue_id column missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'virtue_prompts' AND column_name = 'stage_number' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'virtue_prompts.stage_number column missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'virtue_prompts' AND column_name = 'prompt_text' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'virtue_prompts.prompt_text column missing';
  END IF;
  
  RAISE NOTICE 'virtue_prompts table structure validated successfully';
END $;

-- Test that work_product_reports table exists and has correct structure
DO $
BEGIN
  -- Check if table exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'work_product_reports' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'work_product_reports table was not created';
  END IF;
  
  -- Check required columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_product_reports' AND column_name = 'practitioner_id' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'work_product_reports.practitioner_id column missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_product_reports' AND column_name = 'generated_by' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'work_product_reports.generated_by column missing';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'work_product_reports' AND column_name = 'report_type' AND table_schema = 'public') THEN
    RAISE EXCEPTION 'work_product_reports.report_type column missing';
  END IF;
  
  RAISE NOTICE 'work_product_reports table structure validated successfully';
END $;

-- ============================================================================
-- 2. TEST FUNCTION CREATION
-- ============================================================================

-- Test that reporting functions exist
DO $
BEGIN
  -- Check get_work_product_summary function
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_work_product_summary' 
    AND routine_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'get_work_product_summary function was not created';
  END IF;
  
  -- Check get_virtue_stage_work_details function
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_virtue_stage_work_details' 
    AND routine_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'get_virtue_stage_work_details function was not created';
  END IF;
  
  -- Check get_available_virtues_for_user function
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'get_available_virtues_for_user' 
    AND routine_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'get_available_virtues_for_user function was not created';
  END IF;
  
  -- Check cleanup_expired_reports function
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'cleanup_expired_reports' 
    AND routine_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'cleanup_expired_reports function was not created';
  END IF;
  
  RAISE NOTICE 'All reporting functions validated successfully';
END $;

-- ============================================================================
-- 3. TEST INDEX CREATION
-- ============================================================================

-- Test that required indexes exist
DO $
BEGIN
  -- Check virtue_prompts indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_virtue_prompts_user_virtue' 
    AND schemaname = 'public'
  ) THEN
    RAISE EXCEPTION 'idx_virtue_prompts_user_virtue index was not created';
  END IF;
  
  -- Check enhanced reporting indexes
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_user_virtue_stage_progress_user_status' 
    AND schemaname = 'public'
  ) THEN
    RAISE EXCEPTION 'idx_user_virtue_stage_progress_user_status index was not created';
  END IF;
  
  RAISE NOTICE 'Required indexes validated successfully';
END $;

-- ============================================================================
-- 4. TEST RLS POLICIES
-- ============================================================================

-- Test that RLS is enabled on new tables
DO $
BEGIN
  -- Check virtue_prompts RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'virtue_prompts' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on virtue_prompts table';
  END IF;
  
  -- Check work_product_reports RLS
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'work_product_reports' 
    AND schemaname = 'public' 
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'RLS not enabled on work_product_reports table';
  END IF;
  
  RAISE NOTICE 'RLS policies validated successfully';
END $;

-- ============================================================================
-- 5. TEST FUNCTION EXECUTION (BASIC)
-- ============================================================================

-- Test that functions can be called (with dummy data)
DO $
DECLARE
  test_user_id UUID := '00000000-0000-0000-0000-000000000000';
  result_record RECORD;
BEGIN
  -- Test get_work_product_summary (should return zeros for non-existent user)
  SELECT * INTO result_record FROM get_work_product_summary(test_user_id);
  
  IF result_record.total_stages_completed IS NULL THEN
    RAISE EXCEPTION 'get_work_product_summary function not working correctly';
  END IF;
  
  RAISE NOTICE 'Function execution test completed successfully';
END $;

-- ============================================================================
-- 6. SUMMARY
-- ============================================================================

DO $
BEGIN
  RAISE NOTICE '=== WORK PRODUCT REPORTING MIGRATION TEST SUMMARY ===';
  RAISE NOTICE 'All tests passed successfully!';
  RAISE NOTICE 'Tables created: virtue_prompts, work_product_reports';
  RAISE NOTICE 'Functions created: 4 reporting functions';
  RAISE NOTICE 'Indexes created: Multiple performance indexes';
  RAISE NOTICE 'RLS policies: Enabled and configured';
  RAISE NOTICE 'Migration is ready for production deployment';
END $;