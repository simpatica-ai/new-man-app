-- Development Database Schema
-- Generated from production database schema

-- Create sequences first
CREATE SEQUENCE IF NOT EXISTS defects_id_seq;
CREATE SEQUENCE IF NOT EXISTS error_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS user_virtue_ai_prompts_id_seq;
CREATE SEQUENCE IF NOT EXISTS virtue_prompts_id_seq;
CREATE SEQUENCE IF NOT EXISTS virtue_training_data_id_seq;

-- Create tables
CREATE TABLE IF NOT EXISTS affirmations (
    id bigint PRIMARY KEY, 
    created_at timestamptz DEFAULT now(), 
    text text NOT NULL, 
    virtue_id bigint NOT NULL
);

CREATE TABLE IF NOT EXISTS defects (
    id SERIAL PRIMARY KEY, 
    name varchar(255) NOT NULL, 
    category varchar(255), 
    definition text, 
    icon_name varchar(50)
);

CREATE TABLE IF NOT EXISTS defects_virtues (
    defect_id integer NOT NULL, 
    virtue_id integer NOT NULL
);

CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY, 
    error_message text NOT NULL, 
    error_code varchar(50), 
    context varchar(100) NOT NULL, 
    user_id uuid, 
    user_agent text, 
    url text, 
    stack_trace text, 
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id bigint NOT NULL, 
    created_at timestamptz NOT NULL DEFAULT now(), 
    user_id uuid NOT NULL, 
    entry_text text
);

