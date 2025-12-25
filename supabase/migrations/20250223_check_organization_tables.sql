-- Check what organizational tables exist for coach/therapist access
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND (
    table_name LIKE '%organization%' 
    OR table_name LIKE '%practitioner%'
    OR table_name LIKE '%assignment%'
    OR table_name LIKE '%coach%'
    OR table_name LIKE '%therapist%'
)
ORDER BY table_name;