CREATE OR REPLACE FUNCTION get_threads_with_votes(course_id_param UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  tags TEXT[],
  creator_id UUID,
  creator_role TEXT,
  course_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  comment_count BIGINT,
  vote_score BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.content,
    t.tags,
    t.creator_id,
    t.creator_role,
    t.course_id,
    t.created_at,
    t.updated_at,
    COUNT(DISTINCT c.id) AS comment_count,
    COALESCE(SUM(v.vote_type), 0) AS vote_score
  FROM threads t
  LEFT JOIN comments c ON t.id = c.thread_id
  LEFT JOIN thread_votes v ON t.id = v.thread_id
  WHERE t.course_id = course_id_param
  GROUP BY t.id
  ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql;