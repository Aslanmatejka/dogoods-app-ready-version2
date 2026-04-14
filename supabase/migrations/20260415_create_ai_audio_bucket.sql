-- Create the ai-audio storage bucket for TTS audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'ai-audio',
    'ai-audio',
    true,
    5242880,  -- 5MB max per file
    ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;

-- Allow the service role to upload files
CREATE POLICY "Service role can upload ai-audio"
    ON storage.objects FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'ai-audio');

-- Allow public read access to ai-audio files
CREATE POLICY "Public read access to ai-audio"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'ai-audio');

-- Allow service role to delete old audio files
CREATE POLICY "Service role can delete ai-audio"
    ON storage.objects FOR DELETE
    TO service_role
    USING (bucket_id = 'ai-audio');
