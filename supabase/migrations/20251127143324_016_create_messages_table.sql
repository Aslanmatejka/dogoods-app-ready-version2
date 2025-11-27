/*
  # Create messages table for user-admin communication

  1. New Tables
    - `messages`
      - `id` (uuid, primary key) - Unique message identifier
      - `sender_id` (uuid, references auth.users) - User who sent the message
      - `recipient_id` (uuid, references auth.users, nullable) - Admin recipient (null for messages to any admin)
      - `message` (text) - Message content
      - `is_admin_sender` (boolean) - True if sender is admin
      - `conversation_id` (uuid) - Groups messages into conversations
      - `read` (boolean) - Whether message has been read
      - `created_at` (timestamptz) - When message was sent
      - `updated_at` (timestamptz) - When message was last updated

  2. Security
    - Enable RLS on `messages` table
    - Users can read their own messages (sent or received)
    - Users can create messages to admins
    - Admins can read all messages
    - Admins can create messages to users
    - Users can update read status on messages they received
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
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
    is_admin_sender = false
  );

-- Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id OR (recipient_id IS NULL AND NOT is_admin_sender))
  WITH CHECK (auth.uid() = recipient_id OR (recipient_id IS NULL AND NOT is_admin_sender));

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

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS messages_updated_at ON messages;

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_messages_updated_at();