-- Investigate sponsor table structure before adding policies
-- This will help us understand what sponsor relationships exist

DO $$
DECLARE
    table_exists boolean;
    column_record RECORD;
BEGIN
    RAISE NOTICE '=== SPONSOR TABLE INVESTIGATION ===';
    RAISE NOTICE '';
    
    -- Check sponsor_connections table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sponsor_connections'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ sponsor_connections table EXISTS';
        RAISE NOTICE 'Columns in sponsor_connections:';
        
        FOR column_record IN
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'sponsor_connections'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: % (nullable: %)', 
                column_record.column_name, 
                column_record.data_type, 
                column_record.is_nullable;
        END LOOP;
        
        -- Check if there are any records
        DECLARE
            record_count integer;
        BEGIN
            SELECT COUNT(*) INTO record_count FROM sponsor_connections LIMIT 100;
            RAISE NOTICE 'Record count: %', record_count;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error querying sponsor_connections: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE '❌ sponsor_connections table does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check sponsor_relationships table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sponsor_relationships'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE '✅ sponsor_relationships table EXISTS';
        RAISE NOTICE 'Columns in sponsor_relationships:';
        
        FOR column_record IN
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = 'sponsor_relationships'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '  - %: % (nullable: %)', 
                column_record.column_name, 
                column_record.data_type, 
                column_record.is_nullable;
        END LOOP;
        
        -- Check if there are any records
        DECLARE
            record_count integer;
        BEGIN
            SELECT COUNT(*) INTO record_count FROM sponsor_relationships LIMIT 100;
            RAISE NOTICE 'Record count: %', record_count;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error querying sponsor_relationships: %', SQLERRM;
        END;
        
    ELSE
        RAISE NOTICE '❌ sponsor_relationships table does NOT exist';
    END IF;
    
    RAISE NOTICE '';
    
    -- Check for other potential sponsor tables
    RAISE NOTICE 'Other tables with "sponsor" in the name:';
    FOR column_record IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name LIKE '%sponsor%'
        ORDER BY table_name
    LOOP
        RAISE NOTICE '  - %', column_record.table_name;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== INVESTIGATION COMPLETE ===';
    RAISE NOTICE 'Use this information to create proper sponsor access policies';
    
END $$;