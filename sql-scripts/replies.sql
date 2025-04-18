ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) NULL;
CREATE INDEX idx_comments_parent_id ON comments(parent_id);

CREATE OR REPLACE FUNCTION get_comments_with_anonymous_names_and_replies(thread_id_param UUID)
RETURNS TABLE (
    id UUID,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    creator_role TEXT,
    thread_id UUID,
    creator_id UUID,
    anonymous_name TEXT,
    parent_id UUID,
    reply_count INTEGER
) AS $$
BEGIN
    RETURN QUERY 
    WITH reply_counts AS (
        SELECT c.parent_id, COUNT(*) as count
        FROM comments c
        WHERE c.parent_id IS NOT NULL AND c.thread_id = thread_id_param
        GROUP BY c.parent_id
    )
    SELECT 
        c.id, 
        c.content, 
        c.created_at, 
        c.creator_role, 
        c.thread_id, 
        c.creator_id, 
        t.anonymous_name,
        c.parent_id,
        COALESCE(rc.count, 0)::INTEGER as reply_count
    FROM comments c
    LEFT JOIN thread_anonymous_names t 
        ON c.thread_id = t.thread_id 
        AND c.creator_id = t.user_id
    LEFT JOIN reply_counts rc
        ON c.id = rc.parent_id
    WHERE c.thread_id = thread_id_param
    ORDER BY 
        CASE WHEN c.parent_id IS NULL THEN 0 ELSE 1 END,
        c.parent_id,
        c.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_comments_with_anonymous_names_and_replies(UUID) TO anon, authenticated, service_role;