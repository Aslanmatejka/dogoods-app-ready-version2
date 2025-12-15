-- Add new columns to impact_data table to match homepage metrics exactly

-- Add separate columns for food saved from waste and food provided
ALTER TABLE impact_data 
ADD COLUMN IF NOT EXISTS food_saved_from_waste_lb NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS food_provided_lb NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS schools_served INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS nonprofits_helped INTEGER DEFAULT 0;

-- Add comments
COMMENT ON COLUMN impact_data.food_saved_from_waste_lb IS 'Pounds of food saved from being wasted';
COMMENT ON COLUMN impact_data.food_provided_lb IS 'Pounds of food provided to recipients';
COMMENT ON COLUMN impact_data.schools_served IS 'Number of schools served';
COMMENT ON COLUMN impact_data.nonprofits_helped IS 'Number of non-profit organizations helped';

-- Optional: Migrate existing food_saved_kg data to the new columns if needed
-- UPDATE impact_data SET 
--   food_saved_from_waste_lb = food_saved_kg,
--   food_provided_lb = food_saved_kg
-- WHERE food_saved_from_waste_lb = 0 AND food_provided_lb = 0;
