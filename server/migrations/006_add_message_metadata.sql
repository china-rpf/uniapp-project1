-- Add metadata column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comment
COMMENT ON COLUMN messages.metadata IS 'Additional metadata for file/audio messages (filename, size, etc.)';
