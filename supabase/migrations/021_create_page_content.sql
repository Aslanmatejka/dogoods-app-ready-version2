-- Create page_content table for storing editable page content
CREATE TABLE IF NOT EXISTS page_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_name VARCHAR(255) UNIQUE NOT NULL,
    content JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on page_name for faster lookups
CREATE INDEX IF NOT EXISTS idx_page_content_page_name ON page_content(page_name);

-- Enable Row Level Security
ALTER TABLE page_content ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to page_content"
    ON page_content
    FOR SELECT
    USING (true);

-- Policy: Allow only admins to insert/update/delete
CREATE POLICY "Allow admins to manage page_content"
    ON page_content
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Add comment
COMMENT ON TABLE page_content IS 'Stores editable content for CMS-like page editing by admins';
