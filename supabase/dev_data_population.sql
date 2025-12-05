-- ============================================================================
-- DEV DATABASE POPULATION SCRIPT
-- Organizational Model Test Data
-- ============================================================================
-- This script populates the development database with realistic organizational
-- data for testing the organizational model implementation.
-- 
-- Run this script AFTER the organizational model migration has been applied.
-- ============================================================================

-- Clear existing test data (be careful in production!)
-- DELETE FROM public.organization_invitations WHERE organization_id IN (SELECT id FROM public.organizations WHERE slug LIKE '%-test');
-- DELETE FROM public.practitioner_assignments WHERE organization_id IN (SELECT id FROM public.organizations WHERE slug LIKE '%-test');
-- DELETE FROM public.profiles WHERE organization_id IN (SELECT id FROM public.organizations WHERE slug LIKE '%-test');
-- DELETE FROM public.organizations WHERE slug LIKE '%-test';

-- ============================================================================
-- 1. CREATE SAMPLE VIRTUES (if not already present)
-- ============================================================================

-- Insert core virtues if they don't exist
INSERT INTO public.virtues (id, name, description, order_index) VALUES
  (1, 'Humility', 'The quality of being humble and modest, recognizing our limitations and the value of others', 1),
  (2, 'Honesty', 'The quality of being truthful and sincere in our words and actions', 2),
  (3, 'Gratitude', 'The quality of being thankful and appreciative of what we have', 3),
  (4, 'Self-Control', 'The ability to control our impulses, emotions, and behaviors', 4),
  (5, 'Mindfulness', 'The practice of being present and aware in the current moment', 5),
  (6, 'Patience', 'The capacity to accept delay, trouble, or suffering without getting angry or upset', 6),
  (7, 'Integrity', 'The quality of being honest and having strong moral principles', 7),
  (8, 'Compassion', 'The feeling of deep sympathy and sorrow for another who is stricken by misfortune', 8),
  (9, 'Healthy Boundaries', 'The ability to set appropriate limits in relationships and situations', 9),
  (10, 'Responsibility', 'The state of being accountable for our actions and their consequences', 10),
  (11, 'Vulnerability', 'The willingness to show uncertainty, risk, and emotional exposure', 11),
  (12, 'Respect', 'The feeling of deep admiration for someone or something elicited by their abilities, qualities, or achievements', 12)
ON CONFLICT (id) DO NOTHING;

