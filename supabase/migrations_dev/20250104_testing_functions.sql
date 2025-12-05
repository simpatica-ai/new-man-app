-- Function to get organizations for testing (bypasses TypeScript type issues)
CREATE OR REPLACE FUNCTION get_organizations_for_testing()
RETURNS TABLE (
    id UUID,
    name TEXT,
    slug TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    subscription_tier TEXT,
    subscription_status TEXT,
    max_users INTEGER,
    active_user_count INTEGER,
    created_at TIMESTAMPTZ,
    settings JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.slug,
        o.primary_color,
        o.secondary_color,
        o.subscription_tier,
        o.subscription_status,
        o.max_users,
        o.active_user_count,
        o.created_at,
        o.settings
    FROM organizations o
    ORDER BY o.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_organizations_for_testing() TO authenticated;