create or replace function batch_get_thread_similarities(
    thread_ids uuid[]
)
returns table (thread1_id uuid, thread2_id uuid, similarity float)
language sql stable
as $$
    select t1.id as thread1_id, t2.id as thread2_id, 1 - (t1.embedding <=> t2.embedding) as similarity
    from threads t1, threads t2
    where t1.id <> t2.id
    and t1.id = any(thread_ids)
    and t2.id = any(thread_ids);
$$;