-- ============================================================================
-- SUPPLEMENTARY PRODUCTION MIGRATION: COACHING TABLES
-- Date: 2025-01-15
-- 
-- ⚠️  CRITICAL: RUN AFTER PRODUCTION_MIGRATION_COMPLETE_V2.sql ⚠️
-- 
-- This script adds the missing coaching-related tables that are essential
-- for the coach desktop and coaching functionality to work properly.
-- 
-- BACKUP YOUR DATABASE BEFORE RUNNING!
-- 
-- Missing tables identified:
-- 1. sponsor_connections - Coach/practitioner relationships
-- 2. sponsor_chat_messages - Chat system between coaches and practitioners  
-- 3. sponsor_visible_memos - Shared memos between coaches and practitioners
-- 4. Additional supporting tables for coaching workflow
-- ============================================================================

-- ============================================================================
-- STEP 1: SPONSOR CONNECTIONS TABLE
-- ============================================================================

-- Create sponsor connections table for coach-practitioner relationships
CREATE TABLE IF NOT EXISTS public.sponsor_connections (
  id SERIAL PRIMARY KEY,
  practitioner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sponsor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique active connections
  UNIQUE(practitioner_user_id, sponsor_user_id, status)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsor_connections_practitioner ON public.sponsor_connections(practitioner_user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_connections_sponsor ON public.sponsor_connections(sponsor_user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_connections_status ON public.sponsor_connections(status);

-- Add RLS
ALTER TABLE public.sponsor_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sponsor connections (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Users can view their own connections" ON public.sponsor_connections;
CREATE POLICY "Users can view their own connections" ON public.sponsor_connections
  FOR SELECT USING (
    auth.uid() = practitioner_user_id OR 
    auth.uid() = sponsor_user_id
  );

DROP POLICY IF EXISTS "Coaches can create connections" ON public.sponsor_connections;
CREATE POLICY "Coaches can create connections" ON public.sponsor_connections
  FOR INSERT WITH CHECK (
    auth.uid() = sponsor_user_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND ('org-coach' = ANY(roles) OR 'coach' = ANY(roles) OR 'sponsor' = ANY(roles))
    )
  );

DROP POLICY IF EXISTS "Coaches can update their connections" ON public.sponsor_connections;
CREATE POLICY "Coaches can update their connections" ON public.sponsor_connections
  FOR UPDATE USING (
    auth.uid() = sponsor_user_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND ('org-coach' = ANY(roles) OR 'coach' = ANY(roles) OR 'sponsor' = ANY(roles))
    )
  );

-- Add updated_at trigger (drop and recreate for idempotency)
DROP TRIGGER IF EXISTS update_sponsor_connections_updated_at ON public.sponsor_connections;
CREATE TRIGGER update_sponsor_connections_updated_at 
  BEFORE UPDATE ON public.sponsor_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ====
========================================================================
-- STEP 2: SPONSOR CHAT MESSAGES TABLE
-- ============================================================================

-- Create sponsor chat messages table for coach-practitioner communication
CREATE TABLE IF NOT EXISTS public.sponsor_chat_messages (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER NOT NULL REFERENCES public.sponsor_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsor_chat_messages_connection ON public.sponsor_chat_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_chat_messages_sender ON public.sponsor_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_chat_messages_created_at ON public.sponsor_chat_messages(created_at);

-- Add RLS
ALTER TABLE public.sponsor_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat messages (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Users can view messages in their connections" ON public.sponsor_chat_messages;
CREATE POLICY "Users can view messages in their connections" ON public.sponsor_chat_messages
  FOR SELECT USING (
    connection_id IN (
      SELECT id FROM public.sponsor_connections 
      WHERE practitioner_user_id = auth.uid() OR sponsor_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages in their connections" ON public.sponsor_chat_messages;
CREATE POLICY "Users can send messages in their connections" ON public.sponsor_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    connection_id IN (
      SELECT id FROM public.sponsor_connections 
      WHERE practitioner_user_id = auth.uid() OR sponsor_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.sponsor_chat_messages;
CREATE POLICY "Users can update their own messages" ON public.sponsor_chat_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Add updated_at trigger (drop and recreate for idempotency)
DROP TRIGGER IF EXISTS update_sponsor_chat_messages_updated_at ON public.sponsor_chat_messages;
CREATE TRIGGER update_sponsor_chat_messages_updated_at 
  BEFORE UPDATE ON public.sponsor_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();-- 
============================================================================
-- STEP 3: SPONSOR VISIBLE MEMOS TABLE
-- ============================================================================

-- Create sponsor visible memos table for shared practitioner reflections
CREATE TABLE IF NOT EXISTS public.sponsor_visible_memos (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  virtue_id INTEGER NOT NULL REFERENCES public.virtues(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL CHECK (stage_number BETWEEN 1 AND 12),
  memo_text TEXT,
  practitioner_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sponsor_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique memo per user/virtue/stage
  UNIQUE(user_id, virtue_id, stage_number)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_user ON public.sponsor_visible_memos(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_virtue ON public.sponsor_visible_memos(virtue_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_stage ON public.sponsor_visible_memos(stage_number);
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_unread ON public.sponsor_visible_memos(sponsor_read_at) WHERE sponsor_read_at IS NULL;

-- Add RLS
ALTER TABLE public.sponsor_visible_memos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visible memos (drop and recreate for idempotency)
DROP POLICY IF EXISTS "Practitioners can manage their own memos" ON public.sponsor_visible_memos;
CREATE POLICY "Practitioners can manage their own memos" ON public.sponsor_visible_memos
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can view memos of their practitioners" ON public.sponsor_visible_memos;
CREATE POLICY "Coaches can view memos of their practitioners" ON public.sponsor_visible_memos
  FOR SELECT USING (
    user_id IN (
      SELECT practitioner_user_id FROM public.sponsor_connections 
      WHERE sponsor_user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Coaches can update read status of their practitioners memos" ON public.sponsor_visible_memos;
CREATE POLICY "Coaches can update read status of their practitioners memos" ON public.sponsor_visible_memos
  FOR UPDATE USING (
    user_id IN (
      SELECT practitioner_user_id FROM public.sponsor_connections 
      WHERE sponsor_user_id = auth.uid() AND status = 'active'
    )
  );

-- Add updated_at trigger (drop and recreate for idempotency)
DROP TRIGGER IF EXISTS update_sponsor_visible_memos_updated_at ON public.sponsor_visible_memos;
CREATE TRIGGER update_sponsor_visible_memos_updated_at 
  BEFORE UPDATE ON public.sponsor_visible_memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();--
 ============================================================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_visible_memos TO authenticated;

-- Grant usage on sequences (using dynamic approach to handle different sequence naming)
DO $$
DECLARE
    seq_name TEXT;
BEGIN
    -- Grant permissions on sequences for tables with SERIAL columns
    FOR seq_name IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public' 
        AND (sequence_name LIKE '%sponsor_connections%' 
             OR sequence_name LIKE '%sponsor_chat_messages%' 
             OR sequence_name LIKE '%sponsor_visible_memos%')
    LOOP
        EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE public.%I TO authenticated', seq_name);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 5: HELPER FUNCTIONS FOR COACHING WORKFLOW
-- ============================================================================

-- Function to create coach-practitioner connection
CREATE OR REPLACE FUNCTION create_coach_connection(
  practitioner_id UUID,
  coach_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  connection_id INTEGER
) AS $$
DECLARE
  final_coach_id UUID;
  new_connection_id INTEGER;
BEGIN
  -- Use provided coach_id or current user
  final_coach_id := COALESCE(coach_id, auth.uid());
  
  -- Verify coach has appropriate role
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = final_coach_id 
    AND ('org-coach' = ANY(roles) OR 'coach' = ANY(roles) OR 'sponsor' = ANY(roles))
  ) THEN
    RETURN QUERY SELECT false, 'User does not have coach permissions', NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Create connection
  INSERT INTO public.sponsor_connections (practitioner_user_id, sponsor_user_id, status)
  VALUES (practitioner_id, final_coach_id, 'active')
  RETURNING id INTO new_connection_id;
  
  RETURN QUERY SELECT 
    true, 
    'Coach connection created successfully',
    new_connection_id;
    
EXCEPTION
  WHEN unique_violation THEN
    RETURN QUERY SELECT 
      false, 
      'Connection already exists between these users',
      NULL::INTEGER;
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      false, 
      format('Error creating connection: %s', SQLERRM),
      NULL::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to share memo with coach
CREATE OR REPLACE FUNCTION share_memo_with_coach(
  p_virtue_id INTEGER,
  p_stage_number INTEGER,
  p_memo_text TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT
) AS $$
BEGIN
  -- Insert or update memo
  INSERT INTO public.sponsor_visible_memos (
    user_id, 
    virtue_id, 
    stage_number, 
    memo_text, 
    practitioner_updated_at
  ) VALUES (
    auth.uid(), 
    p_virtue_id, 
    p_stage_number, 
    p_memo_text, 
    NOW()
  )
  ON CONFLICT (user_id, virtue_id, stage_number) 
  DO UPDATE SET 
    memo_text = EXCLUDED.memo_text,
    practitioner_updated_at = NOW(),
    sponsor_read_at = NULL, -- Reset read status when updated
    updated_at = NOW();
  
  RETURN QUERY SELECT true, 'Memo shared with coach successfully';
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT 
      false, 
      format('Error sharing memo: %s', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions on functions
GRANT EXECUTE ON FUNCTION create_coach_connection(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION share_memo_with_coach(INTEGER, INTEGER, TEXT) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all coaching tables exist
SELECT 'Coaching tables created successfully' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_connections')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_chat_messages')
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_visible_memos');

-- Verify RLS is enabled
SELECT 'RLS policies created successfully' as status
WHERE EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsor_connections')
  AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsor_chat_messages')
  AND EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sponsor_visible_memos');

-- Verify functions exist
SELECT 'Coaching functions created successfully' as status
WHERE EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_coach_connection')
  AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'share_memo_with_coach');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Add function documentation
COMMENT ON FUNCTION create_coach_connection(UUID, UUID) IS 'Creates a connection between a coach and practitioner';
COMMENT ON FUNCTION share_memo_with_coach(INTEGER, INTEGER, TEXT) IS 'Shares a practitioner memo with their coach';

-- Add table documentation
COMMENT ON TABLE public.sponsor_connections IS 'Manages relationships between coaches and practitioners';
COMMENT ON TABLE public.sponsor_chat_messages IS 'Chat messages between coaches and practitioners';
COMMENT ON TABLE public.sponsor_visible_memos IS 'Practitioner memos shared with coaches';

-- If you see all success messages above, the coaching tables migration completed successfully!
-- Your coach desktop and coaching functionality should now work properly.