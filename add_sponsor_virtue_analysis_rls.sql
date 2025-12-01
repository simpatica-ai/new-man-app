-- ============================================================================
-- Add RLS policy for sponsors to view practitioner virtue analysis
-- ============================================================================

-- Check existing policies
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'virtue_analysis' 
AND schemaname = 'public';

-- Create policy for sponsors to view practitioner virtue analysis
CREATE POLICY "Sponsors can view practitioner virtue analysis"
ON public.virtue_analysis
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
WHERE tablename = 'virtue_analysis' 
AND policyname = 'Sponsors can view practitioner virtue analysis';
