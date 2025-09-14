-- Create alpha_feedback table
CREATE TABLE alpha_feedback (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT,
    show_name BOOLEAN DEFAULT false,
    testing_time TEXT,
    completed_assessment TEXT,
    stages_completed TEXT,
    overall_ux INTEGER,
    ai_relevance INTEGER,
    ai_helpfulness INTEGER,
    ai_quality TEXT,
    writing_experience TEXT,
    technical_issues TEXT[], -- Array of strings
    likely_to_use INTEGER,
    motivation TEXT,
    value_comparison TEXT,
    biggest_missing TEXT,
    feature_requests TEXT,
    additional_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE alpha_feedback ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own feedback
CREATE POLICY "Users can insert their own feedback" ON alpha_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to view their own feedback
CREATE POLICY "Users can view their own feedback" ON alpha_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Policy for admins to view all feedback (you'll need to adjust this based on your admin setup)
CREATE POLICY "Admins can view all feedback" ON alpha_feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
