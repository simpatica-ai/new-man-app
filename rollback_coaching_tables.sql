-- ============================================================================
-- ROLLBACK: Coaching Tables Migration
-- Date: 2025-01-15
-- 
-- This script removes coaching tables if migration caused issues
-- ⚠️ CRITICAL WARNING: This will DELETE ALL coaching data!
-- ⚠️ Only run this if you have a backup and need to revert
-- ============================================================================

-- Require explicit confirmation
DO $$
BEGIN
  RAISE NOTICE '⚠️  WARNING: This will delete all coaching tables and data!';
  RAISE NOTICE '⚠️  Make sure you have a backup before proceeding!';
  RAISE NOTICE '⚠️  To proceed, you must manually uncomment the DROP statements below';
END $$;

-- Check what will be deleted
SELECT 
  'Tables that will be dropped' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sponsor_connections', 'sponsor_chat_messages', 'sponsor_visible_memos');

SELECT 
  'Functions that will be dropped' as info,
  routine_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_coach_connection', 'share_memo_with_coach');

-- Count data that will be lost
SELECT 'sponsor_connections' as table_name, COUNT(*) as row_count FROM sponsor_connections
UNION ALL
SELECT 'sponsor_chat_messages', COUNT(*) FROM sponsor_chat_messages
UNION ALL
SELECT 'sponsor_visible_memos', COUNT(*) FROM sponsor_visible_memos;

-- ============================================================================
-- UNCOMMENT BELOW TO ACTUALLY PERFORM ROLLBACK
-- ============================================================================

/*
-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS public.sponsor_chat_messages CASCADE;
DROP TABLE IF EXISTS public.sponsor_visible_memos CASCADE;
DROP TABLE IF EXISTS public.sponsor_connections CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.create_coach_connection(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.share_memo_with_coach(INTEGER, INTEGER, TEXT) CASCADE;

-- Verify deletion
SELECT 
  'Rollback completed' as status,
  COUNT(*) as remaining_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sponsor_connections', 'sponsor_chat_messages', 'sponsor_visible_memos');

SELECT '✅ Coaching tables rollback completed' as result;
*/

SELECT '⚠️  Rollback script loaded but NOT executed (safety measure)' as result;
SELECT '💡 Uncomment the DROP statements to actually perform rollback' as instruction;