CREATE TABLE IF NOT EXISTS practitioner_freeform_entries (
    id bigint NOT NULL, 
    user_id uuid NOT NULL, 
    entry_text text NOT NULL, 
    created_at timestamptz NOT NULL DEFAULT now(), 
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practitioner_stage_memos (
    id bigint NOT NULL, 
    user_id uuid NOT NULL, 
    virtue_id bigint NOT NULL, 
    stage_number smallint NOT NULL, 
    memo_text text NOT NULL, 
    created_at timestamptz NOT NULL DEFAULT now(), 
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_with_email (
    id uuid, 
    full_name text, 
    role text, 
    user_email varchar(255)
);

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY, 
    role text DEFAULT 'user'::text, 
    full_name text, 
    phone_number text, 
    created_at timestamptz DEFAULT now(), 
    has_completed_first_assessment boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS sponsor_chat_messages (
    id bigint NOT NULL, 
    connection_id bigint NOT NULL, 
    sender_id uuid NOT NULL, 
    receiver_id uuid NOT NULL, 
    message_text text NOT NULL, 
    message_search tsvector, 
    created_at timestamptz NOT NULL DEFAULT now(), 
    updated_at timestamptz NOT NULL DEFAULT now(), 
    read_at timestamptz, 
    deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS sponsor_connections (
    id bigint NOT NULL, 
    practitioner_user_id uuid, 
    sponsor_user_id uuid, 
    status text DEFAULT 'pending'::text, 
    journal_shared boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS sponsor_feedback (
    id bigint NOT NULL, 
    connection_id bigint, 
    journal_entry_id bigint, 
    feedback_text text NOT NULL, 
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsor_relationships (
    id uuid NOT NULL DEFAULT gen_random_uuid(), 
    sponsor_id uuid, 
    practitioner_id uuid, 
    sponsor_email text, 
    invitation_token uuid DEFAULT gen_random_uuid(), 
    status text DEFAULT 'pending'::text, 
    created_at timestamptz DEFAULT now(), 
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sponsor_visible_memos (
    id bigint NOT NULL, 
    user_id uuid NOT NULL, 
    virtue_id bigint NOT NULL, 
    stage_number smallint NOT NULL, 
    memo_text text, 
    practitioner_updated_at timestamptz NOT NULL DEFAULT now(), 
    sponsor_read_at timestamptz
);

CREATE TABLE IF NOT EXISTS stage_prompts (
    id bigint NOT NULL, 
    stage_id bigint, 
    prompt_text text NOT NULL, 
    prompt_type text NOT NULL
);

CREATE TABLE IF NOT EXISTS support_tickets (
    id bigint NOT NULL, 
    created_at timestamptz NOT NULL DEFAULT now(), 
    user_id uuid NOT NULL, 
    subject text NOT NULL, 
    message text NOT NULL, 
    status text NOT NULL DEFAULT 'Open'
);

CREATE TABLE IF NOT EXISTS user_active_virtue (
    id bigint NOT NULL, 
    user_id uuid, 
    virtue_id bigint
);

CREATE TABLE IF NOT EXISTS user_activity_sessions (
    user_id uuid NOT NULL, 
    last_seen timestamptz NOT NULL DEFAULT now(), 
    current_page text, 
    created_at timestamptz DEFAULT now(), 
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_assessment_defects (
    id bigint NOT NULL, 
    assessment_id bigint NOT NULL, 
    user_id uuid NOT NULL, 
    defect_name text NOT NULL, 
    rating smallint NOT NULL, 
    harm_level text NOT NULL, 
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_assessment_results (
    id bigint NOT NULL, 
    assessment_id bigint NOT NULL, 
    user_id uuid NOT NULL, 
    virtue_name text NOT NULL, 
    priority_score smallint NOT NULL, 
    created_at timestamptz NOT NULL DEFAULT now(), 
    defect_intensity numeric(5,2)
);

CREATE TABLE IF NOT EXISTS user_assessments (
    id bigint NOT NULL, 
    user_id uuid NOT NULL, 
    created_at timestamptz NOT NULL DEFAULT now(), 
    assessment_type text NOT NULL, 
    status text NOT NULL DEFAULT 'pending'::text, 
    summary_analysis text
);

CREATE TABLE IF NOT EXISTS user_virtue_ai_prompts (
    id SERIAL PRIMARY KEY, 
    user_id uuid NOT NULL, 
    virtue_id integer NOT NULL, 
    stage_number integer NOT NULL, 
    prompt_text text NOT NULL, 
    memo_hash text NOT NULL, 
    created_at timestamptz DEFAULT now(), 
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_virtue_stage_memos (
    id bigint NOT NULL, 
    created_at timestamptz DEFAULT now(), 
    user_id uuid NOT NULL, 
    virtue_id bigint NOT NULL, 
    stage_number integer NOT NULL, 
    memo_text text
);

CREATE TABLE IF NOT EXISTS user_virtue_stage_progress (
    id bigint NOT NULL, 
    user_id uuid NOT NULL, 
    virtue_id bigint NOT NULL, 
    stage_number smallint NOT NULL, 
    status text NOT NULL DEFAULT 'not_started'::text, 
    created_at timestamptz NOT NULL DEFAULT now(), 
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS virtue_analysis (
    id bigint NOT NULL, 
    created_at timestamptz DEFAULT now(), 
    user_id uuid NOT NULL, 
    assessment_id bigint NOT NULL, 
    virtue_id bigint NOT NULL, 
    analysis_text text
);

CREATE TABLE IF NOT EXISTS virtue_prompts (
    id SERIAL PRIMARY KEY, 
    user_id uuid, 
    virtue_id integer, 
    stage_number integer NOT NULL, 
    prompt_text text NOT NULL, 
    user_response text, 
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS virtue_stages (
    id bigint NOT NULL, 
    virtue_id bigint, 
    stage_number integer NOT NULL, 
    title text
);

CREATE TABLE IF NOT EXISTS virtue_training_data (
    id SERIAL PRIMARY KEY, 
    input_text text NOT NULL, 
    output_text text NOT NULL, 
    prompt_used text, 
    philosophical_tradition varchar(50), 
    created_at timestamptz DEFAULT now(), 
    updated_at timestamptz DEFAULT now(), 
    created_by uuid, 
    is_approved boolean DEFAULT false, 
    notes text, 
    prompt_name varchar(100)
);

CREATE TABLE IF NOT EXISTS virtues (
    id bigint PRIMARY KEY, 
    name text NOT NULL, 
    description text, 
    story_of_virtue text, 
    author_reflection text, 
    short_description text, 
    virtue_guide text
);
-- Add
 primary key constraints for tables that need them
ALTER TABLE defects_virtues ADD CONSTRAINT defect_virtues_pkey PRIMARY KEY (defect_id, virtue_id);
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_pkey PRIMARY KEY (id);
ALTER TABLE practitioner_freeform_entries ADD CONSTRAINT practitioner_freeform_entries_pkey PRIMARY KEY (id);
ALTER TABLE practitioner_stage_memos ADD CONSTRAINT practitioner_stage_memos_pkey PRIMARY KEY (id);
ALTER TABLE sponsor_chat_messages ADD CONSTRAINT sponsor_chat_messages_pkey PRIMARY KEY (id);
ALTER TABLE sponsor_connections ADD CONSTRAINT sponsor_connections_pkey PRIMARY KEY (id);
ALTER TABLE sponsor_feedback ADD CONSTRAINT sponsor_feedback_pkey PRIMARY KEY (id);
ALTER TABLE sponsor_relationships ADD CONSTRAINT sponsor_relationships_pkey PRIMARY KEY (id);
ALTER TABLE sponsor_visible_memos ADD CONSTRAINT sponsor_visible_memos_pkey PRIMARY KEY (id);
ALTER TABLE stage_prompts ADD CONSTRAINT stage_prompts_pkey PRIMARY KEY (id);
ALTER TABLE support_tickets ADD CONSTRAINT support_tickets_pkey PRIMARY KEY (id);
ALTER TABLE user_active_virtue ADD CONSTRAINT user_active_virtue_pkey PRIMARY KEY (id);
ALTER TABLE user_activity_sessions ADD CONSTRAINT user_activity_sessions_pkey PRIMARY KEY (user_id);
ALTER TABLE user_assessment_defects ADD CONSTRAINT user_assessment_defects_pkey PRIMARY KEY (id);
ALTER TABLE user_assessment_results ADD CONSTRAINT user_assessment_results_pkey PRIMARY KEY (id);
ALTER TABLE user_assessments ADD CONSTRAINT user_assessments_pkey PRIMARY KEY (id);
ALTER TABLE user_virtue_stage_memos ADD CONSTRAINT user_virtue_stage_memos_pkey PRIMARY KEY (id);
ALTER TABLE user_virtue_stage_progress ADD CONSTRAINT user_virtue_stage_progress_pkey PRIMARY KEY (id);
ALTER TABLE virtue_analysis ADD CONSTRAINT virtue_analysis_pkey PRIMARY KEY (id);
ALTER TABLE virtue_stages ADD CONSTRAINT virtue_stages_pkey PRIMARY KEY (id);