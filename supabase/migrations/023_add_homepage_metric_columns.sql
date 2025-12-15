-- Add new columns to impact_data table to match homepage metrics exactly
-- These columns allow admins to enter direct values that appear on the homepage

-- Add food_saved_from_waste_lb column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impact_data' AND column_name = 'food_saved_from_waste_lb'
  ) THEN
    ALTER TABLE impact_data ADD COLUMN food_saved_from_waste_lb numeric DEFAULT 0;
  END IF;
END $$;

-- Add food_provided_lb column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impact_data' AND column_name = 'food_provided_lb'
  ) THEN
    ALTER TABLE impact_data ADD COLUMN food_provided_lb numeric DEFAULT 0;
  END IF;
END $$;

-- Add schools_served column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impact_data' AND column_name = 'schools_served'
  ) THEN
    ALTER TABLE impact_data ADD COLUMN schools_served integer DEFAULT 0;
  END IF;
END $$;

-- Add nonprofits_helped column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impact_data' AND column_name = 'nonprofits_helped'
  ) THEN
    ALTER TABLE impact_data ADD COLUMN nonprofits_helped integer DEFAULT 0;
  END IF;
END $$;

-- Add total_meals_provided column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'impact_data' AND column_name = 'total_meals_provided'
  ) THEN
    ALTER TABLE impact_data ADD COLUMN total_meals_provided integer DEFAULT 0;
  END IF;
END $$;

-- Add comments to columns for clarity
COMMENT ON COLUMN impact_data.food_saved_from_waste_lb IS 'Pounds of food saved from being wasted - displayed on homepage';
COMMENT ON COLUMN impact_data.food_provided_lb IS 'Pounds of food provided to community - displayed on homepage';
COMMENT ON COLUMN impact_data.schools_served IS 'Number of schools we serve - displayed on homepage';
COMMENT ON COLUMN impact_data.nonprofits_helped IS 'Number of non-profit organizations we help - displayed on homepage';
COMMENT ON COLUMN impact_data.total_meals_provided IS 'Total number of meals provided - displayed on homepage';
