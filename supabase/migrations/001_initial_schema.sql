-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create polls table
CREATE TABLE polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL CHECK (length(trim(question)) >= 10 AND length(trim(question)) <= 280),
    options TEXT[] NOT NULL CHECK (
        array_length(options, 1) >= 2 AND 
        array_length(options, 1) <= 10 AND
        -- Check each option is between 1-80 characters
        (SELECT bool_and(length(trim(option)) >= 1 AND length(trim(option)) <= 80) 
         FROM unnest(options) AS option)
    ),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- Create votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL CHECK (option_index >= 0),
    voter_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure option_index is valid for the poll's options array
    CONSTRAINT valid_option_index CHECK (
        option_index < (SELECT array_length(options, 1) FROM polls WHERE id = poll_id)
    )
);

-- Create indexes for performance
CREATE INDEX idx_polls_created_at ON polls(created_at DESC);
CREATE INDEX idx_polls_created_by ON polls(created_by);
CREATE INDEX idx_polls_expires_at ON polls(expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX idx_votes_poll_id ON votes(poll_id);
CREATE INDEX idx_votes_voter_id ON votes(voter_id) WHERE voter_id IS NOT NULL;
CREATE INDEX idx_votes_created_at ON votes(created_at);

-- Enable Row Level Security
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for polls table
-- Anyone can read polls
CREATE POLICY "Anyone can read polls" ON polls
    FOR SELECT USING (true);

-- Only authenticated users can create polls
CREATE POLICY "Authenticated users can create polls" ON polls
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Only poll creators can update their polls
CREATE POLICY "Poll creators can update their polls" ON polls
    FOR UPDATE USING (auth.uid() = created_by);

-- Only poll creators can delete their polls
CREATE POLICY "Poll creators can delete their polls" ON polls
    FOR DELETE USING (auth.uid() = created_by);

-- RLS Policies for votes table
-- Anyone can read votes
CREATE POLICY "Anyone can read votes" ON votes
    FOR SELECT USING (true);

-- Anyone can create votes (anonymous voting allowed)
CREATE POLICY "Anyone can create votes" ON votes
    FOR INSERT WITH CHECK (
        -- If voter_id is provided, it must match the authenticated user
        (voter_id IS NULL) OR (auth.uid() = voter_id)
    );

-- Users can only update their own votes
CREATE POLICY "Users can update their own votes" ON votes
    FOR UPDATE USING (auth.uid() = voter_id);

-- Users can only delete their own votes
CREATE POLICY "Users can delete their own votes" ON votes
    FOR DELETE USING (auth.uid() = voter_id);

-- Create a function to get poll results
CREATE OR REPLACE FUNCTION get_poll_results(poll_uuid UUID)
RETURNS TABLE (
    option_index INTEGER,
    option_text TEXT,
    vote_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.option_index,
        p.options[v.option_index + 1] as option_text, -- PostgreSQL arrays are 1-indexed
        COUNT(v.id) as vote_count
    FROM votes v
    JOIN polls p ON v.poll_id = p.id
    WHERE p.id = poll_uuid
    GROUP BY v.option_index, p.options[v.option_index + 1]
    ORDER BY v.option_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_poll_results(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_poll_results(UUID) TO anon;

-- Create a function to check if a poll is expired
CREATE OR REPLACE FUNCTION is_poll_expired(poll_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM polls 
        WHERE id = poll_uuid 
        AND expires_at IS NOT NULL 
        AND expires_at < NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_poll_expired(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_poll_expired(UUID) TO anon;
