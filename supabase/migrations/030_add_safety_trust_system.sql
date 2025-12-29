-- Migration: Add Safety and Trust System
-- Purpose: User verification, trust scores, safety ratings, reviews, and reporting

-- Create verification level enum
DO $$ BEGIN
    CREATE TYPE verification_level AS ENUM (
        'unverified',        -- No verification
        'email_verified',    -- Email confirmed
        'phone_verified',    -- Phone confirmed
        'id_verified',       -- Government ID verified
        'background_checked' -- Background check complete
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create safety report type enum
DO $$ BEGIN
    CREATE TYPE safety_report_type AS ENUM (
        'harassment',
        'inappropriate_behavior',
        'safety_concern',
        'fraud',
        'fake_listing',
        'no_show',
        'unsafe_location',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create report status enum
DO $$ BEGIN
    CREATE TYPE report_status AS ENUM (
        'pending',
        'investigating',
        'action_taken',
        'dismissed',
        'resolved'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add safety and trust fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
ADD COLUMN IF NOT EXISTS safety_rating DECIMAL(3,2) DEFAULT 0.00 CHECK (safety_rating >= 0 AND safety_rating <= 5),
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verification_level verification_level DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS background_check_status TEXT DEFAULT 'not_requested' CHECK (background_check_status IN ('not_requested', 'pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS background_check_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trusted_user BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS safety_warnings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS account_restricted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS restriction_reason TEXT,
ADD COLUMN IF NOT EXISTS restricted_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_safety_check TIMESTAMP WITH TIME ZONE;

-- Create user_reviews table for peer reviews
CREATE TABLE IF NOT EXISTS user_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    transaction_id UUID, -- Reference to food_listing or trade
    transaction_type TEXT CHECK (transaction_type IN ('donation', 'trade', 'pickup')),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    safety_tags TEXT[], -- e.g., ['punctual', 'friendly', 'safe_location']
    would_transact_again BOOLEAN DEFAULT TRUE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    is_verified_transaction BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate reviews for same transaction
    UNIQUE(reviewer_id, reviewed_user_id, transaction_id)
);

-- Create safety_reports table
CREATE TABLE IF NOT EXISTS safety_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id) ON DELETE SET NULL,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type safety_report_type NOT NULL,
    description TEXT NOT NULL,
    incident_date TIMESTAMP WITH TIME ZONE,
    incident_location TEXT,
    evidence_urls TEXT[], -- Photos, screenshots, etc.
    listing_id UUID REFERENCES food_listings(id) ON DELETE SET NULL,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status report_status DEFAULT 'pending',
    admin_notes TEXT,
    action_taken TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create safety_guidelines table
CREATE TABLE IF NOT EXISTS safety_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL, -- 'pickup', 'meeting', 'general', 'food_handling'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    icon TEXT,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trust_score_history table for tracking score changes
CREATE TABLE IF NOT EXISTS trust_score_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    old_score INTEGER,
    new_score INTEGER,
    change_reason TEXT NOT NULL,
    changed_by UUID REFERENCES users(id), -- NULL if automatic
    related_transaction_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create safe_meeting_locations table (recommended public places)
CREATE TABLE IF NOT EXISTS safe_meeting_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    location_type TEXT, -- 'community_center', 'police_station', 'library', 'school'
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    hours_of_operation TEXT,
    parking_available BOOLEAN DEFAULT TRUE,
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate trust score based on various factors
CREATE OR REPLACE FUNCTION calculate_trust_score(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    base_score INTEGER := 50;
    review_bonus INTEGER := 0;
    verification_bonus INTEGER := 0;
    completion_bonus INTEGER := 0;
    penalty INTEGER := 0;
    final_score INTEGER;
BEGIN
    -- Bonus from reviews (max 30 points)
    SELECT LEAST(30, COALESCE(AVG(rating) * 6, 0))
    INTO review_bonus
    FROM user_reviews
    WHERE reviewed_user_id = user_uuid;
    
    -- Verification level bonus (max 15 points)
    SELECT CASE 
        WHEN verification_level = 'background_checked' THEN 15
        WHEN verification_level = 'id_verified' THEN 10
        WHEN verification_level = 'phone_verified' THEN 5
        WHEN verification_level = 'email_verified' THEN 3
        ELSE 0
    END
    INTO verification_bonus
    FROM users
    WHERE id = user_uuid;
    
    -- Completion bonus (successful transactions, max 10 points)
    SELECT LEAST(10, COUNT(*) / 2)
    INTO completion_bonus
    FROM food_listings
    WHERE user_id = user_uuid 
    AND status = 'completed'
    AND verified_after_pickup = TRUE;
    
    -- Penalty from safety warnings (each warning = -10 points)
    SELECT COALESCE(safety_warnings * 10, 0)
    INTO penalty
    FROM users
    WHERE id = user_uuid;
    
    -- Calculate final score (0-100)
    final_score := base_score + review_bonus + verification_bonus + completion_bonus - penalty;
    final_score := GREATEST(0, LEAST(100, final_score));
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to update trust score
CREATE OR REPLACE FUNCTION update_trust_score()
RETURNS TRIGGER AS $$
DECLARE
    old_score INTEGER;
    new_score INTEGER;
    affected_user_id UUID;
BEGIN
    -- Determine which user's score to update
    IF TG_TABLE_NAME = 'user_reviews' THEN
        affected_user_id := NEW.reviewed_user_id;
    ELSIF TG_TABLE_NAME = 'safety_reports' THEN
        affected_user_id := NEW.reported_user_id;
    ELSE
        affected_user_id := NEW.id;
    END IF;
    
    -- Get current score
    SELECT trust_score INTO old_score FROM users WHERE id = affected_user_id;
    
    -- Calculate new score
    new_score := calculate_trust_score(affected_user_id);
    
    -- Update user's trust score
    UPDATE users 
    SET trust_score = new_score,
        is_trusted_user = (new_score >= 80)
    WHERE id = affected_user_id;
    
    -- Log the change
    INSERT INTO trust_score_history (user_id, old_score, new_score, change_reason)
    VALUES (affected_user_id, old_score, new_score, TG_TABLE_NAME || ' update');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trust score when reviews are added
DROP TRIGGER IF EXISTS trigger_update_trust_on_review ON user_reviews;
CREATE TRIGGER trigger_update_trust_on_review
    AFTER INSERT OR UPDATE ON user_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_score();

-- Trigger to update trust score when safety reports are filed
DROP TRIGGER IF EXISTS trigger_update_trust_on_report ON safety_reports;
CREATE TRIGGER trigger_update_trust_on_report
    AFTER INSERT ON safety_reports
    FOR EACH ROW
    WHEN (NEW.status = 'action_taken')
    EXECUTE FUNCTION update_trust_score();

-- Function to update safety rating based on reviews
CREATE OR REPLACE FUNCTION update_safety_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET 
        safety_rating = (
            SELECT COALESCE(AVG(rating), 0)
            FROM user_reviews
            WHERE reviewed_user_id = NEW.reviewed_user_id
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM user_reviews
            WHERE reviewed_user_id = NEW.reviewed_user_id
        )
    WHERE id = NEW.reviewed_user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update safety rating
DROP TRIGGER IF EXISTS trigger_update_safety_rating ON user_reviews;
CREATE TRIGGER trigger_update_safety_rating
    AFTER INSERT OR UPDATE ON user_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_safety_rating();

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_users_trust_score ON users(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_users_safety_rating ON users(safety_rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_verification_level ON users(verification_level);
CREATE INDEX IF NOT EXISTS idx_user_reviews_reviewed_user ON user_reviews(reviewed_user_id);
CREATE INDEX IF NOT EXISTS idx_safety_reports_status ON safety_reports(status, created_at);
CREATE INDEX IF NOT EXISTS idx_safety_reports_reported_user ON safety_reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_safe_meeting_locations_city ON safe_meeting_locations(city, state);

-- Enable RLS on new tables
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_guidelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE trust_score_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE safe_meeting_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_reviews
CREATE POLICY "Users can view reviews"
ON user_reviews FOR SELECT
USING (TRUE); -- Public reviews (unless anonymous)

CREATE POLICY "Users can create reviews for transactions they participated in"
ON user_reviews FOR INSERT
WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "Users can update their own reviews"
ON user_reviews FOR UPDATE
USING (reviewer_id = auth.uid());

-- RLS Policies for safety_reports
CREATE POLICY "Users can view their own reports"
ON safety_reports FOR SELECT
USING (reporter_id = auth.uid() OR reported_user_id = auth.uid());

CREATE POLICY "Users can create safety reports"
ON safety_reports FOR INSERT
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Admins can manage all safety reports"
ON safety_reports FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for safety_guidelines
CREATE POLICY "Anyone can view active guidelines"
ON safety_guidelines FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can manage guidelines"
ON safety_guidelines FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for trust_score_history
CREATE POLICY "Users can view their own trust history"
ON trust_score_history FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all trust history"
ON trust_score_history FOR SELECT
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for safe_meeting_locations
CREATE POLICY "Anyone can view safe meeting locations"
ON safe_meeting_locations FOR SELECT
USING (TRUE);

CREATE POLICY "Admins can manage safe meeting locations"
ON safe_meeting_locations FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Insert default safety guidelines
INSERT INTO safety_guidelines (category, title, description, icon, priority) VALUES
('meeting', 'Meet in Public Places', 'Always meet in well-lit, public locations with other people around. Avoid private residences for first-time exchanges.', 'fa-users', 1),
('meeting', 'Bring a Friend', 'Consider bringing a friend or family member, especially for evening pickups.', 'fa-user-friends', 2),
('meeting', 'Share Your Location', 'Let someone know where you''re going and when you expect to return. Share your live location if possible.', 'fa-map-marker-alt', 3),
('meeting', 'Trust Your Instincts', 'If something feels wrong, trust your gut. It''s okay to cancel or reschedule.', 'fa-shield-alt', 4),
('pickup', 'Verify Before Pickup', 'Use the photo verification feature to confirm the food is as described.', 'fa-camera', 1),
('pickup', 'Check Expiration Dates', 'Always check expiration dates and food condition upon pickup.', 'fa-calendar-check', 2),
('pickup', 'Use Contactless Options', 'When possible, arrange contactless pickup (e.g., porch pickup).', 'fa-box', 3),
('food_handling', 'Maintain Temperature', 'Keep cold foods cold and hot foods hot. Bring a cooler for perishables.', 'fa-thermometer-half', 1),
('food_handling', 'Inspect Food Quality', 'Check for signs of spoilage, damage, or contamination before accepting.', 'fa-search', 2),
('food_handling', 'Wash Hands', 'Wash hands before and after handling food items.', 'fa-hands-wash', 3),
('general', 'Communicate Clearly', 'Use the app''s messaging system to coordinate pickups. Keep communication polite and clear.', 'fa-comments', 1),
('general', 'Be Punctual', 'Respect everyone''s time. Arrive on time or notify if you''ll be late.', 'fa-clock', 2),
('general', 'Report Issues', 'Report any safety concerns, inappropriate behavior, or suspicious activity immediately.', 'fa-flag', 3);

-- Insert sample safe meeting locations (example data)
INSERT INTO safe_meeting_locations (name, address, location_type, city, state, zip_code, is_verified) VALUES
('Alameda Main Library', '1550 Oak St, Alameda, CA 94501', 'library', 'Alameda', 'CA', '94501', TRUE),
('Ruby Bridges Elementary School', '1325 Pearl St, Alameda, CA 94501', 'school', 'Alameda', 'CA', '94501', TRUE),
('Alameda Police Department', '1555 Oak St, Alameda, CA 94501', 'police_station', 'Alameda', 'CA', '94501', TRUE);

-- Add comments for documentation
COMMENT ON COLUMN users.trust_score IS 'Trust score 0-100, calculated from reviews, verifications, and behavior';
COMMENT ON COLUMN users.safety_rating IS 'Average safety rating from peer reviews (0-5 stars)';
COMMENT ON COLUMN users.verification_level IS 'Level of user verification (unverified to background_checked)';
COMMENT ON COLUMN users.is_trusted_user IS 'Badge for users with trust_score >= 80';
COMMENT ON TABLE user_reviews IS 'Peer reviews after food transactions';
COMMENT ON TABLE safety_reports IS 'User-submitted safety concerns and incident reports';
COMMENT ON TABLE safety_guidelines IS 'Safety tips and best practices for users';
COMMENT ON TABLE safe_meeting_locations IS 'Verified public places for safe food exchanges';
