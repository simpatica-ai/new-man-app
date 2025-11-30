-- ============================================================================
-- ROLLBACK: Sponsor Connections Sequence Fix
-- Date: 2025-01-15
-- 
-- This script rolls back the sequence fix if issues occur
-- ⚠️ WARNING: Only run this if the sequence fix caused problems
-- ============================================================================

-- Check current state before rollback
SELECT 
  'Before rollback' as status,
  last_value as current_sequence_value,
  is_called
FROM sponsor_connections_id_seq;

SELECT 
  'Table state before rollback' as status,
  COALESCE(MAX(id), 0) as max_table_id,
  COUNT(*) as row_count
FROM sponsor_connections;

-- If sequence was incorrectly set, reset to safe value
-- This sets it to max(id) + 1, which is always safe
SELECT setval('sponsor_connections_id_seq', 
  COALESCE((SELECT MAX(id) FROM sponsor_connections), 0) + 1, 
  false);

-- Verify rollback
SELECT 
  'After rollback' as status,
  last_value as sequence_value,
  is_called
FROM sponsor_connections_id_seq;

-- Test that sequence still works
SELECT nextval('sponsor_connections_id_seq') as next_value_test;

-- Reset sequence back after test
SELECT setval('sponsor_connections_id_seq', 
  COALESCE((SELECT MAX(id) FROM sponsor_connections), 0) + 1, 
  false);

SELECT '✅ Rollback completed - sequence reset to safe value' as result;