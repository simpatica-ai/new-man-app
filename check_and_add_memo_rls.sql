-- First, check what policies exist on user_virtue_stage_memos
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'user_virtue_stage_memos' 
AND schemaname = 'public';

-- If no policy exists for sponsors, create it
-- Run this as a separate command if the above shows no sponsor policy:

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_virtue_stage_memos' 
    AND policyname = 'Sponsors can view practitioner memos'
  ) THEN
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
    RAISE NOTICE 'Policy created successfully';
  ELSE
    RAISE NOTICE 'Policy already exists';
  END IF;
END $$;
