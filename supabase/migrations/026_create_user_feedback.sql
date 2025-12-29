-- Create user feedback table for error reports and suggestions
CREATE TABLE IF NOT EXISTS user_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    feedback_type TEXT NOT NULL CHECK (feedback_type IN ('error', 'bug', 'suggestion', 'feature', 'other')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    page_url TEXT,
    browser_info JSONB,
    screenshot_url TEXT,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    admin_notes TEXT,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_feedback_user_id ON user_feedback(user_id);
CREATE INDEX idx_feedback_status ON user_feedback(status);
CREATE INDEX idx_feedback_type ON user_feedback(feedback_type);
CREATE INDEX idx_feedback_created_at ON user_feedback(created_at DESC);

-- Enable RLS
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback"
    ON user_feedback
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        user_email = auth.email()
    );

-- Policy: Anyone (including anonymous) can submit feedback
CREATE POLICY "Anyone can submit feedback"
    ON user_feedback
    FOR INSERT
    WITH CHECK (true);

-- Policy: Admins can view all feedback
CREATE POLICY "Admins can view all feedback"
    ON user_feedback
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Policy: Admins can update feedback
CREATE POLICY "Admins can update feedback"
    ON user_feedback
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Policy: Admins can delete feedback
CREATE POLICY "Admins can delete feedback"
    ON user_feedback
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_feedback_timestamp
    BEFORE UPDATE ON user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- Add comment
COMMENT ON TABLE user_feedback IS 'Stores user feedback, error reports, and suggestions';
