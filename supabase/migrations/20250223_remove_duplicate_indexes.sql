-- Remove duplicate indexes to improve database performance
-- Based on analysis showing multiple indexes on the same columns

-- sponsor_chat_messages table - connection_id column has 3 duplicate indexes
-- Keep the most descriptive one: idx_sponsor_chat_messages_connection_id
DROP INDEX IF EXISTS idx_scm_connection_id;
DROP INDEX IF EXISTS idx_sponsor_chat_messages_connection;

-- sponsor_chat_messages table - sender_id column has 2 duplicate indexes  
-- Keep the most descriptive one: idx_sponsor_chat_messages_sender
DROP INDEX IF EXISTS idx_scm_sender_id;

-- sponsor_connections table - sponsor_user_id column has 2 duplicate indexes
-- Keep the most descriptive one: idx_sponsor_connections_sponsor_user_id
DROP INDEX IF EXISTS idx_sponsor_connections_sponsor;

-- user_assessment_defects table - assessment_id column has 2 duplicate indexes
-- Keep the most descriptive one: idx_user_assessment_defects_assessment_id
DROP INDEX IF EXISTS idx_assessment_defects_assessment;

-- Verification and logging
DO $$
DECLARE
    indexes_removed integer := 0;
BEGIN
    -- Count how many indexes we attempted to remove
    -- Note: This is approximate since we use IF EXISTS
    indexes_removed := 5; -- We attempted to remove 5 duplicate indexes
    
    RAISE NOTICE 'Duplicate index cleanup completed';
    RAISE NOTICE 'Attempted to remove % duplicate indexes', indexes_removed;
    RAISE NOTICE 'Kept indexes: idx_sponsor_chat_messages_connection_id, idx_sponsor_chat_messages_sender, idx_sponsor_connections_sponsor_user_id, idx_user_assessment_defects_assessment_id';
    RAISE NOTICE 'This should improve database performance by reducing index maintenance overhead';
END $$;