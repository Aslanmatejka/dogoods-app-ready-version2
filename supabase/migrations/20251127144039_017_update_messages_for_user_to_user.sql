/*
  # Update messages table to support user-to-user chat

  1. Changes
    - Remove restriction on users to only send to admins
    - Allow all authenticated users to message each other
    - Update policies to support peer-to-peer messaging

  2. Security
    - Users can send messages to any other user
    - Users can view messages in conversations they're part of
    - Users can mark their received messages as read
*/

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can send messages to admins" ON messages;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;

-- Users can view messages they sent or received (including null recipient messages)
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id OR
    (recipient_id IS NULL AND NOT is_admin_sender)
  );

-- Users can send messages to any user
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
  );

-- Users can mark messages as read if they are the recipient
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