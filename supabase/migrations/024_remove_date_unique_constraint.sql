-- Remove unique constraint on date column to allow multiple entries per day
-- This allows admins to add multiple impact records without date conflicts

ALTER TABLE impact_data DROP CONSTRAINT IF EXISTS impact_data_date_key;

-- Drop the unique index if it exists
DROP INDEX IF EXISTS impact_data_date_key;

COMMENT ON TABLE impact_data IS 'Stores impact metrics - multiple entries allowed per date for flexibility';
