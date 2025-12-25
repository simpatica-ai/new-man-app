-- Fix security warnings for performance optimization functions
-- Set search_path on functions created in the performance optimization migration

-- Fix search_path for get_timezone_names function
ALTER FUNCTION public.get_timezone_names() SET search_path = 'public';

-- Fix search_path for refresh_timezone_cache function  
ALTER FUNCTION public.refresh_timezone_cache() SET search_path = 'public';

-- Fix search_path for apply_performance_settings function
ALTER FUNCTION public.apply_performance_settings() SET search_path = 'public';

-- Address materialized view security warning by restricting access
-- Remove broad permissions and add more specific access control
REVOKE SELECT ON public.cached_timezone_names FROM anon, authenticated;

-- Grant access only through the function (more secure)
-- The get_timezone_names() function will still work because it's SECURITY DEFINER
GRANT SELECT ON public.cached_timezone_names TO postgres;

-- Alternatively, if you need direct access to the materialized view, 
-- you can grant it back with specific conditions:
-- GRANT SELECT ON public.cached_timezone_names TO authenticated;

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'Performance function security fixes applied';
    RAISE NOTICE '==============================================';
    RAISE NOTICE '1. Set search_path = public on all performance functions';
    RAISE NOTICE '2. Restricted materialized view access to postgres role only';
    RAISE NOTICE '3. Access to timezone names still available via get_timezone_names() function';
    RAISE NOTICE '';
    RAISE NOTICE 'Security warnings should now be resolved';
END $$;