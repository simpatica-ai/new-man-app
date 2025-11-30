-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their sponsor relationships" ON public.sponsor_relationships;
DROP POLICY IF EXISTS "Users can accept sponsor invitations" ON public.sponsor_relationships;
DROP POLICY IF EXISTS "Users can create sponsor invitations" ON public.sponsor_relationships;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view their sponsor relationships" ON public.sponsor_relationships
  FOR SELECT USING (
    auth.uid() = sponsor_id 
    OR auth.uid() = practitioner_id
  );

CREATE POLICY "Users can create sponsor invitations" ON public.sponsor_relationships
  FOR INSERT WITH CHECK (auth.uid() = practitioner_id);

CREATE POLICY "Users can update sponsor relationships" ON public.sponsor_relationships
  FOR UPDATE USING (
    auth.uid() = sponsor_id 
    OR auth.uid() = practitioner_id
  );
