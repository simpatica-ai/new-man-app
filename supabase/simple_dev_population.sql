-- ============================================================================
-- SIMPLE DEV DATABASE POPULATION SCRIPT
-- Organizational Model Test Data (Compatible with existing schema)
-- ============================================================================

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  primary_color TEXT DEFAULT '#5F4339',
  secondary_color TEXT DEFAULT '#A8A29E',
  subscription_tier TEXT DEFAULT 'basic',
  max_users INTEGER DEFAULT 40,
  active_user_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Extend profiles table with organizational fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['practitioner'],
  ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS current_virtue_id INTEGER REFERENCES public.virtues(id),
  ADD COLUMN IF NOT EXISTS current_stage INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES public.profiles(id);

-- Create practitioner assignments table
CREATE TABLE IF NOT EXISTS public.practitioner_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.profiles(id),
  supervisor_id UUID REFERENCES public.profiles(id),
  supervisor_role TEXT CHECK (supervisor_role IN ('coach', 'therapist')),
  organization_id UUID REFERENCES public.organizations(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true
);

-- ============================================================================
-- POPULATE SAMPLE DATA
-- ============================================================================

-- Sample Organizations
INSERT INTO public.organizations (id, name, slug, primary_color, subscription_tier, max_users) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Wellness Corp', 'wellness-corp-dev', '#2563eb', 'premium', 25),
  ('22222222-2222-2222-2222-222222222222', 'Hope Therapy Center', 'hope-therapy-dev', '#7c3aed', 'basic', 15),
  ('33333333-3333-3333-3333-333333333333', 'St. Mary''s Parish', 'st-marys-parish-dev', '#059669', 'basic', 40)
ON CONFLICT (slug) DO NOTHING;

