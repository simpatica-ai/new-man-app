-- Diagnose why test user login is failing

-- Check if auth entries were created
SELECT 
    'Auth Users Check' as check_type,
    email,
    id,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at,
    aud,
    role
FROM auth.users 
WHERE email LIKE 'test.%@example.com'
ORDER BY email;

-- Check if profiles exist for test users
SELECT 
    'Profiles Check' as check_type,
    id,
    full_name,
    role,
    organization_id
FROM profiles 
WHERE full_name LIKE '%Test%'
ORDER BY full_name;

-- Check if there are any auth schema permission issues
DO $$
BEGIN
    BEGIN
        -- Try to access auth.users table
        PERFORM COUNT(*) FROM auth.users LIMIT 1;
        RAISE NOTICE '✅ Can access auth.users table';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Cannot access auth.users table: %', SQLERRM;
    END;
    
    BEGIN
        -- Try to insert a test record (will rollback)
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
        VALUES (gen_random_uuid(), 'test@test.com', 'test', NOW(), NOW(), NOW(), 'authenticated', 'authenticated');
        RAISE NOTICE '✅ Can insert into auth.users table';
        -- Rollback the test insert
        RAISE EXCEPTION 'Test insert - rolling back';
    EXCEPTION WHEN OTHERS THEN
        IF SQLERRM LIKE '%Test insert%' THEN
            RAISE NOTICE '✅ Insert test completed (rolled back as expected)';
        ELSE
            RAISE NOTICE '❌ Cannot insert into auth.users table: %', SQLERRM;
        END IF;
    END;
END $$;