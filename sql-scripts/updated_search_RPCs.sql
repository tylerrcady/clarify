-- modified for ensuring global search only includes courses that a user is in
CREATE OR REPLACE FUNCTION match_content(
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int,
  course_filter uuid DEFAULT NULL,
  allowed_courses uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  created_at timestamptz,
  course_id uuid,
  similarity float,
  type text,
  parent_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.content,
    t.created_at,
    t.course_id,
    1 - (t.embedding <=> query_embedding) as similarity,
    'thread' as type,
    NULL::uuid as parent_id
  FROM threads t
  WHERE 
    1 - (t.embedding <=> query_embedding) > similarity_threshold
    AND (
      (course_filter IS NOT NULL AND t.course_id = course_filter)
      OR 
      (course_filter IS NULL AND allowed_courses IS NOT NULL AND t.course_id = ANY(allowed_courses))
    )
  UNION ALL
  SELECT
    c.id,
    '' as title,
    c.content,
    c.created_at,
    t.course_id,
    1 - (c.embedding <=> query_embedding) as similarity,
    'comment' as type,
    c.thread_id as parent_id
  FROM comments c
  JOIN threads t ON c.thread_id = t.id
  WHERE 
    1 - (c.embedding <=> query_embedding) > similarity_threshold
    AND (
      (course_filter IS NOT NULL AND t.course_id = course_filter)
      OR 
      (course_filter IS NULL AND allowed_courses IS NOT NULL AND t.course_id = ANY(allowed_courses))
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION full_text_search(
  search_query text,
  match_count int,
  course_filter uuid DEFAULT NULL,
  allowed_courses uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  created_at timestamptz,
  course_id uuid,
  similarity double precision,
  type text,
  parent_id uuid
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.content,
    t.created_at,
    t.course_id,
    GREATEST(
      similarity(lower(t.title), lower(search_query)),
      similarity(lower(t.content), lower(search_query))
    )::double precision as similarity,
    'thread' as type,
    NULL::uuid as parent_id
  FROM threads t
  WHERE 
    to_tsvector('english', t.title || ' ' || t.content) @@ plainto_tsquery('english', search_query)
    AND (
      (course_filter IS NOT NULL AND t.course_id = course_filter)
      OR 
      (course_filter IS NULL AND allowed_courses IS NOT NULL AND t.course_id = ANY(allowed_courses))
    )
  UNION ALL
  SELECT
    c.id,
    '' as title,
    c.content,
    c.created_at,
    t.course_id,
    similarity(lower(c.content), lower(search_query))::double precision as similarity,
    'comment' as type,
    c.thread_id as parent_id
  FROM comments c
  JOIN threads t ON c.thread_id = t.id
  WHERE 
    to_tsvector('english', c.content) @@ plainto_tsquery('english', search_query)
    AND (
      (course_filter IS NOT NULL AND t.course_id = course_filter)
      OR 
      (course_filter IS NULL AND allowed_courses IS NOT NULL AND t.course_id = ANY(allowed_courses))
    )
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;