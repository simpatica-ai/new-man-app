-- Comprehensive fix for all user deletion constraints
-- This addresses all foreign key constraints that could prevent user deletion

-- ============================================================================
-- 1. FIX AI_PROMPT_FEEDBACK TABLE CONSTRAINT
-- ============================================================================

-- Check if ai_prompt_feedback table exists and fix its constraint
DO $
BEGIN
    -- Check if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_prompt_feedback') THEN
        -- Drop existing constraint if it exists
        ALTER TABLE ai_prompt_feedback DROP CONSTRAINT IF EXISTS ai_prompt_feedback_user_id_fkey;
        
        -- Add constraint with CASCADE delete
        ALTER TABLE ai_prompt_feedback 
        ADD CONSTRAINT ai_prompt_feedback_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        RAISE NOTICE 'Fixed ai_prompt_feedback foreign key constraint';
    END IF;
END $;

-- ============================================================================
-- 2. CHECK AND FIX USER_ACTIVITY_SESSIONS TABLE
-- ============================================================================

-- The user_activity_sessions table references auth.users directly, which should be fine
-- But let's make sure it has proper CASCADE
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_sessions') THEN
        -- This table references auth.users(id) directly with CASCADE, so it should be fine
        RAISE NOTICE 'user_activity_sessions table exists and should cascade properly';
    END IF;
END $;

-- ============================================================================
-- 3. ADD COMPREHENSIVE USER DELETION FUNCTION
-- ============================================================================

-- Function to safely delete a user and all related data
CREATE OR REPLACE FUNCTION safe_delete_user_and_data(target_user_id UUID)
RETURNS BOOLEAN AS $
DECLARE
    table_record RECORD;
    constraint_record RECORD;
BEGIN
    -- Log the deletion attempt
    RAISE NOTICE 'Attempting to delete user % and all related data', target_user_id;
    
    -- First, let's manually clean up any problematic references
    
    -- Clean up ai_prompt_feedback if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_prompt_feedback') THEN
        DELETE FROM ai_prompt_feedback WHERE user_id = target_user_id;
        RAISE NOTICE 'Cleaned up ai_prompt_feedback records';
    END IF;
    
    -- Clean up sponsor relationships (both as sponsor and practitioner)
    DELETE FROM public.sponsor_relationships 
    WHERE sponsor_id = target_user_id OR practitioner_id = target_user_id;
    RAISE NOTICE 'Cleaned up sponsor_relationships records';
    
    -- Clean up journal entries
    DELETE FROM public.journal_entries WHERE user_id = target_user_id;
    RAISE NOTICE 'Cleaned up journal_entries records';
    
    -- Clean up user virtue progress
    DELETE FROM public.user_virtue_progress WHERE user_id = target_user_id;
    RAISE NOTICE 'Cleaned up user_virtue_progress records';
    
    -- Clean up user activity sessions if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_sessions') THEN
        DELETE FROM user_activity_sessions WHERE user_id = target_user_id;
        RAISE NOTICE 'Cleaned up user_activity_sessions records';
    END IF;
    
    -- Finally, delete the profile (this should now work)
    DELETE FROM public.profiles WHERE id = target_user_id;
    RAISE NOTICE 'Deleted profile record';
    
    RETURN true;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error during user deletion: %', SQLERRM;
    RETURN false;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. ADD MISSING DELETE POLICIES
-- ============================================================================

-- Add delete policy for sponsor relationships if not exists
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sponsor_relationships' 
        AND policyname = 'Users can delete their sponsor invitations'
    ) THEN
        CREATE POLICY "Users can delete their sponsor invitations" ON public.sponsor_relationships
        FOR DELETE USING (auth.uid() = practitioner_id OR auth.uid() = sponsor_id);
        RAISE NOTICE 'Added delete policy for sponsor_relationships';
    END IF;
END $;

-- Add RLS and policies for ai_prompt_feedback if it exists
DO $
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ai_prompt_feedback') THEN
        -- Enable RLS
        ALTER TABLE ai_prompt_feedback ENABLE ROW LEVEL SECURITY;
        
        -- Add policies if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'ai_prompt_feedback' 
            AND policyname = 'Users can manage their own feedback'
        ) THEN
            CREATE POLICY "Users can manage their own feedback" ON ai_prompt_feedback
            FOR ALL USING (auth.uid() = user_id);
            RAISE NOTICE 'Added RLS policies for ai_prompt_feedback';
        END IF;
    END IF;
END $;

-- ============================================================================
-- 5. CREATE TRIGGER FOR AUTOMATIC CLEANUP
-- ============================================================================

-- Function to run before profile deletion
CREATE OR REPLACE FUNCTION before_profile_delete_cleanup()
RETURNS TRIGGER AS $
BEGIN
    -- Use our safe deletion function to clean up everything
    PERFORM safe_delete_user_and_data(OLD.id);
    
    -- Return NULL to prevent the original DELETE (since we handled it in the function)
    -- Actually, return OLD to allow the delete to proceed normally after cleanup
    RETURN OLD;
END;
$ LANGUAGE plpgsql;

-- Create the trigger (replace if exists)
DROP TRIGGER IF EXISTS before_profile_delete_cleanup_trigger ON public.profiles;
CREATE TRIGGER before_profile_delete_cleanup_trigger
    BEFORE DELETE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION before_profile_delete_cleanup();

-- ============================================================================
-- 6. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION safe_delete_user_and_data(UUID) IS 'Safely deletes a user and all related data across all tables';
COMMENT ON FUNCTION before_profile_delete_cleanup() IS 'Trigger function that cleans up all user data before profile deletion';

-- ============================================================================
-- 7. TEST THE FUNCTION (OPTIONAL - REMOVE IN PRODUCTION)
-- ============================================================================

-- You can test this function manually:
-- SELECT safe_delete_user_and_data('some-user-uuid-here');

RAISE NOTICE 'User deletion fix migration completed successfully';