-- Insert virtue stages for each virtue (4 stages each)
INSERT INTO public.virtue_stages (virtue_id, stage_number, title, description) VALUES
  -- Humility stages
  (1, 1, 'Assessment', 'Assess your current level of humility and identify areas for growth'),
  (1, 2, 'Reflection', 'Reflect on past experiences and how humility could have improved outcomes'),
  (1, 3, 'Practice', 'Practice humility in daily interactions and situations'),
  (1, 4, 'Integration', 'Integrate humility as a core part of your character'),
  
  -- Honesty stages
  (2, 1, 'Assessment', 'Evaluate your current level of honesty in various life areas'),
  (2, 2, 'Reflection', 'Reflect on times when dishonesty caused problems or missed opportunities'),
  (2, 3, 'Practice', 'Practice radical honesty in appropriate situations'),
  (2, 4, 'Integration', 'Make honesty a fundamental part of your identity'),
  
  -- Gratitude stages
  (3, 1, 'Assessment', 'Assess your current gratitude practices and mindset'),
  (3, 2, 'Reflection', 'Reflect on the good things in your life and their sources'),
  (3, 3, 'Practice', 'Develop daily gratitude practices and expressions'),
  (3, 4, 'Integration', 'Live with a grateful heart as your default state'),
  
  -- Self-Control stages
  (4, 1, 'Assessment', 'Identify areas where you struggle with self-control'),
  (4, 2, 'Reflection', 'Understand the triggers and patterns behind impulse control issues'),
  (4, 3, 'Practice', 'Implement strategies and techniques for better self-control'),
  (4, 4, 'Integration', 'Develop mastery over your impulses and reactions'),
  
  -- Mindfulness stages
  (5, 1, 'Assessment', 'Evaluate your current level of present-moment awareness'),
  (5, 2, 'Reflection', 'Reflect on how mindfulness could improve your daily experience'),
  (5, 3, 'Practice', 'Establish regular mindfulness and meditation practices'),
  (5, 4, 'Integration', 'Live with continuous awareness and presence'),
  
  -- Patience stages
  (6, 1, 'Assessment', 'Assess situations where you struggle with patience'),
  (6, 2, 'Reflection', 'Understand the root causes of impatience in your life'),
  (6, 3, 'Practice', 'Practice patience in challenging situations'),
  (6, 4, 'Integration', 'Develop deep patience as a character trait'),
  
  -- Integrity stages
  (7, 1, 'Assessment', 'Evaluate alignment between your values and actions'),
  (7, 2, 'Reflection', 'Reflect on times when you compromised your integrity'),
  (7, 3, 'Practice', 'Practice living according to your highest values'),
  (7, 4, 'Integration', 'Achieve consistent integrity in all areas of life'),
  
  -- Compassion stages
  (8, 1, 'Assessment', 'Assess your current level of compassion for others'),
  (8, 2, 'Reflection', 'Reflect on barriers to compassion in your life'),
  (8, 3, 'Practice', 'Practice compassionate responses in difficult situations'),
  (8, 4, 'Integration', 'Embody compassion as a way of being'),
  
  -- Healthy Boundaries stages
  (9, 1, 'Assessment', 'Evaluate your current boundary-setting abilities'),
  (9, 2, 'Reflection', 'Reflect on boundary violations and their consequences'),
  (9, 3, 'Practice', 'Practice setting and maintaining healthy boundaries'),
  (9, 4, 'Integration', 'Maintain consistent, healthy boundaries in all relationships'),
  
  -- Responsibility stages
  (10, 1, 'Assessment', 'Assess areas where you avoid or struggle with responsibility'),
  (10, 2, 'Reflection', 'Reflect on the impact of taking or avoiding responsibility'),
  (10, 3, 'Practice', 'Practice taking full responsibility for your actions and outcomes'),
  (10, 4, 'Integration', 'Live as a fully responsible and accountable person'),
  
  -- Vulnerability stages
  (11, 1, 'Assessment', 'Assess your comfort level with vulnerability'),
  (11, 2, 'Reflection', 'Reflect on how vulnerability could strengthen your relationships'),
  (11, 3, 'Practice', 'Practice appropriate vulnerability in safe relationships'),
  (11, 4, 'Integration', 'Embrace vulnerability as a source of strength and connection'),
  
  -- Respect stages
  (12, 1, 'Assessment', 'Evaluate how you show respect to others and yourself'),
  (12, 2, 'Reflection', 'Reflect on the importance of respect in relationships'),
  (12, 3, 'Practice', 'Practice showing genuine respect in all interactions'),
  (12, 4, 'Integration', 'Embody respect as a fundamental way of relating to others')
ON CONFLICT (virtue_id, stage_number) DO NOTHING;

-- ============================================================================
-- 2. CREATE SAMPLE ORGANIZATIONS
-- ============================================================================

-- Organization 1: Wellness Corp (Corporate wellness program)
INSERT INTO public.organizations (
  id,
  name, 
  slug, 
  logo_url,
  primary_color, 
  secondary_color,
  subscription_tier,
  subscription_status,
  max_users,
  active_user_count,
  settings,
  billing_email,
  created_at
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Wellness Corp', 
  'wellness-corp-test', 
  'https://example.com/wellness-corp-logo.png',
  '#2563eb', 
  '#64748b',
  'premium',
  'active',
  25,
  0, -- Will be updated by triggers
  '{"company_type": "corporate", "industry": "technology", "employee_count": 150}',
  'billing@wellness-corp.com',
  NOW() - INTERVAL '3 months'
);

-- Organization 2: Hope Therapy Center (Mental health practice)
INSERT INTO public.organizations (
  id,
  name, 
  slug, 
  logo_url,
  primary_color, 
  secondary_color,
  subscription_tier,
  subscription_status,
  max_users,
  active_user_count,
  settings,
  billing_email,
  created_at
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Hope Therapy Center', 
  'hope-therapy-test', 
  'https://example.com/hope-therapy-logo.png',
  '#7c3aed', 
  '#a78bfa',
  'basic',
  'active',
  15,
  0, -- Will be updated by triggers
  '{"practice_type": "therapy", "specialties": ["trauma", "addiction", "family"], "license_number": "MH12345"}',
  'admin@hopetherapy.com',
  NOW() - INTERVAL '2 months'
);

