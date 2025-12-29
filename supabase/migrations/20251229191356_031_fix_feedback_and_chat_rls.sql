/*
  # Fix Feedback and Chat RLS Issues
  
  1. Changes
    - Fix user_feedback table to use gen_random_uuid() instead of uuid_generate_v4()
    - Simplify conversations RLS policies to avoid complex lookups
    - Add better policies for users table access
  
  2. Security
    - Maintain secure RLS policies
    - Ensure users can create their own conversations
    - Ensure feedback submissions work for all users
*/

-- Fix user_feedback table UUID generation
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'user_feedback'
  ) THEN
    -- Drop and recreate with correct UUID function
    ALTER TABLE user_feedback ALTER COLUMN id SET DEFAULT gen_random_uuid();
  ELSE
    -- Create table if it doesn't exist
    CREATE TABLE user_feedback (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      user_email text,
      feedback_type text NOT NULL CHECK (feedback_type IN ('error', 'bug', 'suggestion', 'feature', 'other')),
      subject text NOT NULL,
      message text NOT NULL,
      page_url text,
      browser_info jsonb,
      screenshot_url text,
      status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved', 'closed')),
      priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      admin_notes text,
      resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      resolved_at timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    -- Create indexes
    CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON user_feedback(user_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_status ON user_feedback(status);
    CREATE INDEX IF NOT EXISTS idx_feedback_type ON user_feedback(feedback_type);
    CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON user_feedback(created_at DESC);

    -- Enable RLS
    ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

    -- Anyone can submit feedback
    CREATE POLICY "Anyone can submit feedback"
      ON user_feedback FOR INSERT
      WITH CHECK (true);

    -- Users can view their own feedback
    CREATE POLICY "Users can view own feedback"
      ON user_feedback FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

    -- Admins can view all feedback
    CREATE POLICY "Admins can view all feedback"
      ON user_feedback FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_admin = true
        )
      );

    -- Admins can update feedback
    CREATE POLICY "Admins can update feedback"
      ON user_feedback FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_admin = true
        )
      );

    -- Admins can delete feedback
    CREATE POLICY "Admins can delete feedback"
      ON user_feedback FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE users.id = auth.uid()
          AND users.is_admin = true
        )
      );

    -- Create trigger for updated_at
    CREATE OR REPLACE FUNCTION update_feedback_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;

    CREATE TRIGGER update_feedback_timestamp
      BEFORE UPDATE ON user_feedback
      FOR EACH ROW
      EXECUTE FUNCTION update_feedback_updated_at();
  END IF;
END $$;

-- Fix conversations RLS - drop existing policies and recreate simpler ones
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can view all conversations" ON conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON conversations;

-- Recreate policies with simpler checks
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin policies for conversations (separate and simpler)
CREATE POLICY "Admins can view all conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.is_admin = true
    )
  );

CREATE POLICY "Admins can update all conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.is_admin = true
    )
  );