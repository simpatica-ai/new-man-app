-- Test if auth functions are working in the current context
SELECT 
    current_user as current_db_user,
    session_user as session_db_user,
    current_setting('role') as current_role;