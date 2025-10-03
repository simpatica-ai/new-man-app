-- Create table for AI prompt feedback
CREATE TABLE IF NOT EXISTS ai_prompt_feedback (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES profiles(id),
    prompt_name varchar(100) NOT NULL,
    prompt_content text NOT NULL,
    feedback_type varchar(20) NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
    feedback_text text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add index for querying feedback by prompt name
CREATE INDEX IF NOT EXISTS idx_ai_prompt_feedback_prompt_name ON ai_prompt_feedback(prompt_name);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_feedback_created_at ON ai_prompt_feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_prompt_feedback_user_id ON ai_prompt_feedback(user_id);