-- Fix function search path security warnings
-- This prevents potential SQL injection through schema manipulation
-- Simple approach that tries to fix each function individually with error handling

DO $$
BEGIN
    -- Try to fix each function individually with error handling
    
    -- Trigger functions
    BEGIN
        ALTER FUNCTION public.update_user_activity_updated_at() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.update_user_activity_updated_at';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.update_user_activity_updated_at (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.update_updated_at_column() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.update_updated_at_column';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.update_updated_at_column (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.set_updated_at() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.set_updated_at';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.set_updated_at (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.practitioner_stage_memos_set_updated() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.practitioner_stage_memos_set_updated';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.practitioner_stage_memos_set_updated (%)', SQLERRM;
    END;
    
    -- User management functions
    BEGIN
        ALTER FUNCTION public.handle_new_user() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.handle_new_user';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.handle_new_user (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.archive_user() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.archive_user';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.archive_user (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.reactivate_user() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.reactivate_user';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.reactivate_user (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.delete_user_and_profile() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.delete_user_and_profile';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.delete_user_and_profile (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.update_user_roles() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.update_user_roles';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.update_user_roles (%)', SQLERRM;
    END;
    
    -- Organization functions
    BEGIN
        ALTER FUNCTION public.accept_organization_invitation() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.accept_organization_invitation';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.accept_organization_invitation (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.increment_active_user_count() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.increment_active_user_count';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.increment_active_user_count (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.update_organization_active_user_count() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.update_organization_active_user_count';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.update_organization_active_user_count (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.trigger_update_organization_user_count() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.trigger_update_organization_user_count';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.trigger_update_organization_user_count (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.validate_organization_user_limit() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.validate_organization_user_limit';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.validate_organization_user_limit (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.archive_organization_user() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.archive_organization_user';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.archive_organization_user (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.update_organization_info() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.update_organization_info';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.update_organization_info (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.update_organization_logo() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.update_organization_logo';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.update_organization_logo (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_user_organization_id() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_user_organization_id';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_user_organization_id (%)', SQLERRM;
    END;
    
    -- Query functions
    BEGIN
        ALTER FUNCTION public.get_database_size() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_database_size';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_database_size (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_active_sponsorships_for_sponsor() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_active_sponsorships_for_sponsor';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_active_sponsorships_for_sponsor (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_sponsor_practitioner_alerts() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_sponsor_practitioner_alerts';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_sponsor_practitioner_alerts (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_pending_invitations_for_sponsor() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_pending_invitations_for_sponsor';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_pending_invitations_for_sponsor (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_practitioner_connection_details() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_practitioner_connection_details';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_practitioner_connection_details (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_all_support_tickets() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_all_support_tickets';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_all_support_tickets (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_all_practitioner_details() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_all_practitioner_details';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_all_practitioner_details (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_organization_activity_overview() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_organization_activity_overview';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_organization_activity_overview (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_organization_stats() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_organization_stats';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_organization_stats (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.get_user_active_virtue_details() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.get_user_active_virtue_details';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.get_user_active_virtue_details (%)', SQLERRM;
    END;
    
    -- Connection and progress functions
    BEGIN
        ALTER FUNCTION public.create_coach_connection() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.create_coach_connection';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.create_coach_connection (%)', SQLERRM;
    END;
    
    BEGIN
        ALTER FUNCTION public.update_stage_progress_on_journal_entry() SET search_path = 'public';
        RAISE NOTICE 'Fixed: public.update_stage_progress_on_journal_entry';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: public.update_stage_progress_on_journal_entry (%)', SQLERRM;
    END;
    
    -- Private schema function
    BEGIN
        ALTER FUNCTION private.create_profile_for_user() SET search_path = 'private, public';
        RAISE NOTICE 'Fixed: private.create_profile_for_user';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Skipped: private.create_profile_for_user (%)', SQLERRM;
    END;
    
    RAISE NOTICE 'Function search path security fix completed';
    RAISE NOTICE 'Check the notices above to see which functions were fixed and which were skipped';
END $$;