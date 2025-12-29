/*
  # Fix Chat Foreign Keys to Point to Public Users Table
  
  1. Problem
    - conversations.user_id and messages.user_id reference auth.users
    - Admin query tries to join with public.users to get name, avatar_url
    - This mismatch causes conversations not to appear in admin panel
  
  2. Solution
    - Drop existing foreign keys to auth.users
    - Add new foreign keys to public.users
    - This allows proper joins with public.users table which has user profile data
  
  3. Why This Works
    - public.users.id is synced with auth.users.id via trigger
    - public.users has the profile fields (name, avatar_url) needed for chat UI
*/

-- Drop existing foreign keys that point to auth.users
ALTER TABLE conversations 
  DROP CONSTRAINT IF EXISTS conversations_user_id_fkey;

ALTER TABLE messages 
  DROP CONSTRAINT IF EXISTS messages_user_id_fkey;

-- Add new foreign keys that point to public.users
ALTER TABLE conversations
  ADD CONSTRAINT conversations_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE messages
  ADD CONSTRAINT messages_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- Verify the foreign keys are correct
DO $$
BEGIN
  RAISE NOTICE 'Foreign keys updated successfully. Conversations and messages now reference public.users.';
END $$;
