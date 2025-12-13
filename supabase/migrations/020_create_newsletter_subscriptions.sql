-- Create newsletter_subscriptions table
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    consent BOOLEAN DEFAULT true,
    source VARCHAR(100) DEFAULT 'website',
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_email ON newsletter_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscriptions_active ON newsletter_subscriptions(is_active);

-- Add RLS policies
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to subscribe (insert)
CREATE POLICY "Anyone can subscribe to newsletter"
    ON newsletter_subscriptions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow users to view their own subscription
CREATE POLICY "Users can view their own subscription"
    ON newsletter_subscriptions
    FOR SELECT
    TO public
    USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Allow admins to view all subscriptions
CREATE POLICY "Admins can view all newsletter subscriptions"
    ON newsletter_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
            AND users.role = 'admin'
        )
    );

-- Allow users to update their own subscription (unsubscribe)
CREATE POLICY "Users can unsubscribe"
    ON newsletter_subscriptions
    FOR UPDATE
    TO public
    USING (email = current_setting('request.jwt.claims', true)::json->>'email')
    WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_newsletter_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_newsletter_subscriptions_updated_at
    BEFORE UPDATE ON newsletter_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_newsletter_subscriptions_updated_at();

-- Create impact_form_submissions table
CREATE TABLE IF NOT EXISTS impact_form_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    interests TEXT[], -- Array of interests
    source VARCHAR(100) DEFAULT 'impact-story',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_impact_form_email ON impact_form_submissions(email);

-- Add RLS policies for impact form
ALTER TABLE impact_form_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit
CREATE POLICY "Anyone can submit impact form"
    ON impact_form_submissions
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow admins to view all submissions
CREATE POLICY "Admins can view all impact form submissions"
    ON impact_form_submissions
    FOR SELECT
    TO authenticated
    USING (
        (current_setting('request.jwt.claims', true)::json->>'role' = 'admin')
        OR
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid
            AND users.role = 'admin'
        )
    );
