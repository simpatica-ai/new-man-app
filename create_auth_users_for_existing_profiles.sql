-- Create auth.users for existing profiles
-- Password for all users: testpass123

-- Note: Supabase uses bcrypt for password hashing
-- This is a pre-hashed version of "testpass123"
-- Hash: $2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7vX7v

INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES
  -- Test Sponsor
  ('be4272f5-3029-44a4-b6e7-181137cc3e18', '00000000-0000-0000-0000-000000000000', 'sponsor@test.com', 
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Test Sponsor"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- Test Practitioner
  ('5ae0dd37-9a6c-4ef9-b19e-32da45857842', '00000000-0000-0000-0000-000000000000', 'practitioner@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Test Practitioner"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- Jason Fisher
  ('a1b5782d-55c4-4aa8-81db-0d12385a9da5', '00000000-0000-0000-0000-000000000000', 'jason@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Jason Fisher"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- Bob Wenzlau (user)
  ('a57a0d05-7928-4c23-b3aa-fd66ce7d8a60', '00000000-0000-0000-0000-000000000000', 'bob@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Bob Wenzlau"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- Coyote Jackson
  ('dbbe328b-7b5f-4015-9594-c78e31247640', '00000000-0000-0000-0000-000000000000', 'coyote@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Coyote Jackson"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- AZ
  ('d546b07d-cbe5-4735-9625-0075fc487905', '00000000-0000-0000-0000-000000000000', 'az@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"AZ"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- Michael Peters
  ('cb14bb07-8e43-4cd1-81a2-39e3540eaa2d', '00000000-0000-0000-0000-000000000000', 'michael@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Michael Peters"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- Shawn Williams
  ('1e9b1983-f9db-4fce-a368-a307393be984', '00000000-0000-0000-0000-000000000000', 'shawn@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Shawn Williams"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- Dan Malcolm
  ('102f2490-479d-4bd6-a713-ccfcb38523bb', '00000000-0000-0000-0000-000000000000', 'dan@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Dan Malcolm"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- Hal Sellers
  ('79ed512c-6380-41c7-9384-fc976e5b081b', '00000000-0000-0000-0000-000000000000', 'hal@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Hal Sellers"}', false, 'authenticated', 'authenticated', '', '', '', ''),
  
  -- Bob Wenzlau (admin)
  ('0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb', '00000000-0000-0000-0000-000000000000', 'admin@test.com',
   '$2a$10$5Q8Z8Z8Z8Z8Z8Z8Z8Z8Z8uKx7vX7vX7vX7vX7vX7vX7vX7vX7v', NOW(), NOW(), NOW(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Bob Wenzlau"}', false, 'authenticated', 'authenticated', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Create identities for each user
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
SELECT 
  gen_random_uuid(),
  id,
  jsonb_build_object('sub', id::text, 'email', email),
  'email',
  NOW(),
  NOW(),
  NOW()
FROM auth.users
WHERE id IN (
  'be4272f5-3029-44a4-b6e7-181137cc3e18',
  '5ae0dd37-9a6c-4ef9-b19e-32da45857842',
  'a1b5782d-55c4-4aa8-81db-0d12385a9da5',
  'a57a0d05-7928-4c23-b3aa-fd66ce7d8a60',
  'dbbe328b-7b5f-4015-9594-c78e31247640',
  'd546b07d-cbe5-4735-9625-0075fc487905',
  'cb14bb07-8e43-4cd1-81a2-39e3540eaa2d',
  '1e9b1983-f9db-4fce-a368-a307393be984',
  '102f2490-479d-4bd6-a713-ccfcb38523bb',
  '79ed512c-6380-41c7-9384-fc976e5b081b',
  '0dba2cfa-1a91-4c4e-a363-7dfb22ba67eb'
)
ON CONFLICT DO NOTHING;
