-- ============================================================================
-- PRODUCTION MIGRATION: Organization Request System
-- Date: 2025-01-13
-- Description: Complete organization request and approval system
-- 
-- INSTRUCTIONS:
-- 1. Run this script on production database
-- 2. Test organization request form at /organizations
-- 3. Test admin approval workflow in admin dashboard
-- ============================================================================

-- ============================================================================
-- 1. CREATE ORGANIZATION REQUESTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.organization_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Details
  organization_name TEXT NOT NULL,
  organization_description TEXT,
  website_url TEXT,
  phone_number TEXT,
  
  -- Contact Person (becomes org-admin when approved)
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_title TEXT,
  
  -- Request Details
  estimated_users INTEGER DEFAULT 10,
  use_case TEXT, -- How they plan to use the platform
  
  -- Status and Workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  -- Admin Notes
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_website_url CHECK (
    website_url IS NULL OR website_url ~ '^https?://.*'
  ),
  CONSTRAINT valid_estimated_users CHECK (
    estimated_users > 0 AND estimated_users <= 100
  )
);

-- ============================================================================
-- 2. ROW LEVEL SECURITY AND POLICIES
-- ============================================================================

ALTER TABLE public.organization_requests ENABLE ROW LEVEL SECURITY;

-- System admins can view all requests
CREATE POLICY "System admins can view all organization requests" ON public.organization_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND ('sys-admin' = ANY(roles) OR 'org-admin' = ANY(roles))
    )
  );

-- System admins can update requests (for approval/rejection)
CREATE POLICY "System admins can update organization requests" ON public.organization_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND ('sys-admin' = ANY(roles))
    )
  );

-- Anyone can create organization requests (public form)
CREATE POLICY "Anyone can create organization requests" ON public.organization_requests
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organization_requests_status ON public.organization_requests(status);
CREATE INDEX IF NOT EXISTS idx_organization_requests_created_at ON public.organization_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_organization_requests_contact_email ON public.organization_requests(contact_email);

-- ============================================================================
-- 4. UPDATED_AT TRIGGER
-- ============================================================================

CREATE TRIGGER update_organization_requests_updated_at 
  BEFORE UPDATE ON public.organization_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. APPROVAL WORKFLOW FUNCTIONS
-- ============================================================================

-- Function to approve an organization request and create the organization
CREATE OR REPLACE FUNCTION approve_organization_request(
  request_id UUID,
  admin_notes TEXT DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  organization_id UUID,
  admin_user_id UUID
) AS $$
DECLARE
  request_record RECORD;
  new_org_id UUID;
  org_slug TEXT;
BEGIN
  -- Get the request details
  SELECT * INTO request_record 
  FROM public.organization_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Request not found or already processed', NULL::UUID, NULL::UUID;
    RETURN;
  END IF;
  
  -- Generate organization slug
  org_slug := lower(regexp_replace(request_record.organization_name, '[^a-zA-Z0-9]+', '-', 'g'));
  org_slug := trim(org_slug, '-');
  
  -- Ensure slug is unique
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) LOOP
    org_slug := org_slug || '-' || floor(random() * 1000)::text;
  END LOOP;
  
  -- Create the organization
  INSERT INTO public.organizations (
    name, 
    slug, 
    description, 
    website_url, 
    phone_number,
    max_users
  ) VALUES (
    request_record.organization_name,
    org_slug,
    request_record.organization_description,
    request_record.website_url,
    request_record.phone_number,
    GREATEST(request_record.estimated_users, 40) -- Minimum 40 users
  ) RETURNING id INTO new_org_id;
  
  -- Update the request status
  UPDATE public.organization_requests 
  SET 
    status = 'approved',
    admin_notes = COALESCE(admin_notes, 'Organization approved and created'),
    reviewed_by = auth.uid(),
    reviewed_at = NOW()
  WHERE id = request_id;
  
  RETURN QUERY SELECT 
    true, 
    'Organization approved successfully. Contact person should create account with email: ' || request_record.contact_email,
    new_org_id,
    NULL::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject an organization request
CREATE OR REPLACE FUNCTION reject_organization_request(
  request_id UUID,
  rejection_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Update the request status
  UPDATE public.organization_requests 
  SET 
    status = 'rejected',
    admin_notes = rejection_reason,
    reviewed_by = auth.uid(),
    reviewed_at = NOW()
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Request not found or already processed';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Organization request rejected';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION approve_organization_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_organization_request(UUID, TEXT) TO authenticated;

-- ============================================================================
-- 7. COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.organization_requests IS 'Stores organization access requests for sys-admin approval';
COMMENT ON FUNCTION approve_organization_request(UUID, TEXT) IS 'Approves an organization request and creates the organization';
COMMENT ON FUNCTION reject_organization_request(UUID, TEXT) IS 'Rejects an organization request with reason';

-- ============================================================================
-- 8. VERIFICATION QUERIES (Run after migration to verify)
-- ============================================================================

-- Verify table was created
-- SELECT table_name FROM information_schema.tables WHERE table_name = 'organization_requests';

-- Verify RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'organization_requests';

-- Verify functions exist
-- SELECT routine_name FROM information_schema.routines WHERE routine_name LIKE '%organization_request%';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================