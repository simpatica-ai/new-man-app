-- Add organization_id column to payments table
-- This column was missing from the original migration

-- Add organization_id column (will fail silently if it already exists)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create index for organization_id
CREATE INDEX IF NOT EXISTS idx_payments_organization_id ON payments(organization_id);

-- Add comment to the column
COMMENT ON COLUMN payments.organization_id IS 'Optional organization ID for organization-level payments. NULL for individual practitioners.';

-- Verify the column was added
SELECT 
    'Verification' as check_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payments'
  AND column_name = 'organization_id';
