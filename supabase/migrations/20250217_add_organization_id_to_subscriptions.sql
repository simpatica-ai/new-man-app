-- Add organization_id column to subscriptions table
-- This column was missing from the original migration

-- Add organization_id column (will fail silently if it already exists)
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for organization_id
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization_id ON subscriptions(organization_id);

-- Add comment to the column
COMMENT ON COLUMN subscriptions.organization_id IS 'Optional organization ID for organization-level subscriptions. NULL for individual practitioners.';

-- Verify the column was added
SELECT 
    'Verification' as check_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
  AND column_name = 'organization_id';
