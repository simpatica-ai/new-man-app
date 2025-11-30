-- ============================================================================
-- FIX SPONSOR CONNECTIONS SEQUENCE
-- Date: 2025-01-15
-- 
-- Fixes the sequence issue with sponsor_connections table where the id column
-- is getting null values instead of auto-generated sequence values.
-- ============================================================================

-- Check current sequence value and table max id
SELECT 
  'Current sequence info' as info,
  last_value as current_sequence_value,
  is_called
FROM sponsor_connections_id_seq;

SELECT 
  'Current table info' as info,
  COALESCE(MAX(id), 0) as max_table_id,
  COUNT(*) as row_count
FROM sponsor_connections;

-- Fix the sequence by setting it to the correct value
-- This ensures the next sequence value is higher than any existing id
SELECT setval('sponsor_connections_id_seq', COALESCE((SELECT MAX(id) FROM sponsor_connections), 0) + 1, false);

-- Verify the fix
SELECT 
  'After fix' as info,
  last_value as sequence_value,
  is_called
FROM sponsor_connections_id_seq;

-- Test the sequence by getting the next value (this won't consume it due to the false parameter above)
SELECT nextval('sponsor_connections_id_seq') as next_sequence_value;

-- Reset the sequence back to the correct position
SELECT setval('sponsor_connections_id_seq', COALESCE((SELECT MAX(id) FROM sponsor_connections), 0) + 1, false);

-- Grant permissions on the sequence to authenticated users (in case that's the issue)
GRANT USAGE, SELECT ON SEQUENCE sponsor_connections_id_seq TO authenticated;

-- Verify sequence permissions
SELECT 
  'Sequence permissions' as info,
  has_sequence_privilege('authenticated', 'sponsor_connections_id_seq', 'USAGE') as has_usage,
  has_sequence_privilege('authenticated', 'sponsor_connections_id_seq', 'SELECT') as has_select;

-- Test insert with explicit DEFAULT to verify it works
INSERT INTO sponsor_connections (id, practitioner_user_id, sponsor_user_id, status)
VALUES (DEFAULT, '22222222-3333-4444-5555-666666666666'::UUID, '11111111-2222-3333-4444-555555555555'::UUID, 'active')
ON CONFLICT (practitioner_user_id, sponsor_user_id, status) DO NOTHING
RETURNING id, 'Test insert successful' as result;

-- Clean up the test insert if you don't want it
-- DELETE FROM sponsor_connections 
-- WHERE practitioner_user_id = '22222222-3333-4444-5555-666666666666'::UUID 
-- AND sponsor_user_id = '11111111-2222-3333-4444-555555555555'::UUID;

SELECT 'Sequence fix completed successfully' as status;