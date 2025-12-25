-- Check columns in sponsor_connections table if it exists
SELECT 
    'sponsor_connections' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'sponsor_connections'
ORDER BY ordinal_position;