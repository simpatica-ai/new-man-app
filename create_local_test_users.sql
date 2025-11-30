-- ============================================================================
-- CREATE LOCAL TEST USERS FOR SUPABASE
-- Works with Supabase's auth system
-- ============================================================================

-- Create test sponsor user
-- Password will be: testpassword123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '11111111-2222-3333-4444-555555555555',
  'authenticated',
  'authenticated',
  'sponsor@test.com',
  '$2a$10$rqiU8HqZGKOKH7VqKqKqKOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq', -- This won't work, we'll use a different method
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Sarah Sponsor"}',
  NOW(),
  NOW(),
  NOW()
);

-- Create profile for sponsor
INSERT INTO public.profiles (
  id,
  full_name,
  role
) VALUES (
  '11111111-2222-3333-4444-555555555555',
  'Sarah Sponsor',
  'sponsor'
);

-- Create test practitioner user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_sign_in_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  '22222222-3333-4444-5555-666666666666',
  'authenticated',
  'authenticated',
  'practitioner@test.com',
  '$2a$10$rqiU8HqZGKOKH7VqKqKqKOqKqKqKqKqKqKqKqKqKqKqKqKqKqKqKq',
  NOW(),
  NOW(),
  '',
  '',
  '',
  '',
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"John Practitioner"}',
  NOW(),
  NOW(),
  NOW()
);

-- Create profile for practitioner
INSERT INTO public.profiles (
  id,
  full_name,
  role
) VALUES (
  '22222222-3333-4444-5555-666666666666',
  'John Practitioner',
  'practitioner'
);
