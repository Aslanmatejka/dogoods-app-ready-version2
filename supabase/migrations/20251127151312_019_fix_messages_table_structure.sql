/*
  # Fix messages table structure

  1. Changes
    - Drop the existing messages table that has conflicting columns
    - Recreate messages table with correct structure for user-admin chat
    - Restore RLS policies

  2. Security
    - Enable RLS
    - Maintain all previous security policies
*/

-- Drop existing table and policies
DROP TABLE IF EXISTS messages CASCADE;

-- Create messages table with correct structure
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_admin_sender boolean DEFAULT false,
  conversation_id uuid NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id OR
    (recipient_id IS NULL AND NOT is_admin_sender)
  );

-- Users can send messages to admins
CREATE POLICY "Users can send messages to admins"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    is_admin_sender = false AND
    (
      recipient_id IS NULL OR
      EXISTS (
        SELECT 1 FROM users
        WHERE users.id = messages.recipient_id
        AND users.is_admin = true
      )
    )
  );

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = recipient_id OR 
    (recipient_id IS NULL AND NOT is_admin_sender)
  )
  WITH CHECK (
    auth.uid() = recipient_id OR 
    (recipient_id IS NULL AND NOT is_admin_sender)
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Admins can send messages to users
CREATE POLICY "Admins can send messages to users"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    ) AND
    is_admin_sender = true
  );

-- Admins can mark messages as read
CREATE POLICY "Admins can mark messages as read"
  ON messages FOR UPDATE
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

-- Create indexes for better query performance
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();