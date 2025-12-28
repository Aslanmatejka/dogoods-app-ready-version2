/*
  # Create donation schedules and reminders system
  
  1. New Tables
    - `donation_schedules`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text) - descriptive name for the schedule
      - `amount` (numeric) - donation amount
      - `frequency` (text) - daily, weekly, monthly, yearly
      - `start_date` (date) - when to start
      - `end_date` (date, optional) - when to stop
      - `next_donation_date` (date) - next scheduled donation
      - `status` (text) - active, paused, cancelled, completed
      - `payment_method` (text) - payment method info
      - `recipient_type` (text) - organization, food_bank, general, etc.
      - `recipient_id` (uuid, optional) - specific recipient if applicable
      - `notes` (text, optional) - user notes
      - `reminder_enabled` (boolean) - send reminders
      - `reminder_days_before` (integer) - days before to remind
      - `last_processed_at` (timestamptz, optional) - last donation time
      - `total_donated` (numeric) - running total
      - `donation_count` (integer) - number of donations made
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `donation_history`
      - `id` (uuid, primary key)
      - `schedule_id` (uuid, foreign key to donation_schedules)
      - `user_id` (uuid, foreign key to users)
      - `amount` (numeric)
      - `status` (text) - completed, failed, pending
      - `payment_method` (text)
      - `recipient_type` (text)
      - `recipient_id` (uuid, optional)
      - `transaction_id` (text, optional) - external payment ID
      - `error_message` (text, optional)
      - `processed_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can manage their own schedules
    - Users can view their own donation history
    - Admins can view all schedules and history
*/

-- Create donation_schedules table
CREATE TABLE IF NOT EXISTS donation_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  next_donation_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'completed')),
  payment_method text,
  recipient_type text NOT NULL DEFAULT 'general' CHECK (recipient_type IN ('general', 'organization', 'food_bank', 'community', 'specific_listing')),
  recipient_id uuid,
  notes text,
  reminder_enabled boolean DEFAULT true,
  reminder_days_before integer DEFAULT 1 CHECK (reminder_days_before >= 0),
  last_processed_at timestamptz,
  total_donated numeric(10,2) DEFAULT 0,
  donation_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create donation_history table
CREATE TABLE IF NOT EXISTS donation_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES donation_schedules(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'failed', 'pending', 'cancelled')),
  payment_method text,
  recipient_type text NOT NULL,
  recipient_id uuid,
  transaction_id text,
  error_message text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_donation_schedules_user_id ON donation_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_schedules_status ON donation_schedules(status);
CREATE INDEX IF NOT EXISTS idx_donation_schedules_next_date ON donation_schedules(next_donation_date);
CREATE INDEX IF NOT EXISTS idx_donation_history_schedule_id ON donation_history(schedule_id);
CREATE INDEX IF NOT EXISTS idx_donation_history_user_id ON donation_history(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_history_status ON donation_history(status);

-- Enable RLS
ALTER TABLE donation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for donation_schedules

-- Users can view their own schedules
CREATE POLICY "Users can view own donation schedules"
  ON donation_schedules
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own schedules
CREATE POLICY "Users can create own donation schedules"
  ON donation_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own schedules
CREATE POLICY "Users can update own donation schedules"
  ON donation_schedules
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own schedules
CREATE POLICY "Users can delete own donation schedules"
  ON donation_schedules
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all schedules
CREATE POLICY "Admins can view all donation schedules"
  ON donation_schedules
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Admins can update all schedules
CREATE POLICY "Admins can update all donation schedules"
  ON donation_schedules
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- RLS Policies for donation_history

-- Users can view their own history
CREATE POLICY "Users can view own donation history"
  ON donation_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only system (via service role) can insert history
CREATE POLICY "Service role can insert donation history"
  ON donation_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Admins can view all history
CREATE POLICY "Admins can view all donation history"
  ON donation_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_donation_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_donation_schedules_updated_at ON donation_schedules;
CREATE TRIGGER trigger_donation_schedules_updated_at
  BEFORE UPDATE ON donation_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_donation_schedule_updated_at();
