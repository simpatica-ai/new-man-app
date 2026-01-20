-- Add tracking columns to virtue_prompts table for better prompt history management
-- Migration: add_virtue_prompts_tracking_columns
-- Created: 2025-01-20

-- Add defect_focus column to track which specific defect the prompt addressed
ALTER TABLE virtue_prompts 
ADD COLUMN IF NOT EXISTS defect_focus TEXT;

-- Add prompt_sequence column to track the order of prompts (1st, 2nd, 3rd, etc.)
ALTER TABLE virtue_prompts 
ADD COLUMN IF NOT EXISTS prompt_sequence INTEGER;

-- Add is_completion_prompt column to flag when AI recognizes completion
ALTER TABLE virtue_prompts 
ADD COLUMN IF NOT EXISTS is_completion_prompt BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN virtue_prompts.defect_focus IS 'The specific character defect this prompt focused on (e.g., Lying, Manipulation)';
COMMENT ON COLUMN virtue_prompts.prompt_sequence IS 'Sequential number of this prompt for the virtue/stage (1st prompt, 2nd prompt, etc.)';
COMMENT ON COLUMN virtue_prompts.is_completion_prompt IS 'True when this prompt recognizes the user has completed dismantling for this virtue';

-- Create index on defect_focus for faster queries by coaches/therapists
CREATE INDEX IF NOT EXISTS idx_virtue_prompts_defect_focus ON virtue_prompts(defect_focus);

-- Create index on is_completion_prompt for tracking completion
CREATE INDEX IF NOT EXISTS idx_virtue_prompts_completion ON virtue_prompts(is_completion_prompt) WHERE is_completion_prompt = TRUE;
