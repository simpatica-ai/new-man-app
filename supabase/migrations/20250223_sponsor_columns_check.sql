-- Check columns in sponsor-related tables
-- This will show us the exact structure we need for policies

-- Check sponsor_connections columns if it exists
SELECT 
    'sponsor_connections' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'sponsor_connections'
ORDER BY ordinal_position

UNION ALL

-- Check sponsor_relationships columns if it exists
SELECT 
    'sponsor_relationships' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'sponsor_relationships'
ORDER BY ordinal_position

UNION ALL

-- Check any other sponsor tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name LIKE '%sponsor%'
AND table_name NOT IN ('sponsor_connections', 'sponsor_relationships')
ORDER BY table_name, ordinal_position;