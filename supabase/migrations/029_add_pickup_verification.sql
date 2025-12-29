-- Migration: Add pickup verification system
-- Purpose: Track before/after pickup verification with photos and notes

-- Create verification status enum
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM (
        'pending',           -- Awaiting verification
        'verified_before',   -- Verified before pickup (by donor)
        'verified_after',    -- Verified after pickup (by recipient)
        'completed',         -- Both verifications complete
        'disputed',          -- Issue reported
        'skipped'           -- Verification skipped
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add verification fields to food_listings
ALTER TABLE food_listings 
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verified_before_pickup BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_after_pickup BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_before_photos TEXT[], -- Array of photo URLs
ADD COLUMN IF NOT EXISTS verification_after_photos TEXT[], -- Array of photo URLs
ADD COLUMN IF NOT EXISTS verification_before_notes TEXT,
ADD COLUMN IF NOT EXISTS verification_after_notes TEXT,
ADD COLUMN IF NOT EXISTS verified_before_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_after_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS verified_before_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_after_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_required BOOLEAN DEFAULT TRUE;

-- Create verification_logs table for audit trail
CREATE TABLE IF NOT EXISTS verification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES food_listings(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL CHECK (verification_type IN ('before', 'after')),
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    photos TEXT[],
    notes TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    device_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one verification per type per listing
    UNIQUE(listing_id, verification_type)
);

-- Create verification_disputes table
CREATE TABLE IF NOT EXISTS verification_disputes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES food_listings(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
    dispute_type TEXT NOT NULL CHECK (dispute_type IN ('quality_mismatch', 'quantity_mismatch', 'not_as_described', 'safety_concern', 'other')),
    description TEXT NOT NULL,
    evidence_photos TEXT[],
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to update verification status automatically
CREATE OR REPLACE FUNCTION update_verification_status()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.verified_before_pickup AND NEW.verified_after_pickup THEN
        NEW.verification_status := 'completed';
    ELSIF NEW.verified_before_pickup THEN
        NEW.verification_status := 'verified_before';
    ELSIF NEW.verified_after_pickup THEN
        NEW.verification_status := 'verified_after';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update verification status
DROP TRIGGER IF EXISTS trigger_update_verification_status ON food_listings;
CREATE TRIGGER trigger_update_verification_status
    BEFORE INSERT OR UPDATE OF verified_before_pickup, verified_after_pickup
    ON food_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_status();

-- Function to log verification
CREATE OR REPLACE FUNCTION log_verification()
RETURNS TRIGGER AS $$
BEGIN
    -- Log before pickup verification
    IF NEW.verified_before_pickup = TRUE AND (OLD IS NULL OR OLD.verified_before_pickup = FALSE) THEN
        INSERT INTO verification_logs (
            listing_id, 
            verification_type, 
            verified_by, 
            photos, 
            notes
        ) VALUES (
            NEW.id,
            'before',
            NEW.verified_before_by,
            NEW.verification_before_photos,
            NEW.verification_before_notes
        )
        ON CONFLICT (listing_id, verification_type) 
        DO UPDATE SET
            verified_by = EXCLUDED.verified_by,
            photos = EXCLUDED.photos,
            notes = EXCLUDED.notes,
            created_at = NOW();
    END IF;
    
    -- Log after pickup verification
    IF NEW.verified_after_pickup = TRUE AND (OLD IS NULL OR OLD.verified_after_pickup = FALSE) THEN
        INSERT INTO verification_logs (
            listing_id, 
            verification_type, 
            verified_by, 
            photos, 
            notes
        ) VALUES (
            NEW.id,
            'after',
            NEW.verified_after_by,
            NEW.verification_after_photos,
            NEW.verification_after_notes
        )
        ON CONFLICT (listing_id, verification_type) 
        DO UPDATE SET
            verified_by = EXCLUDED.verified_by,
            photos = EXCLUDED.photos,
            notes = EXCLUDED.notes,
            created_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create verification logs
DROP TRIGGER IF EXISTS trigger_log_verification ON food_listings;
CREATE TRIGGER trigger_log_verification
    AFTER INSERT OR UPDATE OF verified_before_pickup, verified_after_pickup
    ON food_listings
    FOR EACH ROW
    EXECUTE FUNCTION log_verification();

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_food_listings_verification_status 
ON food_listings(verification_status) 
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_verification_logs_listing 
ON verification_logs(listing_id, verification_type);

CREATE INDEX IF NOT EXISTS idx_verification_disputes_status 
ON verification_disputes(status, created_at);

-- Enable RLS on new tables
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for verification_logs
CREATE POLICY "Users can view their own verification logs"
ON verification_logs FOR SELECT
USING (
    verified_by = auth.uid() 
    OR listing_id IN (
        SELECT id FROM food_listings WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own verification logs"
ON verification_logs FOR INSERT
WITH CHECK (verified_by = auth.uid());

-- RLS Policies for verification_disputes
CREATE POLICY "Users can view their related disputes"
ON verification_disputes FOR SELECT
USING (
    reported_by = auth.uid() 
    OR listing_id IN (
        SELECT id FROM food_listings WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create disputes for their transactions"
ON verification_disputes FOR INSERT
WITH CHECK (reported_by = auth.uid());

CREATE POLICY "Admins can manage all disputes"
ON verification_disputes FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE
    )
);

-- Add comments for documentation
COMMENT ON COLUMN food_listings.verification_status IS 'Current verification status: pending, verified_before, verified_after, completed, disputed, skipped';
COMMENT ON COLUMN food_listings.verification_required IS 'Whether verification is required for this listing (can be disabled by donor)';
COMMENT ON TABLE verification_logs IS 'Audit trail of all verification activities with photos and metadata';
COMMENT ON TABLE verification_disputes IS 'Disputes raised about food quality or accuracy';
