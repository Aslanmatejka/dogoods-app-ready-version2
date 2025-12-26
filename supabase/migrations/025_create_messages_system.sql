-- Create messages table for user-admin communication
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_from_admin BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversations table to track message threads
CREATE TABLE IF NOT EXISTS conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);

-- Add RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can see their own messages
CREATE POLICY "Users can view their own messages"
    ON messages FOR SELECT
    USING (auth.uid() = messages.user_id);

-- Users can insert their own messages (not from admin)
CREATE POLICY "Users can send messages"
    ON messages FOR INSERT
    WITH CHECK (auth.uid() = messages.user_id AND messages.is_from_admin = FALSE);

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
    ON messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin'
                 OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

-- Admins can send messages (as admin)
CREATE POLICY "Admins can send messages"
    ON messages FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin'
                 OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
        AND is_from_admin = TRUE
    );

-- Admins can update messages (mark as read)
CREATE POLICY "Admins can update messages"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin'
                 OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

-- Add RLS policies for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can see their own conversations
CREATE POLICY "Users can view their own conversations"
    ON conversations FOR SELECT
    USING (auth.uid() = conversations.user_id);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = conversations.user_id);

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
    ON conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin'
                 OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

-- Admins can update conversations (change status, etc)
CREATE POLICY "Admins can update conversations"
    ON conversations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin'
                 OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

-- Function to update conversation last_message_at
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when new message is added
CREATE TRIGGER update_conversation_on_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Comments for documentation
COMMENT ON TABLE messages IS 'Stores messages between users and admins';
COMMENT ON TABLE conversations IS 'Tracks message conversation threads';
COMMENT ON COLUMN messages.is_from_admin IS 'TRUE if message sent by admin, FALSE if sent by user';
COMMENT ON COLUMN messages.read_at IS 'Timestamp when message was read';
COMMENT ON COLUMN conversations.status IS 'open or closed - indicates if conversation is active';
