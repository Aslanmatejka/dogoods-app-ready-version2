# Quick Start: Admin Edit Mode

## Step 1: Run the Database Migration

Open your Supabase dashboard → SQL Editor and run:

```sql
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
```

## Step 2: Make Your User an Admin

In Supabase dashboard → Table Editor → users table:

Find your user and set `is_admin = true`

## Step 3: Test the Feature

1. Login to your app as the admin user
2. Navigate to `/impact-story`
3. You should see a blue floating edit button in the bottom-right
4. Click it to enter edit mode
5. Click on any text to edit it
6. Click "Save Changes" when done

## Troubleshooting

**Edit button not showing?**
- Verify you're logged in
- Check that `is_admin = true` in users table
- Check browser console for errors

**Changes not saving?**
- Verify the migration ran successfully
- Check browser console for Supabase errors
- Content will save to localStorage as fallback

**See full documentation:** ADMIN_EDIT_MODE_SETUP.md
