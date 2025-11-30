# Creating Test Auth Users in Supabase

## Method 1: Via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to Authentication > Users
3. Click "Add user" 
4. Create users with these emails:
   - `test-coach@example.com` (password: `testpass123`)
   - `test-therapist@example.com` (password: `testpass123`)
   - `test-admin@example.com` (password: `testpass123`)

## Method 2: Via SQL (after creating auth users)
Once you create the auth users above, get their UUIDs and run:

```sql
-- Update the create-test-users.sql with actual UUIDs
-- Replace 'test-admin-uuid' with the actual UUID from auth.users table

-- Get the UUIDs first:
SELECT id, email FROM auth.users WHERE email LIKE 'test-%@example.com';

-- Then update the profiles with the correct UUIDs
UPDATE profiles SET 
  roles = ARRAY['org-admin', 'org-practitioner'],
  full_name = 'Test Admin User',
  organization_id = (SELECT id FROM organizations WHERE slug = 'your-test-org-slug' LIMIT 1)
WHERE id = 'actual-uuid-from-auth-table';
```

## Method 3: Use DevRoleTester (Recommended)
The DevRoleTester component is much faster for testing - just use your existing login and switch roles on the fly!