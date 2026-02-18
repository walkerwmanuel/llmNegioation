-- Migration: Add columns for message editing support
-- Run this migration on existing databases to add edit tracking

-- Add edited_at column (NULL when not edited)
ALTER TABLE messages ADD COLUMN edited_at TIMESTAMP;

-- Add original_content column (stores first version before any edits)
ALTER TABLE messages ADD COLUMN original_content TEXT;
