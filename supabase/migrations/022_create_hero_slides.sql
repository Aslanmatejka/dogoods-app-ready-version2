-- Create hero_slides table for homepage slideshow
CREATE TABLE IF NOT EXISTS hero_slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    caption TEXT,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on order_index for faster ordering
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides(order_index);

-- Add index on is_active for filtering
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active);

-- Enable Row Level Security
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to active slides
CREATE POLICY "Allow public read access to hero_slides"
    ON hero_slides
    FOR SELECT
    USING (is_active = true);

-- Policy: Allow admins to manage all slides
CREATE POLICY "Allow admins to manage hero_slides"
    ON hero_slides
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.is_admin = true
        )
    );

-- Insert default slides
INSERT INTO hero_slides (image_url, caption, order_index) VALUES
    ('https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=1920&q=80', 'Share Food, Reduce Waste, Build Community', 0),
    ('https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80', 'Fighting Food Waste Together', 1),
    ('https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1920&q=80', 'Connecting Communities Through Food', 2)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE hero_slides IS 'Stores slideshow images for homepage hero section';
