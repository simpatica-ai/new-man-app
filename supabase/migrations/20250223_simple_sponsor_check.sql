-- Simple sponsor table check that returns actual query results
-- This will show us what sponsor tables exist and their structure

-- Check what tables exist with 'sponsor' in the name
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%sponsor%'
ORDER BY table_name;