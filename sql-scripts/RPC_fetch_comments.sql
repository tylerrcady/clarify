CREATE OR REPLACE FUNCTION get_comments_with_anonymous_names(thread_id_param UUID)
RETURNS TABLE (
    id UUID,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    creator_role TEXT,
    thread_id UUID,
    creator_id UUID,
    anonymous_name TEXT
) AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        c.id, 
        c.content, 
        c.created_at, 
        c.creator_role, 
        c.thread_id, 
        c.creator_id, 
        t.anonymous_name
    FROM comments c
    LEFT JOIN thread_anonymous_names t 
        ON c.thread_id = t.thread_id 
        AND c.creator_id = t.user_id
    WHERE c.thread_id = thread_id_param
    ORDER BY c.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_comments_with_anonymous_names(UUID) TO anon, authenticated, service_role;