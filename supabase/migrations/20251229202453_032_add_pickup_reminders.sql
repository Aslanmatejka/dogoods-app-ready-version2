/*
  # Add Pickup Reminders System
  
  This migration adds functionality for automatic pickup reminders.
  
  ## Changes Made
  
  1. **Modified Tables**
     - `food_claims`: Added pickup_date, reminder_sent, and reminder_hours_before fields
     - `users`: Added pickup_reminder_enabled and reminder_hours_before preferences
  
  2. **New Fields**
     - `pickup_date` (date) - The scheduled date for food pickup
     - `reminder_sent` (boolean) - Tracks whether reminder has been sent
     - `reminder_hours_before` (integer) - Hours before pickup to send reminder
     - `pickup_reminder_enabled` (boolean) - User preference for receiving reminders
  
  3. **Important Notes**
     - Reminders will be sent based on user preferences (default: 24 hours before)
     - Edge function will check periodically and send notifications
     - Users can disable reminders in their settings
*/

-- Add pickup date and reminder tracking to food_claims
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_claims' AND column_name = 'pickup_date'
  ) THEN
    ALTER TABLE food_claims ADD COLUMN pickup_date DATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_claims' AND column_name = 'reminder_sent'
  ) THEN
    ALTER TABLE food_claims ADD COLUMN reminder_sent BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'food_claims' AND column_name = 'reminder_hours_before'
  ) THEN
    ALTER TABLE food_claims ADD COLUMN reminder_hours_before INTEGER DEFAULT 24 CHECK (reminder_hours_before >= 0);
  END IF;
END $$;

-- Add pickup reminder preferences to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'pickup_reminder_enabled'
  ) THEN
    ALTER TABLE users ADD COLUMN pickup_reminder_enabled BOOLEAN DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'default_reminder_hours'
  ) THEN
    ALTER TABLE users ADD COLUMN default_reminder_hours INTEGER DEFAULT 24 CHECK (default_reminder_hours > 0);
  END IF;
END $$;

-- Create function to get upcoming pickups that need reminders
CREATE OR REPLACE FUNCTION get_pickups_needing_reminders()
RETURNS TABLE (
  claim_id UUID,
  claimer_id UUID,
  food_id UUID,
  pickup_date DATE,
  pickup_time TIME,
  pickup_place VARCHAR,
  reminder_hours_before INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    fc.id,
    fc.claimer_id,
    fc.food_id,
    fc.pickup_date,
    fc.pickup_time,
    fc.pickup_place,
    fc.reminder_hours_before
  FROM food_claims fc
  JOIN users u ON fc.claimer_id = u.id
  WHERE fc.status = 'approved'
    AND fc.pickup_date IS NOT NULL
    AND fc.reminder_sent = false
    AND u.pickup_reminder_enabled = true
    AND (fc.pickup_date + fc.pickup_time) <= (NOW() + (fc.reminder_hours_before || ' hours')::INTERVAL)
    AND (fc.pickup_date + fc.pickup_time) > NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to mark reminder as sent
CREATE OR REPLACE FUNCTION mark_reminder_sent(claim_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE food_claims
  SET reminder_sent = true
  WHERE id = claim_uuid;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_food_claims_pickup_date 
  ON food_claims(pickup_date) 
  WHERE status = 'approved' AND reminder_sent = false;

CREATE INDEX IF NOT EXISTS idx_food_claims_reminder_lookup 
  ON food_claims(status, pickup_date, reminder_sent) 
  WHERE status = 'approved';