-- Organization 3: St. Mary's Parish (Religious organization)
INSERT INTO public.organizations (
  id,
  name, 
  slug, 
  logo_url,
  primary_color, 
  secondary_color,
  subscription_tier,
  subscription_status,
  max_users,
  active_user_count,
  settings,
  billing_email,
  created_at
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  'St. Mary''s Parish', 
  'st-marys-parish-test', 
  'https://example.com/st-marys-logo.png',
  '#059669', 
  '#34d399',
  'basic',
  'active',
  40,
  0, -- Will be updated by triggers
  '{"organization_type": "religious", "denomination": "Catholic", "parish_size": 500}',
  'office@stmarysparish.org',
  NOW() - INTERVAL '1 month'
);

-- ============================================================================
-- 3. CREATE SAMPLE USERS WITH VARIOUS ROLES
-- ============================================================================

-- Wellness Corp Users
-- Admin who is also a coach and therapist (multi-role user)
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '11111111-aaaa-aaaa-aaaa-111111111111',
  'admin@wellness-corp-test.com', 
  'Sarah Johnson',
  ARRAY['admin', 'coach', 'therapist'], 
  '11111111-1111-1111-1111-111111111111', 
  true,
  NOW() - INTERVAL '2 hours',
  1, -- Humility
  2, -- Reflection stage
  NOW() - INTERVAL '3 months'
);

-- Dedicated coach
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '11111111-bbbb-bbbb-bbbb-111111111111',
  'coach1@wellness-corp-test.com', 
  'Michael Chen',
  ARRAY['coach'], 
  '11111111-1111-1111-1111-111111111111', 
  true,
  NOW() - INTERVAL '1 day',
  3, -- Gratitude
  4, -- Integration stage
  NOW() - INTERVAL '2 months'
);

-- Active practitioner
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '11111111-cccc-cccc-cccc-111111111111',
  'active-user@wellness-corp-test.com', 
  'Emily Rodriguez',
  ARRAY['practitioner'], 
  '11111111-1111-1111-1111-111111111111', 
  true,
  NOW() - INTERVAL '6 hours',
  2, -- Honesty
  3, -- Practice stage
  NOW() - INTERVAL '2 months'
);

-- Moderately active practitioner
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '11111111-dddd-dddd-dddd-111111111111',
  'moderate-user@wellness-corp-test.com', 
  'David Kim',
  ARRAY['practitioner'], 
  '11111111-1111-1111-1111-111111111111', 
  true,
  NOW() - INTERVAL '1 week',
  4, -- Self-Control
  1, -- Assessment stage
  NOW() - INTERVAL '1 month'
);

-- Inactive practitioner
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '11111111-eeee-eeee-eeee-111111111111',
  'inactive-user@wellness-corp-test.com', 
  'Lisa Thompson',
  ARRAY['practitioner'], 
  '11111111-1111-1111-1111-111111111111', 
  true,
  NOW() - INTERVAL '30 days',
  1, -- Humility
  1, -- Assessment stage
  NOW() - INTERVAL '2 months'
);

-- Archived practitioner
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  archived_at,
  archived_by,
  created_at
) VALUES (
  '11111111-ffff-ffff-ffff-111111111111',
  'archived-user@wellness-corp-test.com', 
  'Robert Wilson',
  ARRAY['practitioner'], 
  '11111111-1111-1111-1111-111111111111', 
  false, -- Archived
  NOW() - INTERVAL '60 days',
  5, -- Mindfulness
  2, -- Reflection stage
  NOW() - INTERVAL '30 days',
  '11111111-aaaa-aaaa-aaaa-111111111111', -- Archived by admin
  NOW() - INTERVAL '3 months'
);

-- Hope Therapy Center Users
-- Admin/Therapist
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '22222222-aaaa-aaaa-aaaa-222222222222',
  'admin@hope-therapy-test.com', 
  'Dr. Jennifer Martinez',
  ARRAY['admin', 'therapist'], 
  '22222222-2222-2222-2222-222222222222', 
  true,
  NOW() - INTERVAL '4 hours',
  7, -- Integrity
  3, -- Practice stage
  NOW() - INTERVAL '2 months'
);

