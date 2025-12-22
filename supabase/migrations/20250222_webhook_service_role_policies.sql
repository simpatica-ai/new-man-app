-- Add service role policies for webhook operations
-- This allows the webhook (using service role) to update payment records

-- Service role can update any payment record (for webhook operations)
CREATE POLICY "Service role can update payments" ON payments
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- Service role can insert any payment record (for webhook operations)  
CREATE POLICY "Service role can insert payments" ON payments
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Service role can select any payment record (for webhook operations)
CREATE POLICY "Service role can select payments" ON payments
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Service role can update any subscription record (for webhook operations)
CREATE POLICY "Service role can update subscriptions" ON subscriptions
    FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

-- Service role can insert any subscription record (for webhook operations)
CREATE POLICY "Service role can insert subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Service role can select any subscription record (for webhook operations)
CREATE POLICY "Service role can select subscriptions" ON subscriptions
    FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Service role can manage customer records (for webhook operations)
CREATE POLICY "Service role can manage user_stripe_customers" ON user_stripe_customers
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add admin policies for payment stats
CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );

CREATE POLICY "Admins can view all subscriptions" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );