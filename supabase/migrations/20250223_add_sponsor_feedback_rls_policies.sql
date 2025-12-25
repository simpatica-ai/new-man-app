-- Add RLS policies for sponsor_feedback table
-- This table has RLS enabled but no policies, making it inaccessible
-- Table links to sponsor_connections via connection_id
-- sponsor_connections has sponsor_user_id and practitioner_user_id

-- Policy 1: Sponsors can view feedback for their connections
CREATE POLICY "Sponsors can view feedback for their connections" ON public.sponsor_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.id = sponsor_feedback.connection_id
            AND sc.sponsor_user_id = auth.uid()
        )
    );

-- Policy 2: Sponsors can insert feedback for their connections
CREATE POLICY "Sponsors can insert feedback for their connections" ON public.sponsor_feedback
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.id = sponsor_feedback.connection_id
            AND sc.sponsor_user_id = auth.uid()
        )
    );

-- Policy 3: Sponsors can update feedback for their connections
CREATE POLICY "Sponsors can update feedback for their connections" ON public.sponsor_feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.id = sponsor_feedback.connection_id
            AND sc.sponsor_user_id = auth.uid()
        )
    );

-- Policy 4: Practitioners can view feedback about their journal entries
CREATE POLICY "Practitioners can view feedback on their journal entries" ON public.sponsor_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_virtue_stage_memos m
            WHERE m.id = sponsor_feedback.journal_entry_id
            AND m.user_id = auth.uid()
        )
    );

-- Policy 5: Practitioners can view feedback through their connections
CREATE POLICY "Practitioners can view feedback through their connections" ON public.sponsor_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sponsor_connections sc
            WHERE sc.id = sponsor_feedback.connection_id
            AND sc.practitioner_user_id = auth.uid()
        )
    );

-- Policy 6: Admins can view all feedback
CREATE POLICY "Admins can view all sponsor feedback" ON public.sponsor_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );

-- Policy 7: Admins can manage all feedback
CREATE POLICY "Admins can manage all sponsor feedback" ON public.sponsor_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND (p.role = 'admin' OR 'admin' = ANY(p.roles))
        )
    );

-- Verification
DO $$
BEGIN
    RAISE NOTICE 'RLS policies added for sponsor_feedback table';
    RAISE NOTICE 'Policies created: sponsor access via sponsor_user_id, practitioner access via practitioner_user_id and journal entries, admin access';
    RAISE NOTICE 'Table should now be accessible with proper permissions';
END $$;