-- Coach
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '22222222-bbbb-bbbb-bbbb-222222222222',
  'coach@hope-therapy-test.com', 
  'James Anderson',
  ARRAY['coach'], 
  '22222222-2222-2222-2222-222222222222', 
  true,
  NOW() - INTERVAL '12 hours',
  8, -- Compassion
  2, -- Reflection stage
  NOW() - INTERVAL '1 month'
);

-- Therapist
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '22222222-cccc-cccc-cccc-222222222222',
  'therapist@hope-therapy-test.com', 
  'Dr. Maria Gonzalez',
  ARRAY['therapist'], 
  '22222222-2222-2222-2222-222222222222', 
  true,
  NOW() - INTERVAL '8 hours',
  11, -- Vulnerability
  4, -- Integration stage
  NOW() - INTERVAL '1 month'
);

-- Practitioners
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  ('22222222-dddd-dddd-dddd-222222222222',
  'client1@hope-therapy-test.com', 
  'Amanda Foster',
  ARRAY['practitioner'], 
  '22222222-2222-2222-2222-222222222222', 
  true,
  NOW() - INTERVAL '2 days',
  9, -- Healthy Boundaries
  2, -- Reflection stage
  NOW() - INTERVAL '1 month'
),
  ('22222222-eeee-eeee-eeee-222222222222',
  'client2@hope-therapy-test.com', 
  'Thomas Brown',
  ARRAY['practitioner'], 
  '22222222-2222-2222-2222-222222222222', 
  true,
  NOW() - INTERVAL '5 days',
  10, -- Responsibility
  1, -- Assessment stage
  NOW() - INTERVAL '3 weeks'
);

-- St. Mary's Parish Users
-- Admin/Coach (Parish coordinator)
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '33333333-aaaa-aaaa-aaaa-333333333333',
  'coordinator@st-marys-test.org', 
  'Father Michael O''Connor',
  ARRAY['admin', 'coach'], 
  '33333333-3333-3333-3333-333333333333', 
  true,
  NOW() - INTERVAL '1 day',
  12, -- Respect
  3, -- Practice stage
  NOW() - INTERVAL '1 month'
);

-- Coach (Youth minister)
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES (
  '33333333-bbbb-bbbb-bbbb-333333333333',
  'youth@st-marys-test.org', 
  'Sister Catherine Walsh',
  ARRAY['coach'], 
  '33333333-3333-3333-3333-333333333333', 
  true,
  NOW() - INTERVAL '3 days',
  6, -- Patience
  4, -- Integration stage
  NOW() - INTERVAL '3 weeks'
);

-- Parishioner practitioners (various activity levels)
INSERT INTO public.profiles (
  id,
  email, 
  full_name,
  roles, 
  organization_id, 
  is_active,
  last_activity,
  current_virtue_id,
  current_stage,
  created_at
) VALUES 
  ('33333333-cccc-cccc-cccc-333333333333',
  'mary.smith@st-marys-test.org', 
  'Mary Smith',
  ARRAY['practitioner'], 
  '33333333-3333-3333-3333-333333333333', 
  true,
  NOW() - INTERVAL '1 day',
  1, -- Humility
  3, -- Practice stage
  NOW() - INTERVAL '3 weeks'
),
  ('33333333-dddd-dddd-dddd-333333333333',
  'john.davis@st-marys-test.org', 
  'John Davis',
  ARRAY['practitioner'], 
  '33333333-3333-3333-3333-333333333333', 
  true,
  NOW() - INTERVAL '4 days',
  3, -- Gratitude
  1, -- Assessment stage
  NOW() - INTERVAL '2 weeks'
),
  ('33333333-eeee-eeee-eeee-333333333333',
  'susan.miller@st-marys-test.org', 
  'Susan Miller',
  ARRAY['practitioner'], 
  '33333333-3333-3333-3333-333333333333', 
  true,
  NOW() - INTERVAL '1 week',
  2, -- Honesty
  2, -- Reflection stage
  NOW() - INTERVAL '1 week'
);

-- ============================================================================
-- 4. CREATE PRACTITIONER-SUPERVISOR ASSIGNMENTS
-- ============================================================================

