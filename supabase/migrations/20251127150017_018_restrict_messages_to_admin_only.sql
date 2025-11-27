/*
  # Restrict messages to user-admin communication only

  1. Changes
    - Restrict users to only send messages to admins
    - Users cannot message other regular users
    - Only admins can be recipients (or null for any admin)

  2. Security
    - Users can only send messages where recipient is an admin
    - Users can view their own messages to/from admins
    - Admins can view all messages
*/

-- Drop the permissive policies
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;

-- Users can view messages they sent or received from admins
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = recipient_id OR
    (recipient_id IS NULL AND NOT is_admin_sender)
  );

-- Users can only send messages to admins
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
        WHERE users.id = recipient_id
        AND users.is_admin = true
      )
    )
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