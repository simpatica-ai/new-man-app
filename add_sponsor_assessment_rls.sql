-- ============================================================================
-- Add RLS policy to allow sponsors to view their practitioners' assessment data
-- ============================================================================

-- Allow sponsors to view assessment results for their practitioners
CREATE POLICY "Sponsors can view practitioner assessment results"
ON public.user_assessment_results
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
  cmd
FROM pg_policies
WHERE tablename = 'user_assessment_results'
AND policyname = 'Sponsors can view practitioner assessment results';
