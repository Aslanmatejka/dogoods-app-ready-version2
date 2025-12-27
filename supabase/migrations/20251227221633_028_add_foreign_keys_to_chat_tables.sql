/*
  # Add foreign key constraints to chat tables
  
  1. Changes
    - Add foreign key from conversations.user_id to users.id (not auth.users)
    - Add foreign key from messages.conversation_id to conversations.id
    - Add foreign key from messages.user_id to users.id (not auth.users)
  
  2. Reason
    - Supabase queries use public.users table for joins
    - Foreign keys enable proper relationship queries
    - Ensures data integrity
*/

-- Add foreign key from conversations.user_id to users.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'conversations_user_id_fkey'
  ) THEN
    ALTER TABLE conversations
      ADD CONSTRAINT conversations_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from messages.conversation_id to conversations.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_conversation_id_fkey
      FOREIGN KEY (conversation_id)
      REFERENCES conversations(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key from messages.user_id to users.id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_user_id_fkey'
  ) THEN
    ALTER TABLE messages
      ADD CONSTRAINT messages_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Recreate indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
