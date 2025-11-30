-- ============================================================================
-- LOCAL MIGRATION: COACHING TABLES (FOR LOCAL TESTING)
-- Date: 2025-11-25
-- 
-- This is the LOCAL version adapted for the local database schema
-- Once tested, the PRODUCTION version will be deployed to production
-- 
-- Key differences from production version:
-- - Uses `role` (TEXT) instead of `roles` (TEXT[])
-- - Adapted for local schema structure
-- ============================================================================

-- ============================================================================
-- STEP 1: SPONSOR CHAT MESSAGES TABLE
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

-- RLS Policies for chat messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.sponsor_chat_messages;
CREATE POLICY "Users can view their own messages" ON public.sponsor_chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.sponsor_chat_messages;
CREATE POLICY "Users can send messages" ON public.sponsor_chat_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update their own messages" ON public.sponsor_chat_messages;
CREATE POLICY "Users can update their own messages" ON public.sponsor_chat_messages
  FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_sponsor_chat_messages_updated_at ON public.sponsor_chat_messages;
CREATE TRIGGER update_sponsor_chat_messages_updated_at 
  BEFORE UPDATE ON public.sponsor_chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 2: SPONSOR VISIBLE MEMOS TABLE
-- ============================================================================

-- Create sponsor visible memos table for shared reflections
CREATE TABLE IF NOT EXISTS public.sponsor_visible_memos (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  virtue_id INTEGER NOT NULL,
  stage_number INTEGER NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_virtue_stage ON public.sponsor_visible_memos(virtue_id, stage_number);
CREATE INDEX IF NOT EXISTS idx_sponsor_visible_memos_updated ON public.sponsor_visible_memos(practitioner_updated_at);

-- Add RLS
ALTER TABLE public.sponsor_visible_memos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visible memos
DROP POLICY IF EXISTS "Users can view their own memos" ON public.sponsor_visible_memos;
CREATE POLICY "Users can view their own memos" ON public.sponsor_visible_memos
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sponsors can view practitioner memos" ON public.sponsor_visible_memos;
CREATE POLICY "Sponsors can view practitioner memos" ON public.sponsor_visible_memos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sponsor_connections sc
      WHERE sc.practitioner_user_id = sponsor_visible_memos.user_id
      AND sc.sponsor_user_id = auth.uid()
      AND sc.status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can create their own memos" ON public.sponsor_visible_memos;
CREATE POLICY "Users can create their own memos" ON public.sponsor_visible_memos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own memos" ON public.sponsor_visible_memos;
CREATE POLICY "Users can update their own memos" ON public.sponsor_visible_memos
  FOR UPDATE USING (auth.uid() = user_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_sponsor_visible_memos_updated_at ON public.sponsor_visible_memos;
CREATE TRIGGER update_sponsor_visible_memos_updated_at 
  BEFORE UPDATE ON public.sponsor_visible_memos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Coaching tables created successfully' as status;

-- Verify tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('sponsor_chat_messages', 'sponsor_visible_memos');