-- Wellness Corp assignments
-- Emily Rodriguez (active practitioner) assigned to both admin (as therapist) and coach
INSERT INTO public.practitioner_assignments (
  practitioner_id,
  supervisor_id,
  supervisor_role,
  organization_id,
  assigned_by,
  assigned_at
) VALUES 
  ('11111111-cccc-cccc-cccc-111111111111', -- Emily Rodriguez
   '11111111-aaaa-aaaa-aaaa-111111111111', -- Sarah Johnson (admin)
   'therapist',
   '11111111-1111-1111-1111-111111111111',
   '11111111-aaaa-aaaa-aaaa-111111111111',
   NOW() - INTERVAL '2 months'
  ),
  ('11111111-cccc-cccc-cccc-111111111111', -- Emily Rodriguez
   '11111111-bbbb-bbbb-bbbb-111111111111', -- Michael Chen (coach)
   'coach',
   '11111111-1111-1111-1111-111111111111',
   '11111111-aaaa-aaaa-aaaa-111111111111',
   NOW() - INTERVAL '2 months'
  );

-- David Kim (moderate practitioner) assigned to coach only
INSERT INTO public.practitioner_assignments (
  practitioner_id,
  supervisor_id,
  supervisor_role,
  organization_id,
  assigned_by,
  assigned_at
) VALUES 
  ('11111111-dddd-dddd-dddd-111111111111', -- David Kim
   '11111111-bbbb-bbbb-bbbb-111111111111', -- Michael Chen (coach)
   'coach',
   '11111111-1111-1111-1111-111111111111',
   '11111111-aaaa-aaaa-aaaa-111111111111',
   NOW() - INTERVAL '1 month'
  );

-- Lisa Thompson (inactive practitioner) assigned to admin as coach
INSERT INTO public.practitioner_assignments (
  practitioner_id,
  supervisor_id,
  supervisor_role,
  organization_id,
  assigned_by,
  assigned_at
) VALUES 
  ('11111111-eeee-eeee-eeee-111111111111', -- Lisa Thompson
   '11111111-aaaa-aaaa-aaaa-111111111111', -- Sarah Johnson (admin as coach)
   'coach',
   '11111111-1111-1111-1111-111111111111',
   '11111111-aaaa-aaaa-aaaa-111111111111',
   NOW() - INTERVAL '2 months'
  );

-- Hope Therapy Center assignments
-- Amanda Foster assigned to both therapist and coach
INSERT INTO public.practitioner_assignments (
  practitioner_id,
  supervisor_id,
  supervisor_role,
  organization_id,
  assigned_by,
  assigned_at
) VALUES 
  ('22222222-dddd-dddd-dddd-222222222222', -- Amanda Foster
   '22222222-cccc-cccc-cccc-222222222222', -- Dr. Maria Gonzalez (therapist)
   'therapist',
   '22222222-2222-2222-2222-222222222222',
   '22222222-aaaa-aaaa-aaaa-222222222222',
   NOW() - INTERVAL '1 month'
  ),
  ('22222222-dddd-dddd-dddd-222222222222', -- Amanda Foster
   '22222222-bbbb-bbbb-bbbb-222222222222', -- James Anderson (coach)
   'coach',
   '22222222-2222-2222-2222-222222222222',
   '22222222-aaaa-aaaa-aaaa-222222222222',
   NOW() - INTERVAL '1 month'
  );

-- Thomas Brown assigned to admin as therapist
INSERT INTO public.practitioner_assignments (
  practitioner_id,
  supervisor_id,
  supervisor_role,
  organization_id,
  assigned_by,
  assigned_at
) VALUES 
  ('22222222-eeee-eeee-eeee-222222222222', -- Thomas Brown
   '22222222-aaaa-aaaa-aaaa-222222222222', -- Dr. Jennifer Martinez (admin as therapist)
   'therapist',
   '22222222-2222-2222-2222-222222222222',
   '22222222-aaaa-aaaa-aaaa-222222222222',
   NOW() - INTERVAL '3 weeks'
  );

-- St. Mary's Parish assignments
-- Mary Smith assigned to Father O'Connor as coach
INSERT INTO public.practitioner_assignments (
  practitioner_id,
  supervisor_id,
  supervisor_role,
  organization_id,
  assigned_by,
  assigned_at
) VALUES 
  ('33333333-cccc-cccc-cccc-333333333333', -- Mary Smith
   '33333333-aaaa-aaaa-aaaa-333333333333', -- Father Michael O'Connor
   'coach',
   '33333333-3333-3333-3333-333333333333',
   '33333333-aaaa-aaaa-aaaa-333333333333',
   NOW() - INTERVAL '3 weeks'
  );

