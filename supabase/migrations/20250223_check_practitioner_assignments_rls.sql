-- Check if practitioner_assignments table has RLS enabled and what policies exist
-- This will help us understand why organizational policies failed

-- Check RLS status on practitioner_assignments
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    c.relrowsecurity as rls_enabled,
    c.relforcerowsecurity as rls_forced
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname = 'practitioner_assignments'
AND c.relkind = 'r';