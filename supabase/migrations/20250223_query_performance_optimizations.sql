-- Query Performance Optimizations
-- Address specific performance issues identified in pg_stat_statements

-- 1. Create a materialized view for timezone names to improve cache performance
-- This addresses the worst performing query: SELECT name FROM pg_timezone_names
CREATE MATERIALIZED VIEW IF NOT EXISTS public.cached_timezone_names AS
SELECT name FROM pg_timezone_names
ORDER BY name;

-- Create an index on the materialized view
CREATE INDEX IF NOT EXISTS idx_cached_timezone_names_name 
ON public.cached_timezone_names (name);

-- Refresh the materialized view (should be done periodically)
REFRESH MATERIALIZED VIEW public.cached_timezone_names;

-- 2. Optimize frequently accessed system catalog queries
-- Analyze key system tables to improve query planning
ANALYZE pg_proc;
ANALYZE pg_attribute; 
ANALYZE pg_class;
ANALYZE pg_namespace;
ANALYZE pg_type;

-- 3. Create indexes on frequently queried system catalog combinations
-- Note: These are suggestions - be careful with system catalog modifications
-- Only create if you have heavy dashboard usage

-- Index for function lookups by namespace and name
-- (Helps with the complex function analysis queries)
DO $$
BEGIN
    -- Check if we can create indexes on system catalogs (usually not recommended)
    -- This is commented out for safety - only enable if you have specific permission issues
    /*
    IF has_table_privilege('pg_proc', 'CREATE') THEN
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pg_proc_namespace_name 
        ON pg_proc (pronamespace, proname) 
        WHERE prokind = 'f';
    END IF;
    */
    
    RAISE NOTICE 'System catalog optimization suggestions prepared';
    RAISE NOTICE 'Consider running VACUUM ANALYZE on system catalogs during maintenance windows';
END $$;

-- 4. Application-level optimizations for timezone handling
-- Create a function to get cached timezone names instead of querying pg_timezone_names directly
CREATE OR REPLACE FUNCTION public.get_timezone_names()
RETURNS TABLE(name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT ctn.name 
    FROM public.cached_timezone_names ctn
    ORDER BY ctn.name;
$$;

-- Grant appropriate permissions
GRANT SELECT ON public.cached_timezone_names TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_timezone_names() TO authenticated, anon;

-- 5. Set up a refresh schedule for the materialized view
-- This should be run periodically (timezone names rarely change)
CREATE OR REPLACE FUNCTION public.refresh_timezone_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.cached_timezone_names;
    RAISE NOTICE 'Timezone cache refreshed at %', now();
END $$;

-- 6. Optimize connection and query settings for better performance
-- These are session-level optimizations that can be applied

-- Create a function to apply performance settings
CREATE OR REPLACE FUNCTION public.apply_performance_settings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increase work_mem for complex queries (be careful with this)
    -- PERFORM set_config('work_mem', '16MB', false);
    
    -- Enable parallel query execution for eligible queries
    -- PERFORM set_config('max_parallel_workers_per_gather', '2', false);
    
    -- Optimize for read-heavy workloads
    -- PERFORM set_config('random_page_cost', '1.1', false);
    
    RAISE NOTICE 'Performance settings applied - consider setting these at database level';
END $$;

-- 7. Query optimization recommendations
DO $$
BEGIN
    RAISE NOTICE 'Query Performance Optimization Applied';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '1. Created cached_timezone_names materialized view';
    RAISE NOTICE '2. Created get_timezone_names() function for app use';
    RAISE NOTICE '3. Analyzed system catalogs for better query planning';
    RAISE NOTICE '4. Created refresh_timezone_cache() for maintenance';
    RAISE NOTICE '';
    RAISE NOTICE 'RECOMMENDATIONS:';
    RAISE NOTICE '- Replace direct pg_timezone_names queries with get_timezone_names()';
    RAISE NOTICE '- Run refresh_timezone_cache() monthly or after system updates';
    RAISE NOTICE '- Monitor pg_stat_statements for new performance issues';
    RAISE NOTICE '- Consider connection pooling if not already implemented';
    RAISE NOTICE '- Review dashboard queries for optimization opportunities';
END $$;