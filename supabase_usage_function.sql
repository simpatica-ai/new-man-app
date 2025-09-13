-- Create function to get database size in MB
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    db_size_bytes BIGINT;
    db_size_mb INTEGER;
BEGIN
    -- Get total database size in bytes
    SELECT pg_database_size(current_database()) INTO db_size_bytes;
    
    -- Convert to MB
    db_size_mb := (db_size_bytes / 1024 / 1024)::INTEGER;
    
    RETURN db_size_mb;
END;
$$;
