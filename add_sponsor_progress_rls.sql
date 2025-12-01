-- ============================================================================
-- Add RLS policy for sponsors to view practitioner virtue stage progress
-- ============================================================================

-- Allow sponsors to view virtue stage progress from their practitioners
CREATE POLICY "Sponsors can view practitioner progress"
ON public.user_virtue_stage_progress
FOR SELECT
USING (
  user_id IN (
    SELECT practitioner_id 
    FROM public.sponsor_relationships 
    WHERE sponsor_id = auth.uid() 
    AND status = 'active'
  )
);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_virtue_stage_progress'
AND policyname = 'Sponsors can view practitioner progress';
