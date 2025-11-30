-- ============================================================================
-- CREATE TEST SPONSOR PROFILE (FIXED VERSION)
-- Date: 2025-01-15
-- 
-- Creates a test sponsor profile for individual practitioner mode testing
-- This sponsor works with practitioners who are NOT part of an organization
-- 
-- FIXES:
-- - Removed email column from profiles (stored in auth.users)
-- - Added explicit DEFAULT for all SERIAL id columns
-- - Fixed all DO block delimiters to use $$
-- - Added proper error handling
-- ============================================================================

-- Delete existing test sponsor if exists (to ensure clean state)
DELETE FROM auth.users WHERE email = 'sponsor@test.com';

-- Create test sponsor user in auth.users
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data
) VALUES (
  '11111111-2222-3333-4444-555555555555'::UUID,
  'sponsor@test.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Sarah Sponsor", "role": "sponsor"}'::JSONB,
  '{}'::JSONB
);

-- Create corresponding profile
INSERT INTO public.profiles (
  id,
  full_name,
  role
) VALUES (
  '11111111-2222-3333-4444-555555555555'::UUID,
  'Sarah Sponsor',
  'sponsor'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Delete existing test practitioner if exists (to ensure clean state)
DELETE FROM auth.users WHERE email = 'individual.practitioner@test.com';

-- Create test individual practitioner
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  raw_app_meta_data
) VALUES (
  '22222222-3333-4444-5555-666666666666'::UUID,
  'individual.practitioner@test.com',
  crypt('testpassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "John Individual", "role": "practitioner"}'::JSONB,
  '{}'::JSONB
);

-- Create corresponding profile for individual practitioner
INSERT INTO public.profiles (
  id,
  full_name,
  role
) VALUES (
  '22222222-3333-4444-5555-666666666666'::UUID,
  'John Individual',
  'practitioner'
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;

-- Create sponsor-practitioner relationship (sponsor_relationships table)
INSERT INTO public.sponsor_relationships (
  sponsor_id,
  practitioner_id,
  status
) VALUES (
  '11111111-2222-3333-4444-555555555555'::UUID,
  '22222222-3333-4444-5555-666666666666'::UUID,
  'active'
) ON CONFLICT DO NOTHING;

-- Create sponsor-practitioner connection (sponsor_connections table - if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_connections') THEN
    INSERT INTO public.sponsor_connections (
      id,
      practitioner_user_id,
      sponsor_user_id,
      status
    ) VALUES (
      DEFAULT,
      '22222222-3333-4444-5555-666666666666'::UUID,
      '11111111-2222-3333-4444-555555555555'::UUID,
      'active'
    );
    RAISE NOTICE 'Sponsor connection created successfully';
  ELSE
    RAISE NOTICE 'sponsor_connections table does not exist - skipping connection creation';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating sponsor connection: %', SQLERRM;
END $$;

-- Add sample virtue progress (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_virtue_stage_progress') THEN
    INSERT INTO public.user_virtue_stage_progress (
      user_id,
      virtue_id,
      stage_number,
      status
    ) VALUES 
      ('22222222-3333-4444-5555-666666666666'::UUID, 1, 1, 'completed'),
      ('22222222-3333-4444-5555-666666666666'::UUID, 1, 2, 'in_progress'),
      ('22222222-3333-4444-5555-666666666666'::UUID, 2, 1, 'in_progress');
    RAISE NOTICE 'Virtue progress created successfully';
  ELSE
    RAISE NOTICE 'user_virtue_stage_progress table does not exist - skipping progress creation';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating virtue progress: %', SQLERRM;
END $$;

-- Add sample memos (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_visible_memos') THEN
    INSERT INTO public.sponsor_visible_memos (
      id,
      user_id,
      virtue_id,
      stage_number,
      memo_text,
      practitioner_updated_at,
      sponsor_read_at
    ) VALUES 
      (
        DEFAULT,
        '22222222-3333-4444-5555-666666666666'::UUID,
        1,
        1,
        '<p>This is my reflection on dismantling pride. Working on recognizing when my ego gets in the way of genuine connections.</p>',
        NOW() - INTERVAL '2 days',
        NOW() - INTERVAL '1 day'
      ),
      (
        DEFAULT,
        '22222222-3333-4444-5555-666666666666'::UUID,
        1,
        2,
        '<p>Building humility has been challenging but rewarding. Practicing asking for help more often.</p>',
        NOW() - INTERVAL '1 hour',
        NULL
      ),
      (
        DEFAULT,
        '22222222-3333-4444-5555-666666666666'::UUID,
        2,
        1,
        '<p>Starting to work on patience. Most impatient in traffic and with technology.</p>',
        NOW() - INTERVAL '3 hours',
        NULL
      );
    RAISE NOTICE 'Sample memos created successfully';
  ELSE
    RAISE NOTICE 'sponsor_visible_memos table does not exist - skipping memo creation';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating sponsor visible memos: %', SQLERRM;
END $$;

-- Add sample chat messages (only if tables exist)
DO $$
DECLARE
    connection_id INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_chat_messages') 
       AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_connections') THEN
        
        -- Get the connection ID
        SELECT id INTO connection_id 
        FROM public.sponsor_connections 
        WHERE practitioner_user_id = '22222222-3333-4444-5555-666666666666'::UUID 
        AND sponsor_user_id = '11111111-2222-3333-4444-555555555555'::UUID;
        
        IF connection_id IS NOT NULL THEN
            INSERT INTO public.sponsor_chat_messages (
              id,
              connection_id,
              sender_id,
              receiver_id,
              message_text,
              read_at
            ) VALUES 
              (
                DEFAULT,
                connection_id,
                '11111111-2222-3333-4444-555555555555'::UUID,
                '22222222-3333-4444-5555-666666666666'::UUID,
                'Hi John! Great insights about asking for help. How did that feel?',
                NOW() - INTERVAL '1 hour'
              ),
              (
                DEFAULT,
                connection_id,
                '22222222-3333-4444-5555-666666666666'::UUID,
                '11111111-2222-3333-4444-555555555555'::UUID,
                'Thanks Sarah! It was scary at first, but my colleague was really helpful.',
                NOW() - INTERVAL '30 minutes'
              ),
              (
                DEFAULT,
                connection_id,
                '11111111-2222-3333-4444-555555555555'::UUID,
                '22222222-3333-4444-5555-666666666666'::UUID,
                'That vulnerability you showed is actually a sign of strength and wisdom.',
                NULL
              );
            RAISE NOTICE 'Sample chat messages created successfully';
        ELSE
            RAISE NOTICE 'No sponsor connection found - skipping chat message creation';
        END IF;
    ELSE
        RAISE NOTICE 'Required tables do not exist - skipping chat message creation';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating chat messages: %', SQLERRM;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify test sponsor was created
SELECT 
  'Test sponsor created successfully' as status,
  p.full_name,
  u.email,
  p.role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = '11111111-2222-3333-4444-555555555555'::UUID;

-- Verify test individual practitioner was created
SELECT 
  'Test individual practitioner created successfully' as status,
  p.full_name,
  u.email,
  p.role
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.id = '22222222-3333-4444-5555-666666666666'::UUID;

-- ============================================================================
-- TEST CREDENTIALS
-- ============================================================================

/*
TEST SPONSOR LOGIN:
Email: sponsor@test.com
Password: testpassword123
Role: ind-sponsor (Individual Sponsor)

TEST INDIVIDUAL PRACTITIONER LOGIN:
Email: individual.practitioner@test.com  
Password: testpassword123
Role: ind-practitioner (Individual Practitioner)

Both users are in individual mode (no organization)
*/