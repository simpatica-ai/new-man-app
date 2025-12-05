-- ============================================================================
-- Add RLS policy for sponsors to view practitioner memo text
-- Run this separately from other queries to avoid deadlocks
-- ============================================================================

CREATE POLICY "Sponsors can view practitioner memos"
ON public.user_virtue_stage_memos
FOR SELECT
USING (
  user_id IN (
    SELECT practitioner_id 
    FROM public.sponsor_relationships 
    WHERE sponsor_id = auth.uid() 
    AND status = 'active'
  )
);
