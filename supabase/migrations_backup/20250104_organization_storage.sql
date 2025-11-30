-- Create storage bucket for organization assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for organization assets
CREATE POLICY "Organization members can upload assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'organization-assets' AND
  auth.uid() IN (
    SELECT p.id FROM profiles p 
    WHERE p.organization_id IS NOT NULL 
    AND 'admin' = ANY(p.roles)
  )
);

CREATE POLICY "Organization assets are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'organization-assets');

CREATE POLICY "Organization admins can update assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'organization-assets' AND
  auth.uid() IN (
    SELECT p.id FROM profiles p 
    WHERE p.organization_id IS NOT NULL 
    AND 'admin' = ANY(p.roles)
  )
);

CREATE POLICY "Organization admins can delete assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'organization-assets' AND
  auth.uid() IN (
    SELECT p.id FROM profiles p 
    WHERE p.organization_id IS NOT NULL 
    AND 'admin' = ANY(p.roles)
  )
);

-- Function to update organization active user count
CREATE OR REPLACE FUNCTION update_organization_active_user_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the active user count for the organization
  UPDATE organizations 
  SET active_user_count = (
    SELECT COUNT(*) 
    FROM profiles 
    WHERE organization_id = COALESCE(NEW.organization_id, OLD.organization_id)
    AND is_active = true
  )
  WHERE id = COALESCE(NEW.organization_id, OLD.organization_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update active user count
DROP TRIGGER IF EXISTS update_org_user_count_trigger ON profiles;
CREATE TRIGGER update_org_user_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_active_user_count();

-- Function to get organization member activity overview
CREATE OR REPLACE FUNCTION get_organization_activity_overview(org_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  full_name TEXT,
  roles TEXT[],
  last_activity TIMESTAMPTZ,
  current_virtue_id INTEGER,
  current_stage INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  days_since_activity INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.roles,
    p.last_activity,
    p.current_virtue_id,
    p.current_stage,
    p.is_active,
    p.created_at,
    CASE 
      WHEN p.last_activity IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM NOW() - p.last_activity)::INTEGER
    END as days_since_activity
  FROM profiles p
  WHERE p.organization_id = org_id
  ORDER BY p.last_activity DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;