-- Sample Users
-- Wellness Corp Users
INSERT INTO public.profiles (id, full_name, roles, organization_id, is_active, last_activity, current_virtue_id, current_stage) VALUES
  ('11111111-aaaa-aaaa-aaaa-111111111111', 'Sarah Johnson', ARRAY['admin', 'coach', 'therapist'], '11111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '2 hours', 1, 2),
  ('11111111-bbbb-bbbb-bbbb-111111111111', 'Michael Chen', ARRAY['coach'], '11111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '1 day', 6, 3),
  ('11111111-cccc-cccc-cccc-111111111111', 'Emily Rodriguez', ARRAY['practitioner'], '11111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '6 hours', 2, 2),
  ('11111111-dddd-dddd-dddd-111111111111', 'David Kim', ARRAY['practitioner'], '11111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '1 week', 4, 1),
  ('11111111-eeee-eeee-eeee-111111111111', 'Lisa Thompson', ARRAY['practitioner'], '11111111-1111-1111-1111-111111111111', true, NOW() - INTERVAL '30 days', 1, 1),
  ('11111111-ffff-ffff-ffff-111111111111', 'Robert Wilson', ARRAY['practitioner'], '11111111-1111-1111-1111-111111111111', false, NOW() - INTERVAL '60 days', 5, 2)
ON CONFLICT (id) DO NOTHING;

-- Hope Therapy Center Users  
INSERT INTO public.profiles (id, full_name, roles, organization_id, is_active, last_activity, current_virtue_id, current_stage) VALUES
  ('22222222-aaaa-aaaa-aaaa-222222222222', 'Dr. Jennifer Martinez', ARRAY['admin', 'therapist'], '22222222-2222-2222-2222-222222222222', true, NOW() - INTERVAL '4 hours', 11, 3),
  ('22222222-bbbb-bbbb-bbbb-222222222222', 'James Anderson', ARRAY['coach'], '22222222-2222-2222-2222-222222222222', true, NOW() - INTERVAL '12 hours', 10, 2),
  ('22222222-cccc-cccc-cccc-222222222222', 'Dr. Maria Gonzalez', ARRAY['therapist'], '22222222-2222-2222-2222-222222222222', true, NOW() - INTERVAL '8 hours', 9, 3),
  ('22222222-dddd-dddd-dddd-222222222222', 'Amanda Foster', ARRAY['practitioner'], '22222222-2222-2222-2222-222222222222', true, NOW() - INTERVAL '2 days', 7, 2),
  ('22222222-eeee-eeee-eeee-222222222222', 'Thomas Brown', ARRAY['practitioner'], '22222222-2222-2222-2222-222222222222', true, NOW() - INTERVAL '5 days', 8, 1)
ON CONFLICT (id) DO NOTHING;

-- St. Mary's Parish Users
INSERT INTO public.profiles (id, full_name, roles, organization_id, is_active, last_activity, current_virtue_id, current_stage) VALUES
  ('33333333-aaaa-aaaa-aaaa-333333333333', 'Father Michael O''Connor', ARRAY['admin', 'coach'], '33333333-3333-3333-3333-333333333333', true, NOW() - INTERVAL '1 day', 5, 3),
  ('33333333-bbbb-bbbb-bbbb-333333333333', 'Sister Catherine Walsh', ARRAY['coach'], '33333333-3333-3333-3333-333333333333', true, NOW() - INTERVAL '3 days', 4, 3),
  ('33333333-cccc-cccc-cccc-333333333333', 'Mary Smith', ARRAY['practitioner'], '33333333-3333-3333-3333-333333333333', true, NOW() - INTERVAL '1 day', 1, 2),
  ('33333333-dddd-dddd-dddd-333333333333', 'John Davis', ARRAY['practitioner'], '33333333-3333-3333-3333-333333333333', true, NOW() - INTERVAL '4 days', 6, 1),
  ('33333333-eeee-eeee-eeee-333333333333', 'Susan Miller', ARRAY['practitioner'], '33333333-3333-3333-3333-333333333333', true, NOW() - INTERVAL '1 week', 2, 2)
ON CONFLICT (id) DO NOTHING;

-- Sample Practitioner Assignments
INSERT INTO public.practitioner_assignments (practitioner_id, supervisor_id, supervisor_role, organization_id) VALUES
  -- Wellness Corp assignments
  ('11111111-cccc-cccc-cccc-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'therapist', '11111111-1111-1111-1111-111111111111'),
  ('11111111-cccc-cccc-cccc-111111111111', '11111111-bbbb-bbbb-bbbb-111111111111', 'coach', '11111111-1111-1111-1111-111111111111'),
  ('11111111-dddd-dddd-dddd-111111111111', '11111111-bbbb-bbbb-bbbb-111111111111', 'coach', '11111111-1111-1111-1111-111111111111'),
  ('11111111-eeee-eeee-eeee-111111111111', '11111111-aaaa-aaaa-aaaa-111111111111', 'coach', '11111111-1111-1111-1111-111111111111'),
  
  -- Hope Therapy assignments
  ('22222222-dddd-dddd-dddd-222222222222', '22222222-cccc-cccc-cccc-222222222222', 'therapist', '22222222-2222-2222-2222-222222222222'),
  ('22222222-dddd-dddd-dddd-222222222222', '22222222-bbbb-bbbb-bbbb-222222222222', 'coach', '22222222-2222-2222-2222-222222222222'),
  ('22222222-eeee-eeee-eeee-222222222222', '22222222-aaaa-aaaa-aaaa-222222222222', 'therapist', '22222222-2222-2222-2222-222222222222'),
  
  -- St. Mary's assignments
  ('33333333-cccc-cccc-cccc-333333333333', '33333333-aaaa-aaaa-aaaa-333333333333', 'coach', '33333333-3333-3333-3333-333333333333'),
  ('33333333-dddd-dddd-dddd-333333333333', '33333333-bbbb-bbbb-bbbb-333333333333', 'coach', '33333333-3333-3333-3333-333333333333'),
  ('33333333-eeee-eeee-eeee-333333333333', '33333333-aaaa-aaaa-aaaa-333333333333', 'coach', '33333333-3333-3333-3333-333333333333')
ON CONFLICT DO NOTHING;

-- Sample Journal Entries
INSERT INTO public.journal_entries (id, user_id, entry_text, created_at) VALUES
  (1001, '11111111-cccc-cccc-cccc-111111111111', 'Starting My Honesty Journey: Today I began working on honesty. I realize I often tell small lies to avoid conflict at work.', NOW() - INTERVAL '1 week'),
  (1002, '11111111-cccc-cccc-cccc-111111111111', 'Practicing Truth: Had a challenging conversation with my manager. Instead of making excuses, I was honest about missing the deadline.', NOW() - INTERVAL '2 days'),
  (1003, '22222222-dddd-dddd-dddd-222222222222', 'Recognizing Boundary Issues: Working with my therapist to identify where I struggle with boundaries. I say yes to everything.', NOW() - INTERVAL '1 month'),
  (1004, '22222222-dddd-dddd-dddd-222222222222', 'Learning to Say No: Practiced setting a boundary with my sister today. I told her I couldn''t babysit this weekend.', NOW() - INTERVAL '3 days'),
  (1005, '33333333-cccc-cccc-cccc-333333333333', 'Humility in Service: Father O''Connor suggested I work on humility. I realize I judge other parishioners for not volunteering.', NOW() - INTERVAL '2 weeks'),
  (1006, '33333333-cccc-cccc-cccc-333333333333', 'Serving Without Recognition: This week I served without recognition. I cleaned the church kitchen without mentioning it to anyone.', NOW() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

-- Update organization active user counts
UPDATE public.organizations 
SET active_user_count = (
  SELECT COUNT(*) 
  FROM public.profiles 
  WHERE organization_id = organizations.id AND is_active = true
);

-- ============================================================================
-- VERIFICATION QUERY (uncomment to check results)
-- ============================================================================
-- SELECT 
--   o.name as organization,
--   COUNT(p.id) as total_users,
--   COUNT(CASE WHEN p.is_active THEN 1 END) as active_users
-- FROM public.organizations o
-- LEFT JOIN public.profiles p ON o.id = p.organization_id
-- GROUP BY o.id, o.name
-- ORDER BY o.name;