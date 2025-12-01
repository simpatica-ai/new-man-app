-- ============================================================================
-- Verify sponsor tables and relationships
-- ============================================================================

-- Check if tables exist
SELECT 
  'Table Existence Check' as info,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_relationships') as sponsor_relationships_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_connections') as sponsor_connections_exists;

-- Check sponsor_relationships data
SELECT 
  'sponsor_relationships Summary' as info,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE status = 'active') as active_records,
  COUNT(*) FILTER (WHERE status = 'active' AND sponsor_id IS NOT NULL) as active_with_sponsor,
  COUNT(*) FILTER (WHERE status = 'email_sent') as pending_invitations
FROM public.sponsor_relationships;

-- Check sponsor_connections data (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_connections') THEN
    RAISE NOTICE 'sponsor_connections table exists';
    PERFORM 1;
  ELSE
    RAISE NOTICE 'sponsor_connections table does NOT exist - needs to be created';
  END IF;
END $$;

-- Show active relationships
SELECT 
  'Active Relationships' as info,
  sr.id,
  sr.practitioner_id,
  p1.full_name as practitioner_name,
  sr.sponsor_id,
  p2.full_name as sponsor_name,
  sr.sponsor_email,
  sr.status,
  sr.created_at
FROM public.sponsor_relationships sr
LEFT JOIN public.profiles p1 ON p1.id = sr.practitioner_id
LEFT JOIN public.profiles p2 ON p2.id = sr.sponsor_id
WHERE sr.status = 'active'
ORDER BY sr.created_at DESC;

-- Check RLS policies on sponsor_connections (if table exists)
SELECT 
  'RLS Policies on sponsor_connections' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'sponsor_connections';
