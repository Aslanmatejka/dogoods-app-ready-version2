/*
  # Add Remaining Food Safety Columns
  
  1. New Columns to food_listings
    - requires_refrigeration (boolean)
    - requires_freezing (boolean)
    - preparation_date (date)
    - storage_temperature_min (decimal)
    - storage_temperature_max (decimal)
    - current_storage_temp (decimal)
    - safe_handling_instructions (text)
    - reheating_instructions (text)
    - safety_notes (text)
    - passed_safety_check (boolean)
    - safety_check_date (timestamptz)
    - safety_checked_by (uuid)
*/

ALTER TABLE food_listings
ADD COLUMN IF NOT EXISTS requires_refrigeration BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_freezing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS preparation_date DATE,
ADD COLUMN IF NOT EXISTS storage_temperature_min DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS storage_temperature_max DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS current_storage_temp DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS safe_handling_instructions TEXT,
ADD COLUMN IF NOT EXISTS reheating_instructions TEXT,
ADD COLUMN IF NOT EXISTS safety_notes TEXT,
ADD COLUMN IF NOT EXISTS passed_safety_check BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS safety_check_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS safety_checked_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_food_listings_storage_type ON food_listings(storage_requirements);
CREATE INDEX IF NOT EXISTS idx_food_listings_safety_check ON food_listings(passed_safety_check);