-- Analyze duplicate indexes on specific tables
-- This script identifies duplicate indexes that can be safely removed

-- Query to find duplicate indexes on sponsor_chat_messages
SELECT 
    'sponsor_chat_messages' as table_name,
    schemaname,
    indexname,
    indexdef,
    -- Extract column list from index definition
    regexp_replace(
        regexp_replace(indexdef, '.*\((.*)\).*', '\1'),
        '\s+', '', 'g'
    ) as columns_normalized
FROM pg_indexes 
WHERE tablename = 'sponsor_chat_messages'
ORDER BY columns_normalized, indexname;

-- Query to find duplicate indexes on sponsor_connections
SELECT 
    'sponsor_connections' as table_name,
    schemaname,
    indexname,
    indexdef,
    -- Extract column list from index definition
    regexp_replace(
        regexp_replace(indexdef, '.*\((.*)\).*', '\1'),
        '\s+', '', 'g'
    ) as columns_normalized
FROM pg_indexes 
WHERE tablename = 'sponsor_connections'
ORDER BY columns_normalized, indexname;

-- Query to find duplicate indexes on user_assessment_defects
SELECT 
    'user_assessment_defects' as table_name,
    schemaname,
    indexname,
    indexdef,
    -- Extract column list from index definition
    regexp_replace(
        regexp_replace(indexdef, '.*\((.*)\).*', '\1'),
        '\s+', '', 'g'
    ) as columns_normalized
FROM pg_indexes 
WHERE tablename = 'user_assessment_defects'
ORDER BY columns_normalized, indexname;

-- More detailed analysis - group by column patterns to identify true duplicates
WITH index_analysis AS (
    SELECT 
        tablename,
        schemaname,
        indexname,
        indexdef,
        -- Normalize the column list for comparison
        regexp_replace(
            regexp_replace(
                regexp_replace(indexdef, '.*\((.*)\).*', '\1'),
                '\s+', '', 'g'
            ),
            '"', '', 'g'
        ) as columns_normalized,
        -- Extract index type (btree, gin, etc.)
        CASE 
            WHEN indexdef LIKE '%USING btree%' THEN 'btree'
            WHEN indexdef LIKE '%USING gin%' THEN 'gin'
            WHEN indexdef LIKE '%USING gist%' THEN 'gist'
            WHEN indexdef LIKE '%USING hash%' THEN 'hash'
            ELSE 'btree'  -- default
        END as index_type,
        -- Check if it's a unique index
        indexdef LIKE '%UNIQUE%' as is_unique,
        -- Check if it's a partial index
        indexdef LIKE '%WHERE%' as is_partial
    FROM pg_indexes 
    WHERE tablename IN ('sponsor_chat_messages', 'sponsor_connections', 'user_assessment_defects')
    AND schemaname = 'public'
)
SELECT 
    tablename,
    columns_normalized,
    index_type,
    is_unique,
    is_partial,
    COUNT(*) as duplicate_count,
    array_agg(indexname ORDER BY indexname) as index_names,
    array_agg(indexdef ORDER BY indexname) as index_definitions
FROM index_analysis
GROUP BY tablename, columns_normalized, index_type, is_unique, is_partial
HAVING COUNT(*) > 1
ORDER BY tablename, duplicate_count DESC;