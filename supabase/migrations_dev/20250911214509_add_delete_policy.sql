-- Add delete policy for sponsor relationships
CREATE POLICY "Users can delete their sponsor invitations" ON public.sponsor_relationships
  FOR DELETE USING (auth.uid() = practitioner_id);
