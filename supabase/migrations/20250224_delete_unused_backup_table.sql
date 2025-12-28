-- Remove unused backup table profiles_backup_20250217
-- This table was created as a backup during migration 20250217_remove_individual_users_organization.sql
-- It's not used by the application and is causing security warnings

-- First, check if the table exists and show its info
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_backup_20250217' AND table_schema = 'public') THEN
        RAISE NOTICE 'Found profiles_backup_20250217 table - proceeding with deletion';
        
        -- Show table info before deletion
        RAISE NOTICE 'Table created: 2025-02-17 as backup during organization migration';
        RAISE NOTICE 'Table purpose: Backup of profiles before removing Individual Users organization';
        
        -- Drop the backup table and its policies
        DROP TABLE IF EXISTS public.profiles_backup_20250217 CASCADE;
        
        RAISE NOTICE 'Successfully deleted profiles_backup_20250217 table and all associated policies';
        RAISE NOTICE 'Security warnings for this table should now be resolved';
    ELSE
        RAISE NOTICE 'profiles_backup_20250217 table not found - nothing to delete';
    END IF;
END $$;

-- Verify the table is gone
SELECT 
    'Table Deletion Verification' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_backup_20250217' AND table_schema = 'public')
        THEN 'ERROR: Table still exists'
        ELSE 'SUCCESS: Table deleted'
    END as status;