-- John Davis assigned to Sister Catherine as coach
INSERT INTO public.practitioner_assignments (
  practitioner_id,
  supervisor_id,
  supervisor_role,
  organization_id,
  assigned_by,
  assigned_at
) VALUES 
  ('33333333-dddd-dddd-dddd-333333333333', -- John Davis
   '33333333-bbbb-bbbb-bbbb-333333333333', -- Sister Catherine Walsh
   'coach',
   '33333333-3333-3333-3333-333333333333',
   '33333333-aaaa-aaaa-aaaa-333333333333',
   NOW() - INTERVAL '2 weeks'
  );

-- Susan Miller assigned to Father O'Connor as coach
INSERT INTO public.practitioner_assignments (
  practitioner_id,
  supervisor_id,
  supervisor_role,
  organization_id,
  assigned_by,
  assigned_at
) VALUES 
  ('33333333-eeee-eeee-eeee-333333333333', -- Susan Miller
   '33333333-aaaa-aaaa-aaaa-333333333333', -- Father Michael O'Connor
   'coach',
   '33333333-3333-3333-3333-333333333333',
   '33333333-aaaa-aaaa-aaaa-333333333333',
   NOW() - INTERVAL '1 week'
  );

-- ============================================================================
-- 5. CREATE SAMPLE VIRTUE PROGRESS DATA
-- ============================================================================

