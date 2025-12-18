-- Fix PostgREST schema cache issue for payments table
-- This migration ensures the schema cache recognizes the organization_id column

-- First, verify the column exists
DO $
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'payments' 
          AND column_name = 'organization_id'
    ) THEN
        RAISE EXCEPTION 'organization_id column does not exist in payments table';
    END IF;
END $;

-- Force PostgREST to reload schema by sending NOTIFY
NOTIFY pgrst, 'reload schema';

-- Add a comment to the column to trigger schema refresh
COMMENT ON COLUMN payments.organization_id IS 'Optional organization ID for organization-level payments. NULL for individual practitioners.';

-- Verify the column is properly configured
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'payments'
  AND column_name = 'organization_id';
