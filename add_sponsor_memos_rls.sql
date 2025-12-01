-- ============================================================================
-- Add RLS policy for sponsors to view practitioner memos
-- ============================================================================

-- Allow sponsors to view memos from their practitioners
CREATE POLICY "Sponsors can view practitioner memos"
ON public.sponsor_visible_memos
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
WHERE tablename = 'sponsor_visible_memos'
AND policyname = 'Sponsors can view practitioner memos';
