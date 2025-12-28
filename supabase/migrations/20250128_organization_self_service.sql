-- Migration to support self-service organization creation
-- Created: 2025-01-28

-- Create organization_demo_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS organization_demo_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT NOT NULL,
    organization_type TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'demo_scheduled', 'demo_completed', 'converted', 'declined', 'completed')),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If table already exists, add new columns
DO $$ 
BEGIN
    -- Add organization_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_demo_requests' AND column_name = 'organization_id') THEN
        ALTER TABLE organization_demo_requests ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    END IF;
    
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_demo_requests' AND column_name = 'user_id') THEN
        ALTER TABLE organization_demo_requests ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    END IF;
    
    -- Update status constraint to include 'completed'
    BEGIN
        ALTER TABLE organization_demo_requests 
        DROP CONSTRAINT IF EXISTS organization_demo_requests_status_check;
        
        ALTER TABLE organization_demo_requests 
        ADD CONSTRAINT organization_demo_requests_status_check 
        CHECK (status IN ('pending', 'contacted', 'demo_scheduled', 'demo_completed', 'converted', 'declined', 'completed'));
    EXCEPTION
        WHEN OTHERS THEN
            -- Constraint might not exist, continue
            NULL;
    END;
END $$;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_organization_demo_requests_organization_id ON organization_demo_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_demo_requests_user_id ON organization_demo_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_demo_requests_email ON organization_demo_requests(email);
CREATE INDEX IF NOT EXISTS idx_organization_demo_requests_status ON organization_demo_requests(status);

-- Add RLS policy
ALTER TABLE organization_demo_requests ENABLE ROW LEVEL SECURITY;

-- Policy for admins to see all requests
CREATE POLICY "Admins can view all demo requests" ON organization_demo_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND 'admin' = ANY(profiles.roles)
        )
    );

-- Policy for admins to insert/update requests
CREATE POLICY "Admins can manage demo requests" ON organization_demo_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND 'admin' = ANY(profiles.roles)
        )
    );

-- Add comments
COMMENT ON TABLE organization_demo_requests IS 'Tracks organization demo requests and self-service signups';
COMMENT ON COLUMN organization_demo_requests.organization_id IS 'Reference to created organization (for completed requests)';
COMMENT ON COLUMN organization_demo_requests.user_id IS 'Reference to created user account (for completed requests)';