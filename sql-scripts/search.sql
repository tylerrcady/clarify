-- enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- add embedding columns
ALTER TABLE threads ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE comments ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- create indexes for full text search
CREATE INDEX IF NOT EXISTS threads_content_trgm_idx ON threads USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS threads_title_trgm_idx ON threads USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS comments_content_trgm_idx ON comments USING GIN (to_tsvector('english', content));

-- create function for semantic search
CREATE OR REPLACE FUNCTION match_content(
  query_embedding vector(1536),
  similarity_threshold float,
  match_count int,
  course_filter uuid DEFAULT NULL
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
    AND (course_filter IS NULL OR t.course_id = course_filter)
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
    AND (course_filter IS NULL OR t.course_id = course_filter)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION full_text_search(
  search_query text,
  match_count int,
  course_filter uuid DEFAULT NULL
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
    AND (course_filter IS NULL OR t.course_id = course_filter))
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
    AND (course_filter IS NULL OR t.course_id = course_filter)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;