-- Emily Rodriguez (active practitioner) - Multiple virtues with progress
INSERT INTO public.user_virtue_progress (
  user_id,
  virtue_id,
  current_stage,
  completed_stages,
  started_at,
  updated_at
) VALUES 
  ('11111111-cccc-cccc-cccc-111111111111', 1, 4, ARRAY[1,2,3,4], NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month'),
  ('11111111-cccc-cccc-cccc-111111111111', 2, 3, ARRAY[1,2], NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 week'),
  ('11111111-cccc-cccc-cccc-111111111111', 3, 1, ARRAY[]::INTEGER[], NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week');

-- David Kim (moderate practitioner) - One virtue in progress
INSERT INTO public.user_virtue_progress (
  user_id,
  virtue_id,
  current_stage,
  completed_stages,
  started_at,
  updated_at
) VALUES 
  ('11111111-dddd-dddd-dddd-111111111111', 4, 1, ARRAY[]::INTEGER[], NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 week');

-- Lisa Thompson (inactive practitioner) - Started but not progressed
INSERT INTO public.user_virtue_progress (
  user_id,
  virtue_id,
  current_stage,
  completed_stages,
  started_at,
  updated_at
) VALUES 
  ('11111111-eeee-eeee-eeee-111111111111', 1, 1, ARRAY[]::INTEGER[], NOW() - INTERVAL '2 months', NOW() - INTERVAL '30 days');

-- Robert Wilson (archived practitioner) - Some progress before archival
INSERT INTO public.user_virtue_progress (
  user_id,
  virtue_id,
  current_stage,
  completed_stages,
  started_at,
  updated_at
) VALUES 
  ('11111111-ffff-ffff-ffff-111111111111', 5, 2, ARRAY[1], NOW() - INTERVAL '3 months', NOW() - INTERVAL '60 days');

-- Amanda Foster (Hope Therapy) - Active progress
INSERT INTO public.user_virtue_progress (
  user_id,
  virtue_id,
  current_stage,
  completed_stages,
  started_at,
  updated_at
) VALUES 
  ('22222222-dddd-dddd-dddd-222222222222', 9, 2, ARRAY[1], NOW() - INTERVAL '1 month', NOW() - INTERVAL '2 days'),
  ('22222222-dddd-dddd-dddd-222222222222', 8, 4, ARRAY[1,2,3,4], NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 week');

-- Thomas Brown (Hope Therapy) - Just started
INSERT INTO public.user_virtue_progress (
  user_id,
  virtue_id,
  current_stage,
  completed_stages,
  started_at,
  updated_at
) VALUES 
  ('22222222-eeee-eeee-eeee-222222222222', 10, 1, ARRAY[]::INTEGER[], NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '5 days');

-- St. Mary's parishioners - Various progress levels
INSERT INTO public.user_virtue_progress (
  user_id,
  virtue_id,
  current_stage,
  completed_stages,
  started_at,
  updated_at
) VALUES 
  ('33333333-cccc-cccc-cccc-333333333333', 1, 3, ARRAY[1,2], NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '1 day'),
  ('33333333-dddd-dddd-dddd-333333333333', 3, 1, ARRAY[]::INTEGER[], NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '4 days'),
  ('33333333-eeee-eeee-eeee-333333333333', 2, 2, ARRAY[1], NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week');

-- ============================================================================
-- 6. CREATE SAMPLE JOURNAL ENTRIES
-- ============================================================================

-- Emily Rodriguez journal entries
INSERT INTO public.journal_entries (
  user_id,
  virtue_id,
  stage_number,
  title,
  content,
  created_at,
  updated_at
) VALUES 
  ('11111111-cccc-cccc-cccc-111111111111', 1, 1, 'Humility Assessment Reflection', 
   'Today I reflected on areas where I struggle with humility. I noticed that in team meetings, I often interrupt others when I think I have a better idea. This shows a lack of humility and respect for others'' contributions.', 
   NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
  ('11111111-cccc-cccc-cccc-111111111111', 1, 4, 'Integrating Humility', 
   'After months of practice, I''m starting to see humility as a strength rather than weakness. When I listen more and speak less, I learn so much more from my colleagues.', 
   NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
  ('11111111-cccc-cccc-cccc-111111111111', 2, 2, 'Honesty in Difficult Conversations', 
   'Had a challenging conversation with my manager today about a project delay. Instead of making excuses, I was honest about my role in the delay. It was uncomfortable but felt right.', 
   NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week');

-- Amanda Foster journal entries (therapy context)
INSERT INTO public.journal_entries (
  user_id,
  virtue_id,
  stage_number,
  title,
  content,
  created_at,
  updated_at
) VALUES 
  ('22222222-dddd-dddd-dddd-222222222222', 9, 1, 'Boundary Assessment', 
   'Working with my therapist to identify where I struggle with boundaries. I realize I say yes to everything and then feel overwhelmed and resentful.', 
   NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
  ('22222222-dddd-dddd-dddd-222222222222', 9, 2, 'Understanding My Boundary Patterns', 
   'Reflecting on childhood patterns - I learned that saying no meant disappointing people, which felt dangerous. Now I see how this affects my adult relationships.', 
   NOW() - INTERVAL '2 weeks', NOW() - INTERVAL '2 weeks'),
  ('22222222-dddd-dddd-dddd-222222222222', 8, 4, 'Compassion Integration', 
   'I''ve completed the compassion virtue! The biggest insight was learning to have compassion for myself first. When I''m kind to myself, it''s easier to be genuinely kind to others.', 
   NOW() - INTERVAL '1 week', NOW() - INTERVAL '1 week');

-- Mary Smith journal entries (parish context)
INSERT INTO public.journal_entries (
  user_id,
  virtue_id,
  stage_number,
  title,
  content,
  created_at,
  updated_at
) VALUES 
  ('33333333-cccc-cccc-cccc-333333333333', 1, 1, 'Humility in Service', 
   'Father O''Connor suggested I work on humility. I realize I sometimes judge other parishioners for not volunteering as much as I do. This isn''t humble or loving.', 
   NOW() - INTERVAL '3 weeks', NOW() - INTERVAL '3 weeks'),
  ('33333333-cccc-cccc-cccc-333333333333', 1, 3, 'Practicing Humble Service', 
   'This week I focused on serving without recognition. I cleaned the church kitchen after the potluck without mentioning it to anyone. It felt good to serve purely for love.', 
   NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days');

-- ============================================================================
-- 7. CREATE SAMPLE ORGANIZATION INVITATIONS
-- ============================================================================

-- Wellness Corp pending invitations
INSERT INTO public.organization_invitations (
  organization_id,
  email,
  roles,
  invited_by,
  token,
  expires_at,
  created_at
) VALUES 
  ('11111111-1111-1111-1111-111111111111',
   'newcoach@wellness-corp-test.com',
   ARRAY['coach'],
   '11111111-aaaa-aaaa-aaaa-111111111111',
   'wellness_coach_invite_token_123',
   NOW() + INTERVAL '5 days',
   NOW() - INTERVAL '2 days'
  ),
  ('11111111-1111-1111-1111-111111111111',
   'newemployee@wellness-corp-test.com',
   ARRAY['practitioner'],
   '11111111-aaaa-aaaa-aaaa-111111111111',
   'wellness_employee_invite_token_456',
   NOW() + INTERVAL '3 days',
   NOW() - INTERVAL '4 days'
  );

-- Hope Therapy Center pending invitation
INSERT INTO public.organization_invitations (
  organization_id,
  email,
  roles,
  invited_by,
  token,
  expires_at,
  created_at
) VALUES 
  ('22222222-2222-2222-2222-222222222222',
   'newtherapist@hope-therapy-test.com',
   ARRAY['therapist'],
   '22222222-aaaa-aaaa-aaaa-222222222222',
   'hope_therapist_invite_token_789',
   NOW() + INTERVAL '6 days',
   NOW() - INTERVAL '1 day'
  );

-- ============================================================================
-- 8. UPDATE ORGANIZATION ACTIVE USER COUNTS
-- ============================================================================

-- Update active user counts for all organizations
SELECT update_organization_active_user_count('11111111-1111-1111-1111-111111111111');
SELECT update_organization_active_user_count('22222222-2222-2222-2222-222222222222');
SELECT update_organization_active_user_count('33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Verify organization data
SELECT 
  name, 
  slug, 
  subscription_tier, 
  active_user_count, 
  max_users,
  created_at
FROM public.organizations 
WHERE slug LIKE '%-test'
ORDER BY created_at;

-- Verify user distribution by organization and role
SELECT 
  o.name as organization,
  p.roles,
  p.is_active,
  COUNT(*) as user_count
FROM public.profiles p
JOIN public.organizations o ON p.organization_id = o.id
WHERE o.slug LIKE '%-test'
GROUP BY o.name, p.roles, p.is_active
ORDER BY o.name, p.roles;

-- Verify practitioner assignments
SELECT 
  o.name as organization,
  p1.full_name as practitioner,
  p2.full_name as supervisor,
  pa.supervisor_role,
  pa.active
FROM public.practitioner_assignments pa
JOIN public.profiles p1 ON pa.practitioner_id = p1.id
JOIN public.profiles p2 ON pa.supervisor_id = p2.id
JOIN public.organizations o ON pa.organization_id = o.id
WHERE o.slug LIKE '%-test'
ORDER BY o.name, p1.full_name;

-- Verify virtue progress distribution
SELECT 
  o.name as organization,
  v.name as virtue,
  uvp.current_stage,
  array_length(uvp.completed_stages, 1) as completed_stages_count,
  p.full_name as practitioner
FROM public.user_virtue_progress uvp
JOIN public.profiles p ON uvp.user_id = p.id
JOIN public.organizations o ON p.organization_id = o.id
JOIN public.virtues v ON uvp.virtue_id = v.id
WHERE o.slug LIKE '%-test'
ORDER BY o.name, p.full_name, v.name;

-- Verify journal entries
SELECT 
  o.name as organization,
  p.full_name as author,
  v.name as virtue,
  je.stage_number,
  je.title,
  je.created_at
FROM public.journal_entries je
JOIN public.profiles p ON je.user_id = p.id
JOIN public.organizations o ON p.organization_id = o.id
JOIN public.virtues v ON je.virtue_id = v.id
WHERE o.slug LIKE '%-test'
ORDER BY o.name, je.created_at DESC;

-- ============================================================================
-- END OF DEV DATA POPULATION SCRIPT
-- ============================================================================

-- Summary of created test data:
-- 
-- Organizations: 3 (Wellness Corp, Hope Therapy Center, St. Mary's Parish)
-- Users: 14 total across all organizations with various roles and activity levels
-- Practitioner Assignments: 9 assignments showing coach/therapist relationships
-- Virtue Progress: Multiple entries showing different stages of completion
-- Journal Entries: 8 entries across different users and contexts
-- Invitations: 3 pending invitations for testing invitation flow
-- 
-- This data provides comprehensive test scenarios for:
-- - Multi-role users (admin + coach + therapist)
-- - Various activity levels (active, moderate, inactive, archived)
-- - Different organizational contexts (corporate, therapy, religious)
-- - Complex supervisor relationships (practitioners with both coach and therapist)
-- - Realistic virtue progress and journal content
-- - Pending invitations for testing invitation flow