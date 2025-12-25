-- Test if we can query practitioner_assignments table directly
-- This will help diagnose why organizational policies failed

DO $$
DECLARE
    assignment_count integer;
    test_record RECORD;
BEGIN
    RAISE NOTICE '=== PRACTITIONER ASSIGNMENTS ACCESS TEST ===';
    RAISE NOTICE '';
    
    -- Test basic access to practitioner_assignments table
    BEGIN
        SELECT COUNT(*) INTO assignment_count FROM practitioner_assignments;
        RAISE NOTICE '✅ practitioner_assignments: Can query table (% records)', assignment_count;
        
        -- Show sample data structure if records exist
        IF assignment_count > 0 THEN
            RAISE NOTICE '';
            RAISE NOTICE 'Sample assignment record:';
            FOR test_record IN
                SELECT 
                    practitioner_id,
                    supervisor_id,
                    supervisor_role,
                    organization_id,
                    active
                FROM practitioner_assignments 
                LIMIT 1
            LOOP
                RAISE NOTICE '  practitioner_id: %', test_record.practitioner_id;
                RAISE NOTICE '  supervisor_id: %', test_record.supervisor_id;
                RAISE NOTICE '  supervisor_role: %', test_record.supervisor_role;
                RAISE NOTICE '  organization_id: %', test_record.organization_id;
                RAISE NOTICE '  active: %', test_record.active;
            END LOOP;
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ practitioner_assignments: Query failed - %', SQLERRM;
        RAISE NOTICE '   This explains why organizational policies failed';
    END;
    
    RAISE NOTICE '';
    
    -- Test a simple JOIN like what the policy would do
    BEGIN
        SELECT COUNT(*) INTO assignment_count 
        FROM practitioner_assignments pa
        JOIN profiles p ON p.id = pa.practitioner_id
        WHERE pa.active = true
        LIMIT 1;
        
        RAISE NOTICE '✅ JOIN test: practitioner_assignments + profiles works';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ JOIN test: practitioner_assignments + profiles failed - %', SQLERRM;
        RAISE NOTICE '   This is likely why the organizational policies caused 500 errors';
    END;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== TEST COMPLETE ===';
    
END $$;