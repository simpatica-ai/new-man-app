-- Analyze sponsor_feedback table structure to create appropriate RLS policies

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'sponsor_feedback'
ORDER BY ordinal_position;

-- Check if table exists and has RLS enabled (using pg_class)
SELECT 
    n.nspname as schema_name,
    c.relname as table_name,
    c.relrowsecurity as rls_enabled
FROM pg_class c
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public' 
AND c.relname = 'sponsor_feedback'
AND c.relkind = 'r';

-- Check existing policies (should be none)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'sponsor_feedback';

-- Show sample data structure (first few rows if any exist)
-- This will help understand the relationships
SELECT * FROM public.sponsor_feedback LIMIT 3;