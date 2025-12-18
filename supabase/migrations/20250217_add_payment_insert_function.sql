-- Create function to insert payment records
-- This bypasses PostgREST schema cache issues by using direct SQL

CREATE OR REPLACE FUNCTION insert_payment(
    p_user_id UUID,
    p_organization_id UUID,
    p_stripe_payment_intent_id TEXT,
    p_amount DECIMAL(10,2),
    p_currency TEXT,
    p_status TEXT,
    p_payment_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    organization_id UUID,
    stripe_payment_intent_id TEXT,
    amount DECIMAL(10,2),
    currency TEXT,
    status TEXT,
    payment_type TEXT,
    subscription_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $
BEGIN
    RETURN QUERY
    INSERT INTO payments (
        user_id,
        organization_id,
        stripe_payment_intent_id,
        amount,
        currency,
        status,
        payment_type,
        metadata,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_organization_id,
        p_stripe_payment_intent_id,
        p_amount,
        p_currency,
        p_status,
        p_payment_type,
        p_metadata,
        NOW(),
        NOW()
    )
    RETURNING 
        payments.id,
        payments.user_id,
        payments.organization_id,
        payments.stripe_payment_intent_id,
        payments.amount,
        payments.currency,
        payments.status,
        payments.payment_type,
        payments.subscription_id,
        payments.metadata,
        payments.created_at,
        payments.updated_at;
END;
$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION insert_payment TO authenticated;
GRANT EXECUTE ON FUNCTION insert_payment TO service_role;

-- Add comment
COMMENT ON FUNCTION insert_payment IS 'Inserts a payment record, bypassing PostgREST schema cache issues';
