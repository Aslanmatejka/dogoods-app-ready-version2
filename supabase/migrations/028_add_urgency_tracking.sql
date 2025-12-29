-- Migration: Add urgency tracking fields for food listings
-- Purpose: Track pickup deadlines and calculate urgency for soon-expiring items

-- Add pickup_by timestamp for more precise urgency tracking
ALTER TABLE food_listings 
ADD COLUMN IF NOT EXISTS pickup_by TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS urgency_level TEXT CHECK (urgency_level IN ('critical', 'high', 'medium', 'normal', 'none'));

-- Create function to calculate urgency level based on time remaining
CREATE OR REPLACE FUNCTION calculate_urgency_level(
    pickup_deadline TIMESTAMP WITH TIME ZONE,
    expiry DATE
) RETURNS TEXT AS $$
DECLARE
    hours_remaining NUMERIC;
    deadline TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Use pickup_by if available, otherwise use expiry_date at end of day
    IF pickup_deadline IS NOT NULL THEN
        deadline := pickup_deadline;
    ELSIF expiry IS NOT NULL THEN
        deadline := expiry::TIMESTAMP + INTERVAL '23 hours 59 minutes';
    ELSE
        RETURN 'none';
    END IF;

    -- Calculate hours remaining
    hours_remaining := EXTRACT(EPOCH FROM (deadline - NOW())) / 3600;

    -- Return urgency level based on time remaining
    IF hours_remaining <= 0 THEN
        RETURN 'none'; -- Expired
    ELSIF hours_remaining <= 6 THEN
        RETURN 'critical'; -- Less than 6 hours
    ELSIF hours_remaining <= 24 THEN
        RETURN 'high'; -- Less than 1 day
    ELSIF hours_remaining <= 72 THEN
        RETURN 'medium'; -- Less than 3 days
    ELSE
        RETURN 'normal'; -- More than 3 days
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to auto-update urgency level
CREATE OR REPLACE FUNCTION update_urgency_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.urgency_level := calculate_urgency_level(NEW.pickup_by, NEW.expiry_date);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-calculate urgency on insert/update
DROP TRIGGER IF EXISTS trigger_update_urgency ON food_listings;
CREATE TRIGGER trigger_update_urgency
    BEFORE INSERT OR UPDATE OF pickup_by, expiry_date
    ON food_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_urgency_level();

-- Update existing rows to calculate initial urgency
UPDATE food_listings
SET urgency_level = calculate_urgency_level(pickup_by, expiry_date)
WHERE status = 'active';

-- Create index for efficient urgency-based queries
CREATE INDEX IF NOT EXISTS idx_food_listings_urgency 
ON food_listings(urgency_level, created_at) 
WHERE status = 'active';

-- Create index for time-based sorting
CREATE INDEX IF NOT EXISTS idx_food_listings_pickup_by 
ON food_listings(pickup_by) 
WHERE status = 'active' AND pickup_by IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN food_listings.pickup_by IS 'Deadline for picking up food item (more precise than expiry_date)';
COMMENT ON COLUMN food_listings.urgency_level IS 'Auto-calculated urgency: critical (<6h), high (<24h), medium (<72h), normal (>72h), none (expired/no deadline)';
