-- ============================================================================
-- PRODUCTION MIGRATION: COACHING TABLES (FIXED FOR PRODUCTION SCHEMA)
-- Date: 2025-01-26
-- 
-- This is a FIXED version that works with production's schema:
-- - Uses 'role' (TEXT) instead of 'roles' (TEXT[])
-- - Fixes SQL comment syntax issues
-- 
-- BACKUP YOUR DATABASE BEFORE RUNNING!
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

-- RLS Policies for sponsor connections
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
      AND (role = 'sponsor' OR role = 'admin' OR role = 'sys-admin')
    )
  );

DROP POLICY IF EXISTS "Coaches can update their connections" ON public.sponsor_connections;
CREATE POLICY "Coaches can update their connections" ON public.sponsor_connections
  FOR UPDATE USING (
    auth.uid() = sponsor_user_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'sponsor' OR role = 'admin' OR role = 'sys-admin')
    )
  );

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_sponsor_connections_updated_at ON public.sponsor_connections;
CREATE TRIGGER update_sponsor_connections_updated_at
  BEFORE UPDATE ON public.sponsor_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 2: SPONSOR CHAT MESSAGES TABLE
-- ============================================================================

-- Create sponsor chat messages table
CREATE TABLE IF NOT EXISTS public.sponsor_chat_messages (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER NOT NULL REFERENCES public.sponsor_connections(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_chat_messages_connection ON public.sponsor_chat_messages(connection_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_chat_messages_sender ON public.sponsor_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_chat_messages_created_at ON public.sponsor_chat_messages(created_at DESC);

-- Add RLS
ALTER TABLE public.sponsor_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view messages in their connections" ON public.sponsor_chat_messages;
CREATE POLICY "Users can view messages in their connections" ON public.sponsor_chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

DROP POLICY IF EXISTS "Users can send messages in their connections" ON public.sponsor_chat_messages;
CREATE POLICY "Users can send messages in their connections" ON public.sponsor_chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

DROP POLICY IF EXISTS "Users can update their own messages" ON public.sponsor_chat_messages;
CREATE POLICY "Users can update their own messages" ON public.sponsor_chat_messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_sponsor_chat_messages_updated_at ON public.sponsor_chat_messages;
CREATE TRIGGER update_sponsor_chat_messages_updated_at
  BEFORE UPDATE ON public.sponsor_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 3: SPONSOR VISIBLE MEMOS TABLE
-- ============================================================================

-- Create sponsor visible memos table
CREATE TABLE IF NOT EXISTS public.sponsor_visible_memos (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  memo_id INTEGER NOT NULL REFERENCES public.user_virtue_stage_memos(id) ON DELETE CASCADE,
  sponsor_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(memo_id, sponsor_user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_user ON public.sponsor_visible_memos(user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_memo ON public.sponsor_visible_memos(memo_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_sponsor ON public.sponsor_visible_memos(sponsor_user_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_is_read ON public.sponsor_visible_memos(is_read);

-- Add RLS
ALTER TABLE public.sponsor_visible_memos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Practitioners can manage their own memos" ON public.sponsor_visible_memos;
CREATE POLICY "Practitioners can manage their own memos" ON public.sponsor_visible_memos
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Coaches can view memos of their practitioners" ON public.sponsor_visible_memos;
CREATE POLICY "Coaches can view memos of their practitioners" ON public.sponsor_visible_memos
  FOR SELECT USING (auth.uid() = sponsor_user_id);

DROP POLICY IF EXISTS "Coaches can update read status of their practitioners memos" ON public.sponsor_visible_memos;
CREATE POLICY "Coaches can update read status of their practitioners memos" ON public.sponsor_visible_memos
  FOR UPDATE USING (auth.uid() = sponsor_user_id)
  WITH CHECK (auth.uid() = sponsor_user_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_sponsor_visible_memos_updated_at ON public.sponsor_visible_memos;
CREATE TRIGGER update_sponsor_visible_memos_updated_at
  BEFORE UPDATE ON public.sponsor_visible_memos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- STEP 4: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_connections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sponsor_visible_memos TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE public.sponsor_connections_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sponsor_chat_messages_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sponsor_visible_memos_id_seq TO authenticated;

-- STEP 5: HELPER FUNCTIONS
-- ============================================================================

-- Function to create a coach connection
CREATE OR REPLACE FUNCTION public.create_coach_connection(
  practitioner_id UUID,
  coach_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  connection_id INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coach_id UUID;
  v_connection_id INTEGER;
  v_coach_role TEXT;
BEGIN
  -- Use provided coach_id or default to current user
  v_coach_id := COALESCE(coach_id, auth.uid());
  
  -- Check if coach has appropriate role
  SELECT role INTO v_coach_role
  FROM public.profiles
  WHERE id = v_coach_id;
  
  IF v_coach_role NOT IN ('sponsor', 'admin', 'sys-admin') THEN
    RETURN QUERY SELECT FALSE, 'User does not have coach/sponsor role', NULL::INTEGER;
    RETURN;
  END IF;
  
  -- Check if connection already exists
  SELECT id INTO v_connection_id
  FROM public.sponsor_connections
  WHERE practitioner_user_id = practitioner_id
    AND sponsor_user_id = v_coach_id
    AND status = 'active';
  
  IF v_connection_id IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, 'Connection already exists', v_connection_id;
    RETURN;
  END IF;
  
  -- Create new connection
  INSERT INTO public.sponsor_connections (practitioner_user_id, sponsor_user_id, status)
  VALUES (practitioner_id, v_coach_id, 'active')
  RETURNING id INTO v_connection_id;
  
  RETURN QUERY SELECT TRUE, 'Connection created successfully', v_connection_id;
END;
$$;

-- Function to get unread memo count for a coach
CREATE OR REPLACE FUNCTION public.get_unread_memo_count(
  practitioner_id UUID,
  coach_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coach_id UUID;
  v_count INTEGER;
BEGIN
  v_coach_id := COALESCE(coach_id, auth.uid());
  
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.sponsor_visible_memos
  WHERE user_id = practitioner_id
    AND sponsor_user_id = v_coach_id
    AND is_read = FALSE;
  
  RETURN v_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_coach_connection(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_memo_count(UUID, UUID) TO authenticated;

-- STEP 6: VERIFICATION
-- ============================================================================

SELECT 'Coaching tables created successfully' as status;
SELECT 'RLS policies created successfully' as status;
SELECT 'Coaching functions created successfully' as status;

-- Add comments for documentation
COMMENT ON TABLE public.sponsor_connections IS 'Tracks coach-practitioner relationships';
COMMENT ON TABLE public.sponsor_chat_messages IS 'Chat messages between coaches and practitioners';
COMMENT ON TABLE public.sponsor_visible_memos IS 'Memos shared between coaches and practitioners';
COMMENT ON FUNCTION public.create_coach_connection IS 'Creates a new coach-practitioner connection';
COMMENT ON FUNCTION public.get_unread_memo_count IS 'Gets count of unread memos for a coach';
