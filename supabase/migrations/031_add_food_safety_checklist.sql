-- Migration: Add Food Safety Checklist System
-- Purpose: Track storage requirements, temperature, packaging, and food safety compliance

-- Create storage type enum
DO $$ BEGIN
    CREATE TYPE storage_type AS ENUM (
        'refrigerated',      -- 32-40°F (0-4°C)
        'frozen',            -- 0°F (-18°C) or below
        'room_temperature',  -- 50-70°F (10-21°C)
        'cool_dry',          -- Below 70°F, low humidity
        'heated'             -- 140°F (60°C) or above for hot foods
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create packaging type enum
DO $$ BEGIN
    CREATE TYPE packaging_type AS ENUM (
        'sealed_original',   -- Original sealed packaging
        'sealed_container',  -- Sealed in food-grade container
        'wrapped',           -- Properly wrapped (plastic/foil)
        'open_container',    -- Open but covered container
        'unwrapped',         -- No packaging
        'vacuum_sealed'      -- Vacuum sealed packaging
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create food condition enum
DO $$ BEGIN
    CREATE TYPE food_condition AS ENUM (
        'excellent',    -- Fresh, perfect condition
        'good',         -- Good quality, minimal signs of age
        'fair',         -- Acceptable, nearing expiration
        'poor',         -- Past prime, use immediately
        'unsafe'        -- Not safe for consumption
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add food safety fields to food_listings table
ALTER TABLE food_listings
ADD COLUMN IF NOT EXISTS storage_requirements storage_type DEFAULT 'room_temperature',
ADD COLUMN IF NOT EXISTS packaging_type packaging_type DEFAULT 'sealed_original',
ADD COLUMN IF NOT EXISTS current_condition food_condition DEFAULT 'good',
ADD COLUMN IF NOT EXISTS requires_refrigeration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_freezing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allergen_info TEXT[], -- e.g., ['dairy', 'nuts', 'gluten']
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS days_until_expiry INTEGER GENERATED ALWAYS AS (expiry_date - CURRENT_DATE) STORED,
ADD COLUMN IF NOT EXISTS preparation_date DATE,
ADD COLUMN IF NOT EXISTS storage_temperature_min DECIMAL(5,2), -- Minimum safe temp in °F
ADD COLUMN IF NOT EXISTS storage_temperature_max DECIMAL(5,2), -- Maximum safe temp in °F
ADD COLUMN IF NOT EXISTS current_storage_temp DECIMAL(5,2), -- Current temperature
ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS safe_handling_instructions TEXT,
ADD COLUMN IF NOT EXISTS reheating_instructions TEXT,
ADD COLUMN IF NOT EXISTS safety_notes TEXT,
ADD COLUMN IF NOT EXISTS passed_safety_check BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS safety_check_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS safety_checked_by UUID REFERENCES users(id);

-- Create food_safety_checks table
CREATE TABLE IF NOT EXISTS food_safety_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES food_listings(id) ON DELETE CASCADE,
    checker_id UUID REFERENCES users(id) ON DELETE SET NULL,
    check_type TEXT NOT NULL CHECK (check_type IN ('donor', 'recipient', 'admin', 'automated')),
    
    -- Temperature checks
    temperature_recorded DECIMAL(5,2),
    temperature_in_range BOOLEAN,
    temperature_check_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Packaging checks
    packaging_intact BOOLEAN,
    packaging_sealed BOOLEAN,
    packaging_clean BOOLEAN,
    packaging_labeled BOOLEAN,
    
    -- Food condition checks
    appearance_good BOOLEAN,
    smell_normal BOOLEAN,
    no_mold BOOLEAN,
    no_discoloration BOOLEAN,
    texture_normal BOOLEAN,
    
    -- Expiration checks
    expiry_date_visible BOOLEAN,
    within_expiry_date BOOLEAN,
    best_before_date DATE,
    
    -- Allergen verification
    allergens_labeled BOOLEAN,
    allergen_list TEXT[],
    
    -- Storage verification
    stored_properly BOOLEAN,
    storage_duration_appropriate BOOLEAN,
    
    -- Overall assessment
    overall_safe BOOLEAN,
    safety_score INTEGER CHECK (safety_score >= 0 AND safety_score <= 100),
    issues_found TEXT[],
    recommendations TEXT[],
    notes TEXT,
    
    -- Photos
    check_photos TEXT[], -- URLs to verification photos
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create storage_requirements_catalog (templates for different food types)
CREATE TABLE IF NOT EXISTS storage_requirements_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_category TEXT NOT NULL, -- 'dairy', 'meat', 'produce', 'bakery', 'canned', etc.
    food_item TEXT, -- Specific item if applicable
    storage_type storage_type NOT NULL,
    temp_min DECIMAL(5,2),
    temp_max DECIMAL(5,2),
    max_storage_days INTEGER,
    packaging_requirements TEXT[],
    safety_guidelines TEXT[],
    allergen_warnings TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create temperature_logs table for tracking storage temps over time
CREATE TABLE IF NOT EXISTS temperature_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES food_listings(id) ON DELETE CASCADE,
    temperature DECIMAL(5,2) NOT NULL,
    location TEXT, -- 'refrigerator', 'freezer', 'cooler', 'ambient'
    recorded_by UUID REFERENCES users(id),
    is_automated BOOLEAN DEFAULT FALSE,
    within_safe_range BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create food_safety_violations table
CREATE TABLE IF NOT EXISTS food_safety_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID REFERENCES food_listings(id) ON DELETE CASCADE,
    violation_type TEXT NOT NULL, -- 'temperature_abuse', 'expired', 'contaminated', 'improper_storage'
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    detected_by UUID REFERENCES users(id),
    detection_method TEXT, -- 'manual', 'automated', 'reported'
    action_taken TEXT,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to calculate food safety score
CREATE OR REPLACE FUNCTION calculate_food_safety_score(listing_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    base_score INTEGER := 100;
    temp_penalty INTEGER := 0;
    expiry_penalty INTEGER := 0;
    packaging_penalty INTEGER := 0;
    condition_penalty INTEGER := 0;
    final_score INTEGER;
    days_until_exp INTEGER;
    listing_record RECORD;
BEGIN
    -- Get listing details
    SELECT * INTO listing_record
    FROM food_listings
    WHERE id = listing_uuid;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Temperature penalty (30 points max)
    IF listing_record.current_storage_temp IS NOT NULL THEN
        IF listing_record.storage_temperature_min IS NOT NULL 
           AND listing_record.current_storage_temp < listing_record.storage_temperature_min THEN
            temp_penalty := 30;
        ELSIF listing_record.storage_temperature_max IS NOT NULL 
              AND listing_record.current_storage_temp > listing_record.storage_temperature_max THEN
            temp_penalty := 30;
        END IF;
    END IF;
    
    -- Expiration penalty (40 points max)
    IF listing_record.expiry_date IS NOT NULL THEN
        days_until_exp := listing_record.expiry_date - CURRENT_DATE;
        IF days_until_exp < 0 THEN
            expiry_penalty := 40; -- Expired
        ELSIF days_until_exp = 0 THEN
            expiry_penalty := 20; -- Expires today
        ELSIF days_until_exp = 1 THEN
            expiry_penalty := 10; -- Expires tomorrow
        ELSIF days_until_exp <= 3 THEN
            expiry_penalty := 5; -- Expires within 3 days
        END IF;
    END IF;
    
    -- Packaging penalty (15 points max)
    CASE listing_record.packaging_type
        WHEN 'unwrapped' THEN packaging_penalty := 15;
        WHEN 'open_container' THEN packaging_penalty := 10;
        WHEN 'wrapped' THEN packaging_penalty := 5;
        ELSE packaging_penalty := 0;
    END CASE;
    
    -- Condition penalty (15 points max)
    CASE listing_record.current_condition
        WHEN 'unsafe' THEN condition_penalty := 100; -- Automatic fail
        WHEN 'poor' THEN condition_penalty := 15;
        WHEN 'fair' THEN condition_penalty := 8;
        WHEN 'good' THEN condition_penalty := 3;
        ELSE condition_penalty := 0;
    END CASE;
    
    -- Calculate final score
    final_score := base_score - temp_penalty - expiry_penalty - packaging_penalty - condition_penalty;
    final_score := GREATEST(0, LEAST(100, final_score));
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-check food safety on listing creation/update
CREATE OR REPLACE FUNCTION auto_check_food_safety()
RETURNS TRIGGER AS $$
DECLARE
    safety_score INTEGER;
    issues TEXT[] := '{}';
BEGIN
    -- Calculate safety score
    safety_score := calculate_food_safety_score(NEW.id);
    
    -- Identify issues
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date < CURRENT_DATE THEN
        issues := array_append(issues, 'Food has expired');
    END IF;
    
    IF NEW.current_storage_temp IS NOT NULL THEN
        IF NEW.storage_temperature_min IS NOT NULL 
           AND NEW.current_storage_temp < NEW.storage_temperature_min THEN
            issues := array_append(issues, 'Temperature too low');
        END IF;
        IF NEW.storage_temperature_max IS NOT NULL 
           AND NEW.current_storage_temp > NEW.storage_temperature_max THEN
            issues := array_append(issues, 'Temperature too high - food may be unsafe');
        END IF;
    END IF;
    
    IF NEW.packaging_type IN ('unwrapped', 'open_container') AND NEW.is_perishable THEN
        issues := array_append(issues, 'Perishable food should be properly sealed');
    END IF;
    
    IF NEW.current_condition = 'unsafe' THEN
        issues := array_append(issues, 'Food marked as unsafe condition');
    END IF;
    
    -- Update safety check status
    NEW.passed_safety_check := (safety_score >= 70 AND array_length(issues, 1) IS NULL);
    NEW.safety_check_date := NOW();
    
    -- Create violation records for serious issues
    IF safety_score < 50 OR NEW.current_condition = 'unsafe' THEN
        INSERT INTO food_safety_violations (
            listing_id, 
            violation_type, 
            severity, 
            description,
            detection_method
        ) VALUES (
            NEW.id,
            'automated_safety_check_failed',
            CASE WHEN safety_score < 30 THEN 'critical' ELSE 'high' END,
            array_to_string(issues, '; '),
            'automated'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for automatic safety checks
DROP TRIGGER IF EXISTS trigger_auto_food_safety ON food_listings;
CREATE TRIGGER trigger_auto_food_safety
    BEFORE INSERT OR UPDATE ON food_listings
    FOR EACH ROW
    EXECUTE FUNCTION auto_check_food_safety();

-- Function to log temperature readings
CREATE OR REPLACE FUNCTION log_temperature(
    p_listing_id UUID,
    p_temperature DECIMAL,
    p_location TEXT,
    p_recorded_by UUID
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    temp_min DECIMAL;
    temp_max DECIMAL;
    is_safe BOOLEAN;
BEGIN
    -- Get safe temperature range
    SELECT storage_temperature_min, storage_temperature_max
    INTO temp_min, temp_max
    FROM food_listings
    WHERE id = p_listing_id;
    
    -- Determine if temperature is safe
    is_safe := (
        (temp_min IS NULL OR p_temperature >= temp_min) AND
        (temp_max IS NULL OR p_temperature <= temp_max)
    );
    
    -- Insert log
    INSERT INTO temperature_logs (
        listing_id,
        temperature,
        location,
        recorded_by,
        within_safe_range
    ) VALUES (
        p_listing_id,
        p_temperature,
        p_location,
        p_recorded_by,
        is_safe
    ) RETURNING id INTO log_id;
    
    -- Update current temperature on listing
    UPDATE food_listings
    SET current_storage_temp = p_temperature
    WHERE id = p_listing_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_food_listings_storage_type ON food_listings(storage_requirements);
CREATE INDEX IF NOT EXISTS idx_food_listings_expiry_date ON food_listings(expiry_date);
CREATE INDEX IF NOT EXISTS idx_food_listings_safety_check ON food_listings(passed_safety_check);
CREATE INDEX IF NOT EXISTS idx_food_safety_checks_listing ON food_safety_checks(listing_id);
CREATE INDEX IF NOT EXISTS idx_temperature_logs_listing ON temperature_logs(listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_food_safety_violations_listing ON food_safety_violations(listing_id);
CREATE INDEX IF NOT EXISTS idx_food_safety_violations_severity ON food_safety_violations(severity, resolved);

-- Enable RLS
ALTER TABLE food_safety_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_requirements_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE temperature_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_safety_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for food_safety_checks
CREATE POLICY "Anyone can view safety checks for active listings"
ON food_safety_checks FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM food_listings 
        WHERE id = listing_id AND status NOT IN ('deleted', 'removed')
    )
);

CREATE POLICY "Users can create safety checks for their own listings"
ON food_safety_checks FOR INSERT
WITH CHECK (
    checker_id = auth.uid() OR
    EXISTS (SELECT 1 FROM food_listings WHERE id = listing_id AND user_id = auth.uid())
);

CREATE POLICY "Admins can manage all safety checks"
ON food_safety_checks FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for storage_requirements_catalog
CREATE POLICY "Anyone can view storage requirements"
ON storage_requirements_catalog FOR SELECT
USING (is_active = TRUE);

CREATE POLICY "Admins can manage storage requirements"
ON storage_requirements_catalog FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for temperature_logs
CREATE POLICY "Users can view temperature logs for their listings"
ON temperature_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM food_listings 
        WHERE id = listing_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Users can log temperatures for their listings"
ON temperature_logs FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM food_listings 
        WHERE id = listing_id AND user_id = auth.uid()
    )
);

-- RLS Policies for food_safety_violations
CREATE POLICY "Users can view violations for their listings"
ON food_safety_violations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM food_listings 
        WHERE id = listing_id AND user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins can manage violations"
ON food_safety_violations FOR ALL
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Insert default storage requirements catalog
INSERT INTO storage_requirements_catalog (food_category, storage_type, temp_min, temp_max, max_storage_days, packaging_requirements, safety_guidelines, allergen_warnings) VALUES
-- Dairy
('dairy', 'refrigerated', 32, 40, 7, 
 ARRAY['sealed_original', 'sealed_container'], 
 ARRAY['Keep refrigerated at all times', 'Check for expiration date', 'Discard if smells sour'],
 ARRAY['dairy', 'milk']),

-- Meat & Poultry
('meat', 'refrigerated', 32, 40, 2, 
 ARRAY['sealed_original', 'vacuum_sealed', 'wrapped'], 
 ARRAY['Use within 1-2 days or freeze', 'Keep at bottom of refrigerator', 'Cook to proper internal temperature'],
 NULL),

('meat_frozen', 'frozen', -10, 0, 180, 
 ARRAY['vacuum_sealed', 'wrapped'], 
 ARRAY['Store at 0°F or below', 'Label with date', 'Thaw in refrigerator'],
 NULL),

-- Produce
('produce_refrigerated', 'refrigerated', 32, 45, 7, 
 ARRAY['open_container', 'wrapped'], 
 ARRAY['Wash before eating', 'Remove spoiled items promptly', 'Store away from raw meat'],
 NULL),

('produce_room_temp', 'room_temperature', 50, 70, 5, 
 ARRAY['open_container', 'unwrapped'], 
 ARRAY['Keep in cool, dry place', 'Check for mold or soft spots', 'Use ripe items quickly'],
 NULL),

-- Bakery
('bakery', 'room_temperature', 50, 75, 5, 
 ARRAY['sealed_container', 'wrapped'], 
 ARRAY['Store in airtight container', 'Keep away from moisture', 'Check for mold'],
 ARRAY['gluten', 'wheat', 'eggs']),

-- Canned Goods
('canned', 'room_temperature', 50, 85, 730, 
 ARRAY['sealed_original'], 
 ARRAY['Check for dents or rust', 'Discard if can is swollen', 'Use before best-by date'],
 NULL),

-- Prepared Foods (hot)
('prepared_hot', 'heated', 140, 165, 0, 
 ARRAY['sealed_container'], 
 ARRAY['Keep at 140°F or above', 'Use within 2 hours', 'Reheat to 165°F'],
 NULL),

-- Prepared Foods (cold)
('prepared_cold', 'refrigerated', 32, 40, 3, 
 ARRAY['sealed_container'], 
 ARRAY['Keep refrigerated', 'Use within 3-4 days', 'Discard if left out >2 hours'],
 NULL),

-- Frozen Foods
('frozen', 'frozen', -10, 0, 90, 
 ARRAY['sealed_original', 'vacuum_sealed'], 
 ARRAY['Store at 0°F or below', 'Don''t refreeze thawed items', 'Check for freezer burn'],
 NULL),

-- Eggs
('eggs', 'refrigerated', 32, 45, 21, 
 ARRAY['sealed_original'], 
 ARRAY['Store in original carton', 'Keep in main body of refrigerator', 'Check expiration date'],
 ARRAY['eggs']);

-- Add helpful comments
COMMENT ON TABLE food_safety_checks IS 'Detailed safety inspections for food listings';
COMMENT ON TABLE storage_requirements_catalog IS 'Template storage requirements for different food categories';
COMMENT ON TABLE temperature_logs IS 'Temperature monitoring logs for food storage';
COMMENT ON TABLE food_safety_violations IS 'Food safety violations and compliance issues';
COMMENT ON COLUMN food_listings.storage_requirements IS 'Required storage type for food safety';
COMMENT ON COLUMN food_listings.passed_safety_check IS 'Whether food passed automatic safety validation';
COMMENT ON COLUMN food_listings.days_until_expiry IS 'Auto-calculated days until expiration';
