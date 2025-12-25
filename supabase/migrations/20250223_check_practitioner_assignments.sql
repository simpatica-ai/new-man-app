-- Check practitioner_assignments table structure for organizational access
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'practitioner_assignments'
ORDER BY ordinal_position;