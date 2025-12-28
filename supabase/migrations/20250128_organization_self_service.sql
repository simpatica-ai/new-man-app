-- Migration to support self-service organization creation
-- Created: 2025-01-28

-- Add new fields to organization_demo_requests table
ALTER TABLE organization_demo_requests 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update status check constraint to include 'completed'
ALTER TABLE organization_demo_requests 
DROP CONSTRAINT IF EXISTS organization_demo_requests_status_check;

ALTER TABLE organization_demo_requests 
ADD CONSTRAINT organization_demo_requests_status_check 
CHECK (status IN ('pending', 'contacted', 'demo_scheduled', 'demo_completed', 'converted', 'declined', 'completed'));

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_organization_demo_requests_organization_id ON organization_demo_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_demo_requests_user_id ON organization_demo_requests(user_id);

-- Add comment
COMMENT ON COLUMN organization_demo_requests.organization_id IS 'Reference to created organization (for completed requests)';
COMMENT ON COLUMN organization_demo_requests.user_id IS 'Reference to created user account (for completed requests)';