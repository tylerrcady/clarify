create or replace function get_thread_similarity(
    thread1_id uuid,
    thread2_id uuid
)
returns float
language sql stable
as $$
    select 1 - (t1.embedding <=> t2.embedding) as similarity
    from threads t1, threads t2
    where t1.id = thread1_id and t2.id = thread2_id;
$$;