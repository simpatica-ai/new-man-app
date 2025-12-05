-- ============================================================================
-- Add RLS policy for sponsors to view practitioner assessments (for summary)
-- ============================================================================

-- Check existing policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'user_assessments' 
AND schemaname = 'public';

-- Create policy for sponsors to view practitioner assessments
CREATE POLICY "Sponsors can view practitioner assessments"
ON public.user_assessments
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
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'user_assessments' 
AND policyname = 'Sponsors can view practitioner assessments';
