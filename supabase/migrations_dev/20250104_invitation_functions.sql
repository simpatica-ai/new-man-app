-- Function to increment active user count for an organization
CREATE OR REPLACE FUNCTION increment_active_user_count(org_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_count INTEGER;
BEGIN
    -- Update the active user count
    UPDATE organizations 
    SET 
        active_user_count = (
            SELECT COUNT(*) 
            FROM profiles 
            WHERE organization_id = org_id 
            AND is_active = true
        ),
        updated_at = NOW()
    WHERE id = org_id
    RETURNING active_user_count INTO new_count;
    
    RETURN COALESCE(new_count, 0);
END;
$$;

-- Function to handle invitation acceptance and user setup
CREATE OR REPLACE FUNCTION accept_organization_invitation(
    invitation_token TEXT,
    user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invitation_record RECORD;
    result JSON;
BEGIN
    -- Get invitation details
    SELECT 
        id,
        organization_id,
        email,
        roles,
        expires_at
    INTO invitation_record
    FROM organization_invitations
    WHERE token = invitation_token
    AND accepted_at IS NULL
    AND expires_at > NOW();
    
    -- Check if invitation exists and is valid
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired invitation'
        );
    END IF;
    
    -- Check organization user limit
    IF (
        SELECT active_user_count >= max_users 
        FROM organizations 
        WHERE id = invitation_record.organization_id
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Organization has reached maximum user limit'
        );
    END IF;
    
    -- Update user profile
    UPDATE profiles
    SET 
        organization_id = invitation_record.organization_id,
        roles = invitation_record.roles,
        is_active = true,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Mark invitation as accepted
    UPDATE organization_invitations
    SET 
        accepted_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Update organization active user count
    PERFORM increment_active_user_count(invitation_record.organization_id);
    
    RETURN json_build_object(
        'success', true,
        'organization_id', invitation_record.organization_id,
        'roles', invitation_record.roles
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION increment_active_user_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_organization_invitation(TEXT, UUID) TO authenticated;