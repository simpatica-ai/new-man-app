-- Fix function search path security warnings - Version 2
-- This handles functions with parameters correctly

DO $$
DECLARE
    func_record RECORD;
    functions_fixed integer := 0;
    sql_statement text;
BEGIN
    -- Get all functions that need search_path fixes
    -- This query finds functions without a fixed search_path
    FOR func_record IN 
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as function_args,
            p.oid as function_oid
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname IN ('public', 'private')
        AND p.proname IN (
            'increment_active_user_count',
            'accept_organization_invitation', 
            'get_active_sponsorships_for_sponsor',
            'get_sponsor_practitioner_alerts',
            'get_pending_invitations_for_sponsor',
            'create_coach_connection',
            'get_practitioner_connection_details',
            'update_organization_active_user_count',
            'archive_user',
            'reactivate_user',
            'validate_organization_user_limit',
            'update_organization_logo',
            'get_organization_activity_overview',
            'get_organization_stats',
            'archive_organization_user',
            'update_user_roles',
            'update_organization_info',
            'get_user_active_virtue_details'
        )
        ORDER BY n.nspname, p.proname
    LOOP
        BEGIN
            -- Build the ALTER FUNCTION statement with correct signature
            sql_statement := format('ALTER FUNCTION %I.%I(%s) SET search_path = %L',
                func_record.schema_name,
                func_record.function_name,
                func_record.function_args,
                CASE 
                    WHEN func_record.schema_name = 'private' THEN 'private, public'
                    ELSE 'public'
                END
            );
            
            -- Execute the statement
            EXECUTE sql_statement;
            
            functions_fixed := functions_fixed + 1;
            RAISE NOTICE 'Fixed: %.%(%)', 
                func_record.schema_name, 
                func_record.function_name,
                func_record.function_args;
                
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to fix %.%(%): %', 
                func_record.schema_name, 
                func_record.function_name,
                func_record.function_args,
                SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Function search path security fix v2 completed';
    RAISE NOTICE 'Successfully fixed % functions', functions_fixed;
END $$;