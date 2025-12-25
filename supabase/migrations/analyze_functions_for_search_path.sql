-- Analyze functions to identify which ones need search_path fixes
-- This query will show you exactly which functions exist and their current search_path status

SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as function_signature,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM unnest(p.proconfig) as config 
            WHERE config LIKE 'search_path=%'
        ) THEN 'FIXED'
        ELSE 'NEEDS_FIX'
    END as search_path_status,
    COALESCE(
        (SELECT config FROM unnest(p.proconfig) as config 
         WHERE config LIKE 'search_path=%' LIMIT 1),
        'NOT SET'
    ) as current_search_path,
    p.prolang,
    CASE p.prolang
        WHEN (SELECT oid FROM pg_language WHERE lanname = 'plpgsql') THEN 'PL/pgSQL'
        WHEN (SELECT oid FROM pg_language WHERE lanname = 'sql') THEN 'SQL'
        WHEN (SELECT oid FROM pg_language WHERE lanname = 'c') THEN 'C'
        ELSE 'OTHER'
    END as language_name,
    p.provolatile as volatility,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'  
        WHEN 'v' THEN 'VOLATILE'
    END as volatility_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'private')
  AND p.proname NOT LIKE 'pg_%'  -- Exclude system functions
  AND p.proname NOT LIKE 'information_schema_%'  -- Exclude info schema functions
ORDER BY 
    n.nspname,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM unnest(p.proconfig) as config 
            WHERE config LIKE 'search_path=%'
        ) THEN 1
        ELSE 0
    END,  -- Show functions needing fixes first
    p.proname;

-- Summary count
SELECT 
    'SUMMARY' as type,
    COUNT(*) as total_functions,
    COUNT(CASE WHEN NOT EXISTS (
        SELECT 1 FROM unnest(p.proconfig) as config 
        WHERE config LIKE 'search_path=%'
    ) THEN 1 END) as functions_needing_fix,
    COUNT(CASE WHEN EXISTS (
        SELECT 1 FROM unnest(p.proconfig) as config 
        WHERE config LIKE 'search_path=%'
    ) THEN 1 END) as functions_already_fixed
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname IN ('public', 'private')
  AND p.proname NOT LIKE 'pg_%'
  AND p.proname NOT LIKE 'information_schema_%';

-- Show functions that match the warning list
WITH warning_functions AS (
    SELECT unnest(ARRAY[
        'increment_active_user_count',
        'update_user_activity_updated_at',
        'get_database_size',
        'accept_organization_invitation',
        'update_updated_at_column',
        'update_stage_progress_on_journal_entry',
        'get_active_sponsorships_for_sponsor',
        'get_sponsor_practitioner_alerts',
        'get_pending_invitations_for_sponsor',
        'create_coach_connection',
        'get_practitioner_connection_details',
        'update_organization_active_user_count',
        'archive_user',
        'reactivate_user',
        'validate_organization_user_limit',
        'get_all_support_tickets',
        'get_all_practitioner_details',
        'trigger_update_organization_user_count',
        'handle_new_user',
        'get_user_organization_id',
        'set_updated_at',
        'update_organization_logo',
        'get_organization_activity_overview',
        'get_organization_stats',
        'archive_organization_user',
        'update_user_roles',
        'delete_user_and_profile',
        'update_organization_info',
        'practitioner_stage_memos_set_updated',
        'get_user_active_virtue_details',
        'create_profile_for_user'
    ]) as func_name
)
SELECT 
    'WARNING_FUNCTIONS_STATUS' as analysis_type,
    wf.func_name,
    CASE 
        WHEN p.proname IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as function_exists,
    CASE 
        WHEN p.proname IS NOT NULL AND EXISTS (
            SELECT 1 FROM unnest(p.proconfig) as config 
            WHERE config LIKE 'search_path=%'
        ) THEN 'ALREADY_FIXED'
        WHEN p.proname IS NOT NULL THEN 'NEEDS_FIX'
        ELSE 'N/A'
    END as fix_status,
    n.nspname as schema_name,
    pg_get_function_identity_arguments(p.oid) as signature
FROM warning_functions wf
LEFT JOIN pg_proc p ON p.proname = wf.func_name
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid AND n.nspname IN ('public', 'private')
ORDER BY 
    CASE WHEN p.proname IS NOT NULL THEN 0 ELSE 1 END,
    wf.func_name;